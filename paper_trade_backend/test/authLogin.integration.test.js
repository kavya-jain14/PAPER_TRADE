const { describe, test, before, after, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mongoUri = process.env.PAPERTRADE_TEST_MONGODB_URI;

describe('login lockout against isolated MongoDB', { skip: !mongoUri }, () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'local-login-access-secret';
  process.env.JWT_REFRESH_SECRET = 'local-login-refresh-secret';

  const User = require('../models/User');
  const email = 'login-owner@proton.me';
  const password = 'Local owner password 123!';
  let server;
  let baseUrl;
  let user;

  before(async () => {
    assert.match(mongoUri, /^mongodb:\/\/(?:127\.0\.0\.1|localhost|\[::1\]):\d+\/?$/);
    await mongoose.connect(mongoUri, { dbName: `papertrade_auth_test_${crypto.randomBytes(12).toString('hex')}` });
    await User.init();
    const app = express();
    app.use(express.json());
    app.use('/auth', require('../routes/auth'));
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}/auth/login`;
  });

  after(async () => {
    mock.restoreAll();
    if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    mock.restoreAll();
    await User.deleteMany({});
    user = await User.create({ email, name: 'Login Owner', emailVerified: true, password: bcrypt.hashSync(password, 4) });
  });

  function login(value = password) {
    return fetch(baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: value }) });
  }

  test('eight overlapping wrong passwords acquire one five-attempt lock', async () => {
    // Synchronize password comparisons after real account reads; database writes stay real.
    const compare = bcrypt.compare.bind(bcrypt);
    let waiting = 0;
    let release;
    const barrier = new Promise((resolve) => { release = resolve; });
    mock.method(bcrypt, 'compare', async (...args) => {
      if (++waiting === 8) release();
      await barrier;
      return compare(...args);
    });
    const responses = await Promise.all(Array.from({ length: 8 }, () => login('incorrect password')));
    mock.restoreAll();
    assert.ok(responses.every((response) => response.status === 401));
    const stored = await User.findById(user._id);
    assert.equal(stored.failedLoginAttempts, 5);
    assert.ok(stored.lockedUntil > new Date());
    const response = await login();
    assert.equal(response.status, 429);
    assert.equal((await response.json()).code, 'ACCOUNT_LOCKED');
    assert.equal(response.headers.has('set-cookie'), false);
  });

  test('wrong passwords do not extend an active lock or change its counter', async () => {
    const lockedUntil = new Date(Date.now() + 5 * 60000);
    await User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: 5, lockedUntil } });
    assert.equal((await login('incorrect password')).status, 401);
    const stored = await User.findById(user._id);
    assert.equal(stored.failedLoginAttempts, 5);
    assert.equal(stored.lockedUntil.getTime(), lockedUntil.getTime());
  });

  test('the first wrong password after lock expiry starts a fresh attempt window', async () => {
    await User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: 5, lockedUntil: new Date(Date.now() - 1000) } });
    assert.equal((await login('incorrect password')).status, 401);
    const stored = await User.findById(user._id);
    assert.equal(stored.failedLoginAttempts, 1);
    assert.equal(stored.lockedUntil, null);
    assert.equal((await login()).status, 200);
    assert.equal((await User.findById(user._id)).failedLoginAttempts, 0);
  });

  test('a delayed correct-password request cannot clear a lock acquired while it waits', async () => {
    const compare = bcrypt.compare.bind(bcrypt);
    let started;
    let release;
    const entered = new Promise((resolve) => { started = resolve; });
    const barrier = new Promise((resolve) => { release = resolve; });
    mock.method(bcrypt, 'compare', async (value, hash) => {
      if (value === password) {
        started();
        await barrier;
      }
      return compare(value, hash);
    });
    const pending = login();
    try {
      await entered;
      for (let attempt = 0; attempt < 5; attempt++) assert.equal((await login('incorrect password')).status, 401);
      assert.ok((await User.findById(user._id)).lockedUntil > new Date());
    } finally {
      release();
    }
    const response = await pending;
    assert.equal(response.status, 429);
    assert.equal(response.headers.has('set-cookie'), false);
    const stored = await User.findById(user._id);
    assert.equal(stored.sessionVersion, 0);
    assert.equal(stored.failedLoginAttempts, 5);
    assert.ok(stored.lockedUntil > new Date());
  });
});
