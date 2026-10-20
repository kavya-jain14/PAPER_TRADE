const { test, before, after, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const bcrypt = require('bcryptjs');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'registration-access-secret-for-tests-only';
process.env.JWT_REFRESH_SECRET = 'registration-refresh-secret-for-tests-only';
process.env.EMAIL_VERIFICATION_SECRET = 'registration-code-secret-for-tests-only';

const User = require('../models/User');
const AuthChallenge = require('../models/AuthChallenge');
const emailPolicy = require('../security/emailPolicy');
const verificationEmail = require('../services/verificationEmail');
let challenges;
let users;
let sent;
let server;
let baseUrl;
let nextId = 0;
const email = 'trader@proton.me';
const initialPassword = 'Earlier password from another client 123!';
const ownerPassword = 'Correct mailbox owner password 456!';

before(async () => {
  mock.method(emailPolicy, 'domainAcceptsEmail', async () => ({ deliverable: true }));
  mock.method(verificationEmail, 'sendVerificationEmail', async (message) => sent.push(message));
  mock.method(User, 'exists', async (filter) => users.some((user) => user.email === filter.email));
  mock.method(User, 'create', async (values) => {
    const user = { _id: `user-${++nextId}`, virtualBalance: 1000000, ...values };
    users.push(user);
    return user;
  });
  mock.method(AuthChallenge, 'findOne', (filter) => {
    if (filter.challengeId) return Promise.resolve(challenges.find((item) => item.challengeId === filter.challengeId) || null);
    return { sort: async () => challenges.find((item) => item.purpose === filter.purpose && item.email === filter.email && item.expiresAt > filter.expiresAt.$gt) || null };
  });
  mock.method(AuthChallenge, 'deleteMany', async (filter) => {
    challenges = challenges.filter((item) => item.purpose !== filter.purpose || item.email !== filter.email);
  });
  mock.method(AuthChallenge, 'deleteOne', async (filter) => {
    challenges = challenges.filter((item) => item._id !== filter._id);
  });
  mock.method(AuthChallenge, 'create', async (values) => {
    const challenge = { _id: `challenge-${++nextId}`, createdAt: new Date(), ...values, async save() {} };
    challenges.push(challenge);
    return challenge;
  });
  const app = express();
  app.use(express.json());
  app.use('/auth', require('../routes/auth'));
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/auth`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  mock.restoreAll();
});

beforeEach(() => {
  challenges = [];
  users = [];
  sent = [];
});

function post(path, body) {
  return fetch(`${baseUrl}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

function register(password = initialPassword) {
  return post('register', { username: 'Mailbox Owner', email, password });
}

test('registration creates an account only after its own emailed code is verified', async () => {
  const response = await register(ownerPassword);
  assert.equal(response.status, 202);
  const { challengeId } = await response.json();
  assert.equal(users.length, 0);
  assert.equal(sent.length, 1);
  const verified = await post('verify-email', { challengeId, code: sent[0].code });
  assert.equal(verified.status, 201);
  assert.equal(users.length, 1);
  assert.equal(await bcrypt.compare(ownerPassword, users[0].password), true);
});

test('a new registration cannot inherit another client\'s pending password during cooldown', async () => {
  const initial = await register();
  assert.equal(initial.status, 202);
  const earlierChallenge = (await initial.json()).challengeId;
  const response = await register(ownerPassword);
  assert.equal(response.status, 429);
  const body = await response.json();
  assert.equal(body.code, 'VERIFICATION_COOLDOWN');
  assert.equal(body.challengeId, undefined);
  assert.ok(body.retryAfter > 0 && body.retryAfter <= 60);
  assert.equal(response.headers.get('retry-after'), String(body.retryAfter));
  assert.equal(challenges[0].challengeId, earlierChallenge);
  assert.equal(sent.length, 1);
  assert.equal(users.length, 0);
});

test('the originating client can still resend its own challenge during cooldown', async () => {
  const initial = await register();
  const { challengeId } = await initial.json();
  const response = await post('resend-verification', { challengeId });
  assert.equal(response.status, 202);
  assert.equal((await response.json()).challengeId, challengeId);
  assert.equal(sent.length, 1);
});

test('retry after cooldown binds verification to the new registration and invalidates the old one', async () => {
  const initial = await register();
  const earlierChallenge = (await initial.json()).challengeId;
  const earlierCode = sent[0].code;
  challenges[0].lastSentAt = new Date(Date.now() - 61000);
  const response = await register(ownerPassword);
  assert.equal(response.status, 202);
  const { challengeId } = await response.json();
  assert.notEqual(challengeId, earlierChallenge);
  assert.equal(sent.length, 2);
  assert.equal((await post('verify-email', { challengeId: earlierChallenge, code: earlierCode })).status, 410);
  assert.equal((await post('verify-email', { challengeId, code: sent[1].code })).status, 201);
  assert.equal(await bcrypt.compare(ownerPassword, users[0].password), true);
  assert.equal(await bcrypt.compare(initialPassword, users[0].password), false);
});
