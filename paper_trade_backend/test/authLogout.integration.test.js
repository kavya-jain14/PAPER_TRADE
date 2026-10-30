const { describe, test, before, after, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mongoUri = process.env.PAPERTRADE_TEST_MONGODB_URI;

describe('session-specific logout against isolated MongoDB', { skip: !mongoUri }, () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'local-logout-access-secret';
  process.env.JWT_REFRESH_SECRET = 'local-logout-refresh-secret';

  const User = require('../models/User');
  const email = 'logout-owner@proton.me';
  const password = 'Local owner password 123!';
  let server;
  let baseUrl;
  let user;

  before(async () => {
    assert.match(mongoUri, /^mongodb:\/\/(?:127\.0\.0\.1|localhost|\[::1\]):\d+\/?$/);
    await mongoose.connect(mongoUri, { dbName: `papertrade_auth_test_${crypto.randomBytes(12).toString('hex')}` });
    await User.init();
    const app = express();
    app.use(express.json(), cookieParser());
    app.use('/auth', require('../routes/auth'));
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}/auth`;
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
    user = await User.create({ email, name: 'Logout Owner', emailVerified: true, password: bcrypt.hashSync(password, 4) });
  });

  function cookie(response, name) {
    const value = response.headers.getSetCookie().find((entry) => entry.startsWith(`${name}=`));
    assert.ok(value);
    return value.split(';')[0];
  }

  async function login() {
    const response = await fetch(`${baseUrl}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    assert.equal(response.status, 200);
    return { access: cookie(response, 'pt_at'), refresh: cookie(response, 'pt_rt') };
  }

  const logout = (value) => fetch(`${baseUrl}/logout`, { method: 'POST', headers: { Cookie: value } });
  const refresh = (value) => fetch(`${baseUrl}/refresh`, { method: 'POST', headers: { Cookie: value } });

  test('stale access and refresh cookies leave a newer login usable', async () => {
    const original = await login();
    const replacement = await login();
    const before = await User.findById(user._id);
    for (const value of [original.access, original.refresh]) {
      assert.equal((await logout(value)).status, 200);
      const stored = await User.findById(user._id);
      assert.equal(stored.sessionVersion, before.sessionVersion);
      assert.equal(stored.refreshToken, before.refreshToken);
    }
    assert.equal((await refresh(replacement.refresh)).status, 200);
  });

  test('logout paused before its database write cannot revoke a login established meanwhile', { timeout: 15000 }, async () => {
    for (const kind of ['access', 'refresh']) {
      const original = await login();
      let entered;
      let release;
      const started = new Promise((resolve) => { entered = resolve; });
      const barrier = new Promise((resolve) => { release = resolve; });
      for (const method of ['findByIdAndUpdate', 'findOneAndUpdate']) {
        const update = User[method].bind(User);
        mock.method(User, method, async (...args) => {
          if (args[1].$set?.refreshToken === '') {
            entered();
            await barrier;
          }
          return update(...args);
        });
      }
      const pending = logout(original[kind]);
      let replacement;
      let before;
      try {
        await started;
        replacement = await login();
        before = await User.findById(user._id);
      } finally {
        release();
      }
      assert.equal((await pending).status, 200);
      mock.restoreAll();
      const stored = await User.findById(user._id);
      assert.equal(stored.sessionVersion, before.sessionVersion);
      assert.equal(stored.refreshToken, before.refreshToken);
      assert.equal((await refresh(replacement.refresh)).status, 200);
    }
  });
});
