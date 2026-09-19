const dns = require('node:dns').promises;

const BLOCKED_DOMAINS = new Set([
  'abcd.com', 'example.com', 'example.net', 'example.org', 'test.com',
  'mailinator.com', 'guerrillamail.com', 'guerrillamailblock.com',
  '10minutemail.com', 'temp-mail.org', 'tempmail.com', 'yopmail.com',
  'trashmail.com', 'sharklasers.com', 'getnada.com', 'dispostable.com',
]);
const COMMON_PASSWORDS = new Set([
  'password1234', 'password123', 'qwerty123456', '123456789012',
  'admin12345678', 'letmein123456', 'papertrade123',
]);

function normalizeEmail(value) { return String(value || '').trim().toLowerCase(); }

function validateEmail(value) {
  const email = normalizeEmail(value);
  if (!email || email.length > 254) return { valid: false, email, reason: 'Enter a valid email address.' };
  const match = email.match(/^([a-z0-9.!#$%&'*+/=?^_`{|}~-]+)@([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)$/i);
  if (!match) return { valid: false, email, reason: 'Enter a valid email address.' };
  const domain = match[2].toLowerCase();
  if (BLOCKED_DOMAINS.has(domain)) return { valid: false, email, reason: 'Use a real, permanent email address.' };
  return { valid: true, email, domain };
}

function validatePassword(value) {
  const password = String(value || '');
  if (password.length < 12) return { valid: false, reason: 'Use at least 12 characters.' };
  if (password.length > 128) return { valid: false, reason: 'Password cannot exceed 128 characters.' };
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return { valid: false, reason: 'Choose a less common password.' };
  if (/^(.)\1+$/.test(password)) return { valid: false, reason: 'Choose a less predictable password.' };
  return { valid: true };
}

async function domainAcceptsEmail(domain) {
  try {
    const records = await Promise.race([
      dns.resolveMx(domain),
      new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('DNS timeout'), { code: 'ETIMEOUT' })), 2500)),
    ]);
    return { deliverable: Array.isArray(records) && records.length > 0 };
  } catch (error) {
    if (['ENOTFOUND', 'ENODATA', 'ENOTIMP', 'EREFUSED'].includes(error.code)) return { deliverable: false };
    return { deliverable: null, temporaryFailure: true };
  }
}

module.exports = { BLOCKED_DOMAINS, normalizeEmail, validateEmail, validatePassword, domainAcceptsEmail };
