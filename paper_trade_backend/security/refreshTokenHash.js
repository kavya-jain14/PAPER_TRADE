const crypto = require('node:crypto');

// Refresh JWTs contain a random jti and are already signed. Hash the entire
// token: bcrypt truncates at 72 bytes, before these JWTs' unique token IDs.
function hashRefreshToken(token) {
  return `sha256:${crypto.createHash('sha256').update(token).digest('hex')}`;
}

module.exports = { hashRefreshToken };
