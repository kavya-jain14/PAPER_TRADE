const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isProd = process.env.NODE_ENV === 'production';
const ACCESS_COOKIE = isProd ? '__Host-pt_at' : 'pt_at';

module.exports = async function fetchuser(req, res, next) {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) return res.status(401).json({ code: 'AUTH_REQUIRED', message: 'Authentication required.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'papertrade-api', audience: 'papertrade-web' });
    if (decoded.type !== 'access') throw new Error('Unexpected token type');
    const user = await User.findById(decoded.userId).select('-password -refreshToken');
    if (!user || user.sessionVersion !== decoded.sessionVersion) throw new Error('Session revoked');
    req.user = { userId: String(user._id), sessionVersion: user.sessionVersion };
    req.userRecord = user;
    return next();
  } catch {
    return res.status(401).json({ code: 'SESSION_INVALID', message: 'Session is invalid or expired.' });
  }
};
