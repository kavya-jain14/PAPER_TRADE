const test = require('node:test');
const assert = require('node:assert/strict');
const { ACCESS_TTL_MS, REFRESH_TTL_MS, sessionCookiePolicy } = require('../security/sessionCookiePolicy');

test('production cookies satisfy the __Host prefix contract', () => {
  const policy = sessionCookiePolicy('production');

  assert.equal(policy.accessName, '__Host-pt_at');
  assert.equal(policy.refreshName, '__Host-pt_rt');
  for (const options of [policy.accessOptions, policy.refreshOptions, policy.clearOptions]) {
    assert.equal(options.secure, true);
    assert.equal(options.httpOnly, true);
    assert.equal(options.sameSite, 'lax');
    assert.equal(options.path, '/');
    assert.equal('domain' in options, false);
  }
  assert.equal(policy.accessOptions.maxAge, ACCESS_TTL_MS);
  assert.equal(policy.refreshOptions.maxAge, REFRESH_TTL_MS);
});

test('development cookies remain usable over localhost http', () => {
  const policy = sessionCookiePolicy('development');

  assert.equal(policy.accessName, 'pt_at');
  assert.equal(policy.refreshName, 'pt_rt');
  assert.equal(policy.accessOptions.secure, false);
  assert.equal(policy.refreshOptions.secure, false);
});
