const { describe, test, before, after, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mongoUri = process.env.PAPERTRADE_TEST_MONGODB_URI;

describe('email verification against isolated MongoDB', { skip: !mongoUri }, () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'local-verification-access-secret';
  process.env.JWT_REFRESH_SECRET = 'local-verification-refresh-secret';
  process.env.EMAIL_VERIFICATION_SECRET = 'local-verification-code-secret';

  const User = require('../models/User');
  const AuthChallenge = require('../models/AuthChallenge');
  const code = '123456';
  const email = 'verified-owner@proton.me';
  let server;
  let baseUrl;
  let challenge;

  before(async () => {
    // Never use an application database or credentials, even if an env file is loaded.
    assert.match(mongoUri, /^mongodb:\/\/(?:127\.0\.0\.1|localhost|\[::1\]):\d+\/?$/);
    await mongoose.connect(mongoUri, { dbName: `papertrade_auth_test_${crypto.randomBytes(12).toString('hex')}` });
    await Promise.all([User.init(), AuthChallenge.init()]);
    const app = express();
    app.use(express.json());
    app.use('/auth', require('../routes/auth'));
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}/auth/verify-email`;
  });

  after(async () => {
    mock.restoreAll();
    if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    mock.restoreAll();
    await Promise.all([User.deleteMany({}), AuthChallenge.deleteMany({})]);
    const challengeId = crypto.randomBytes(24).toString('hex');
    challenge = await AuthChallenge.create({
      challengeId,
      purpose: 'registration',
      email,
      name: 'Verified Owner',
      pendingPasswordHash: bcrypt.hashSync('Owner local test password 123!', 4),
      codeHash: crypto.createHmac('sha256', process.env.EMAIL_VERIFICATION_SECRET).update(`${challengeId}:${code}`).digest('hex'),
      attempts: 0,
      lastSentAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
    });
  });

  function submit(value = code) {
    return fetch(baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeId: challenge.challengeId, code: value }) });
  }

  function overlapAttempts(count) {
    // Start the real MongoDB reservations together, without stubbing their results.
    const findOneAndUpdate = AuthChallenge.findOneAndUpdate.bind(AuthChallenge);
    let attempts = 0;
    let release;
    const barrier = new Promise((resolve) => { release = resolve; });
    mock.method(AuthChallenge, 'findOneAndUpdate', async (...args) => {
      if (++attempts === count) release();
      await barrier;
      return findOneAndUpdate(...args);
    });
  }

  test('eight simultaneous wrong codes consume only five attempts', async () => {
    overlapAttempts(8);
    const responses = await Promise.all(Array.from({ length: 8 }, () => submit('654321')));
    assert.deepEqual(responses.map((response) => response.status).sort(), [400, 400, 400, 400, 400, 429, 429, 429]);
    assert.equal((await AuthChallenge.findById(challenge._id)).attempts, 5);
    const correct = await submit();
    assert.equal(correct.status, 429);
    assert.equal((await correct.json()).code, 'CODE_ATTEMPTS_EXCEEDED');
    assert.equal(await User.countDocuments(), 0);
  });

  test('a registration code creates exactly one account under simultaneous verification', async () => {
    overlapAttempts(8);
    const responses = await Promise.all(Array.from({ length: 8 }, () => submit()));
    assert.equal(responses.filter((response) => response.status === 201).length, 1);
    assert.ok(responses.every((response) => [201, 410, 429].includes(response.status)));
    assert.equal(await User.countDocuments({ email, emailVerified: true }), 1);
    assert.equal(await AuthChallenge.countDocuments(), 0);
    assert.equal((await submit()).status, 410);
  });

  test('an existing-account code establishes only one session and cannot be replayed', async () => {
    const user = await User.create({ email, name: 'Existing Owner', emailVerified: false });
    await AuthChallenge.updateOne({ _id: challenge._id }, { $set: { purpose: 'existing-account', userId: user._id } });
    overlapAttempts(8);
    const responses = await Promise.all(Array.from({ length: 8 }, () => submit()));
    assert.equal(responses.filter((response) => response.status === 200).length, 1);
    assert.ok(responses.every((response) => [200, 410, 429].includes(response.status)));
    assert.equal(responses.filter((response) => response.headers.has('set-cookie')).length, 1);
    const verified = await User.findById(user._id);
    assert.equal(verified.emailVerified, true);
    assert.equal(verified.sessionVersion, 1);
    assert.equal((await submit()).status, 410);
    assert.equal((await User.findById(user._id)).sessionVersion, 1);
  });

  test('the fifth allowed attempt can succeed and expired challenges fail closed', async () => {
    await AuthChallenge.updateOne({ _id: challenge._id }, { $set: { attempts: 4 } });
    assert.equal((await submit()).status, 201);
    assert.equal((await submit()).status, 410);
    await AuthChallenge.create({ ...challenge.toObject(), _id: new mongoose.Types.ObjectId(), expiresAt: new Date(Date.now() - 1000) });
    assert.equal((await submit()).status, 410);
    assert.equal(await User.countDocuments(), 1);
  });
});
