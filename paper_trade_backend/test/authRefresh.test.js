const { test, before, after, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'local-access-secret-for-tests-only';
process.env.JWT_REFRESH_SECRET = 'local-refresh-secret-for-tests-only';

const User = require('../models/User');
const router = require('../routes/auth');
let record;
let server;
let baseUrl;
const password = 'Local test password 123!';
const passwordHash = bcrypt.hashSync(password, 4);

function snapshot() {
  return { ...record, async save() { record.refreshToken = this.refreshToken; } };
}

before(async () => {
  // Exercise the actual Express routes without a database or external providers.
  mock.method(User, 'findOne', async ({ email }) => email === record.email ? snapshot() : null);
  mock.method(User, 'findById', async (id) => id === record._id ? snapshot() : null);
  mock.method(User, 'findByIdAndUpdate', async (id, update) => {
    if (id !== record._id) return null;
    record.sessionVersion += update.$inc?.sessionVersion || 0;
    Object.assign(record, update.$set);
    return snapshot();
  });
  mock.method(User, 'findOneAndUpdate', async (filter, update) => {
    if (filter._id !== record._id || filter.sessionVersion !== record.sessionVersion || filter.refreshToken !== record.refreshToken) return null;
    Object.assign(record, update.$set);
    return snapshot();
  });
  const app = express();
  app.use(express.json(), cookieParser());
  app.use('/auth', router);
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/auth`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  mock.restoreAll();
});

beforeEach(() => {
  record = { _id: 'test-user', email: 'local@example.com', name: 'Local User', password: passwordHash, emailVerified: true, sessionVersion: 0, refreshToken: '', virtualBalance: 1000 };
});

function cookieToken(response, name = 'pt_rt') {
  const cookie = response.headers.getSetCookie().find((value) => value.startsWith(`${name}=`));
  assert.ok(cookie, `response sets ${name}`);
  return decodeURIComponent(cookie.split(';')[0].slice(name.length + 1));
}

async function login() {
  const response = await fetch(`${baseUrl}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: record.email, password }) });
  assert.equal(response.status, 200);
  return cookieToken(response);
}

function refresh(token) {
  return fetch(`${baseUrl}/refresh`, { method: 'POST', headers: { Cookie: `pt_rt=${encodeURIComponent(token)}` } });
}

test('login stores a versioned full-token digest and sends HttpOnly session cookies', async () => {
  const token = await login();
  assert.equal(record.refreshToken, `sha256:${crypto.createHash('sha256').update(token).digest('hex')}`);
  assert.notEqual(record.refreshToken, token);
  const response = await refresh(token);
  assert.equal(response.status, 200);
  assert.ok(response.headers.getSetCookie().every((cookie) => cookie.includes('HttpOnly')));
});

test('rotation rejects the previous JWT even when its first 72 bytes match', async () => {
  const original = await login();
  const rotated = await refresh(original);
  assert.equal(rotated.status, 200);
  const replacement = cookieToken(rotated);
  assert.notEqual(replacement, original);
  assert.equal(replacement.slice(0, 72), original.slice(0, 72));
  const replay = await refresh(original);
  assert.equal(replay.status, 401);
  assert.equal((await replay.json()).code, 'SESSION_EXPIRED');
  assert.equal(cookieToken(replay), '');
  assert.equal((await refresh(replacement)).status, 200);
});

test('simultaneous refresh requests consume a token only once', async () => {
  const original = await login();
  const responses = await Promise.all([refresh(original), refresh(original)]);
  assert.deepEqual(responses.map((res) => res.status).sort(), [200, 401]);
  const winner = responses.find((res) => res.status === 200);
  assert.equal((await refresh(cookieToken(winner))).status, 200);
});

test('legacy bcrypt sessions require a new login instead of accepting truncated hashes', async () => {
  const token = await login();
  record.refreshToken = await bcrypt.hash(token, 4);
  assert.equal((await refresh(token)).status, 401);
  const replacement = await login();
  assert.equal((await refresh(replacement)).status, 200);
});

test('revoked sessions and invalid JWTs cannot rotate a refresh token', async () => {
  const token = await login();
  record.sessionVersion += 1;
  assert.equal((await refresh(token)).status, 401);
  assert.equal((await refresh(`${token}tampered`)).status, 401);
  const wrongType = jwt.sign({ userId: record._id, sessionVersion: record.sessionVersion, type: 'access' }, process.env.JWT_REFRESH_SECRET, { issuer: 'papertrade-api', audience: 'papertrade-web' });
  assert.equal((await refresh(wrongType)).status, 401);
});
