const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeEmail, validateEmail, validatePassword } = require('../security/emailPolicy');

test('normalizes valid email addresses', () => {
  assert.equal(normalizeEmail('  Kavya@GMAIL.com '), 'kavya@gmail.com');
  assert.equal(validateEmail('student@abes.ac.in').valid, true);
});

test('rejects placeholder and disposable-looking domains', () => {
  assert.equal(validateEmail('abcd@abcd.com').valid, false);
  assert.equal(validateEmail('person@mailinator.com').valid, false);
  assert.equal(validateEmail('person@example.com').valid, false);
});

test('requires a long non-trivial registration password', () => {
  assert.equal(validatePassword('short123').valid, false);
  assert.equal(validatePassword('aaaaaaaaaaaa').valid, false);
  assert.equal(validatePassword('A-long-passphrase-2026').valid, true);
});
