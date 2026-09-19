const express = require('express');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const AuthChallenge = require('../models/AuthChallenge');
const fetchuser = require('../middleware/fetchuser');
const { validateEmail, validatePassword, domainAcceptsEmail, normalizeEmail } = require('../security/emailPolicy');
const { sendVerificationEmail } = require('../services/verificationEmail');

const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
const ACCESS_COOKIE = isProd ? '__Host-pt_at' : 'pt_at';
const REFRESH_COOKIE = isProd ? '__Host-pt_rt' : 'pt_rt';
const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const DUMMY_PASSWORD_HASH = '$2b$12$pV4m4AoYxaJGmYh1eD6txuW1tQ3knC4YfLr7S0b5s3z2g1qgPqfTy';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID?.trim());

const refreshSecret = () => process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET}_refresh`;
const cookieOptions = (maxAge, path = '/') => ({ httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax', path, maxAge });
const clearCookieOptions = (path = '/') => ({ httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax', path });

function setSessionCookies(res, accessToken, refreshToken) {
  res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_TTL_MS));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_TTL_MS, '/api/auth'));
}

function clearSessionCookies(res) {
  res.clearCookie(ACCESS_COOKIE, clearCookieOptions());
  res.clearCookie(REFRESH_COOKIE, clearCookieOptions('/api/auth'));
}

function signAccessToken(user) {
  return jwt.sign(
    { userId: String(user._id), sessionVersion: user.sessionVersion, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m', issuer: 'papertrade-api', audience: 'papertrade-web' },
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { userId: String(user._id), sessionVersion: user.sessionVersion, type: 'refresh', jti: crypto.randomUUID() },
    refreshSecret(),
    { expiresIn: '7d', issuer: 'papertrade-api', audience: 'papertrade-web' },
  );
}

async function establishSession(userId) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { sessionVersion: 1 }, $set: { failedLoginAttempts: 0, lockedUntil: null } },
    { new: true },
  );
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshToken = await bcrypt.hash(refreshToken, 10);
  await user.save();
  return { user, accessToken, refreshToken };
}

function safeUser(user) {
  return { id: user._id, name: user.name, email: user.email, balance: user.virtualBalance, emailVerified: user.emailVerified === true };
}

function hashCode(challengeId, code) {
  const secret = process.env.EMAIL_VERIFICATION_SECRET || refreshSecret();
  return crypto.createHmac('sha256', secret).update(`${challengeId}:${code}`).digest('hex');
}

function codeMatches(challenge, code) {
  const supplied = Buffer.from(hashCode(challenge.challengeId, code), 'hex');
  const stored = Buffer.from(challenge.codeHash, 'hex');
  return supplied.length === stored.length && crypto.timingSafeEqual(supplied, stored);
}

async function createChallenge({ purpose, email, name = '', pendingPasswordHash = '', userId = null, reuseRecent = true }) {
  const now = Date.now();
  const recent = await AuthChallenge.findOne({ purpose, email, expiresAt: { $gt: new Date(now) } }).sort({ createdAt: -1 });
  const elapsed = recent ? now - new Date(recent.lastSentAt).getTime() : Infinity;
  if (reuseRecent && recent && elapsed < RESEND_COOLDOWN_MS) {
    return { challenge: recent, sent: false, retryAfter: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000) };
  }

  const challengeId = crypto.randomBytes(24).toString('hex');
  const code = String(crypto.randomInt(100000, 1000000));
  await AuthChallenge.deleteMany({ purpose, email });
  const challenge = await AuthChallenge.create({
    challengeId, purpose, email, userId, name, pendingPasswordHash,
    codeHash: hashCode(challengeId, code), attempts: 0,
    lastSentAt: new Date(now), expiresAt: new Date(now + CHALLENGE_TTL_MS),
  });

  try {
    await sendVerificationEmail({ email, name, code });
  } catch (error) {
    await AuthChallenge.deleteOne({ _id: challenge._id }).catch(() => {});
    throw error;
  }
  return { challenge, sent: true, retryAfter: 60 };
}

function challengeResponse(result, sentMessage) {
  return {
    success: true, verificationRequired: true,
    challengeId: result.challenge.challengeId,
    retryAfter: result.retryAfter,
    message: result.sent ? sentMessage : 'A code was already sent. Check your inbox.',
  };
}

router.post('/register', async (req, res) => {
  try {
    const name = String(req.body?.username || '').trim().replace(/\s+/g, ' ');
    const emailCheck = validateEmail(req.body?.email);
    const passwordCheck = validatePassword(req.body?.password);
    if (name.length < 2 || name.length > 50) return res.status(400).json({ code: 'INVALID_NAME', message: 'Enter your full name (2–50 characters).' });
    if (!emailCheck.valid) return res.status(400).json({ code: 'INVALID_EMAIL', message: emailCheck.reason });
    if (!passwordCheck.valid) return res.status(400).json({ code: 'WEAK_PASSWORD', message: passwordCheck.reason });
    if (await User.exists({ email: emailCheck.email })) return res.status(409).json({ code: 'ACCOUNT_EXISTS', message: 'An account already exists for this email.' });

    const mx = await domainAcceptsEmail(emailCheck.domain);
    if (mx.deliverable === false) return res.status(400).json({ code: 'EMAIL_DOMAIN_UNREACHABLE', message: 'This email domain cannot receive mail.' });
    if (mx.temporaryFailure) return res.status(503).json({ code: 'EMAIL_CHECK_UNAVAILABLE', message: 'Email verification is temporarily unavailable. Try again.' });

    const pendingPasswordHash = await bcrypt.hash(String(req.body.password), 12);
    const result = await createChallenge({ purpose: 'registration', email: emailCheck.email, name, pendingPasswordHash });
    return res.status(202).json(challengeResponse(result, 'Verification code sent.'));
  } catch (error) {
    console.error('[Register Error]:', error.message);
    return res.status(503).json({ code: 'VERIFICATION_DELIVERY_FAILED', message: 'We could not send the verification code. Try again shortly.' });
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    const challengeId = String(req.body?.challengeId || '');
    const code = String(req.body?.code || '').replace(/\D/g, '');
    if (!/^[a-f0-9]{48}$/.test(challengeId) || !/^\d{6}$/.test(code)) return res.status(400).json({ code: 'INVALID_CODE', message: 'Enter the 6-digit code.' });

    const challenge = await AuthChallenge.findOne({ challengeId });
    if (!challenge || challenge.expiresAt <= new Date()) return res.status(410).json({ code: 'CODE_EXPIRED', message: 'This code has expired. Request a new one.' });
    if (challenge.attempts >= MAX_CODE_ATTEMPTS) {
      await AuthChallenge.deleteOne({ _id: challenge._id });
      return res.status(429).json({ code: 'CODE_ATTEMPTS_EXCEEDED', message: 'Too many incorrect attempts. Request a new code.' });
    }
    if (!codeMatches(challenge, code)) {
      challenge.attempts += 1;
      await challenge.save();
      const left = MAX_CODE_ATTEMPTS - challenge.attempts;
      return res.status(400).json({ code: 'INVALID_CODE', message: `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.` });
    }

    if (challenge.purpose === 'registration') {
      if (await User.exists({ email: challenge.email })) {
        await AuthChallenge.deleteOne({ _id: challenge._id });
        return res.status(409).json({ code: 'ACCOUNT_EXISTS', message: 'An account already exists for this email.' });
      }
      const user = await User.create({
        name: challenge.name, email: challenge.email, password: challenge.pendingPasswordHash,
        authProvider: 'local', emailVerified: true, emailVerifiedAt: new Date(),
      });
      await AuthChallenge.deleteOne({ _id: challenge._id });
      return res.status(201).json({ success: true, registered: true, user: safeUser(user), message: 'Email verified. Your account is ready.' });
    }

    const user = await User.findById(challenge.userId);
    if (!user || user.email !== challenge.email) return res.status(400).json({ code: 'INVALID_CHALLENGE', message: 'Verification request is no longer valid.' });
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();
    await AuthChallenge.deleteOne({ _id: challenge._id });
    const session = await establishSession(user._id);
    setSessionCookies(res, session.accessToken, session.refreshToken);
    return res.json({ success: true, authenticated: true, user: safeUser(session.user) });
  } catch (error) {
    console.error('[Verify Email Error]:', error.message);
    return res.status(500).json({ code: 'VERIFICATION_FAILED', message: 'Email verification failed. Try again.' });
  }
});

router.post('/resend-verification', async (req, res) => {
  try {
    const previous = await AuthChallenge.findOne({ challengeId: String(req.body?.challengeId || '') });
    if (!previous || previous.expiresAt <= new Date()) return res.status(410).json({ code: 'CODE_EXPIRED', message: 'Restart verification to request a new code.' });
    const result = await createChallenge({
      purpose: previous.purpose, email: previous.email, name: previous.name,
      pendingPasswordHash: previous.pendingPasswordHash, userId: previous.userId,
    });
    return res.status(202).json(challengeResponse(result, 'A new verification code was sent.'));
  } catch (error) {
    console.error('[Resend Error]:', error.message);
    return res.status(503).json({ code: 'VERIFICATION_DELIVERY_FAILED', message: 'We could not send another code. Try again shortly.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(400).json({ code: 'MISSING_CREDENTIALS', message: 'Email and password are required.' });

    const user = await User.findOne({ email });
    const passwordMatches = await bcrypt.compare(password, user?.password || DUMMY_PASSWORD_HASH).catch(() => false);
    if (!user || !user.password || !passwordMatches) {
      if (user) {
        const attempts = (user.failedLoginAttempts || 0) + 1;
        const update = { failedLoginAttempts: attempts };
        if (attempts >= MAX_LOGIN_ATTEMPTS) update.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
        await User.findByIdAndUpdate(user._id, { $set: update });
      }
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) return res.status(429).json({ code: 'ACCOUNT_LOCKED', message: 'Too many failed attempts. Try again in 15 minutes.' });

    if (user.emailVerified !== true) {
      const result = await createChallenge({ purpose: 'existing-account', email: user.email, name: user.name, userId: user._id });
      return res.status(403).json(challengeResponse(result, 'Verify your email to finish signing in.'));
    }

    const session = await establishSession(user._id);
    setSessionCookies(res, session.accessToken, session.refreshToken);
    return res.json({ success: true, user: safeUser(session.user) });
  } catch (error) {
    console.error('[Login Error]:', error.message);
    return res.status(500).json({ code: 'LOGIN_FAILED', message: 'Login failed. Try again.' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) return res.status(401).json({ code: 'NO_SESSION', message: 'No active session.' });
    const decoded = jwt.verify(token, refreshSecret(), { issuer: 'papertrade-api', audience: 'papertrade-web' });
    if (decoded.type !== 'refresh') throw new Error('Unexpected token type');
    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshToken || user.sessionVersion !== decoded.sessionVersion) throw new Error('Invalid session');
    if (!(await bcrypt.compare(token, user.refreshToken))) throw new Error('Invalid refresh token');

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save();
    setSessionCookies(res, accessToken, refreshToken);
    return res.json({ success: true });
  } catch {
    clearSessionCookies(res);
    return res.status(401).json({ code: 'SESSION_EXPIRED', message: 'Session expired. Log in again.' });
  }
});

router.post('/logout', fetchuser, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, { $inc: { sessionVersion: 1 }, $set: { refreshToken: '' } });
    clearSessionCookies(res);
    return res.json({ success: true, message: 'Logged out.' });
  } catch {
    clearSessionCookies(res);
    return res.status(500).json({ code: 'LOGOUT_FAILED', message: 'Logout failed.' });
  }
});

router.get('/getuser', fetchuser, (req, res) => {
  const user = req.userRecord;
  return res.json({
    balance: user.virtualBalance, portfolio: user.portfolio || [], name: user.name,
    email: user.email, bio: user.bio || '', avatar: user.avatar || user.profilePic || '',
    emailVerified: user.emailVerified === true,
  });
});

router.put('/update-profile', fetchuser, async (req, res) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim().replace(/\s+/g, ' ');
      if (!name) return res.status(400).json({ message: 'Name cannot be empty.' });
      updates.name = name.slice(0, 50);
    }
    if (req.body.bio !== undefined) updates.bio = String(req.body.bio).trim().slice(0, 200);
    if (req.body.avatar !== undefined) {
      const avatar = req.body.avatar;
      if (typeof avatar !== 'string' || avatar.length > 550000 || (avatar && !avatar.startsWith('data:image/'))) return res.status(400).json({ message: 'Avatar must be an image under 400 KB.' });
      updates.avatar = avatar;
    }
    const user = await User.findByIdAndUpdate(req.user.userId, { $set: updates }, { new: true, select: '-password -refreshToken' });
    return res.json({ success: true, name: user.name, bio: user.bio, avatar: user.avatar });
  } catch (error) {
    console.error('[UpdateProfile Error]:', error.message);
    return res.status(500).json({ message: 'Failed to update profile.' });
  }
});

router.post('/googlelogin', async (req, res) => {
  try {
    const credential = String(req.body?.credential || '');
    if (!credential) return res.status(400).json({ code: 'GOOGLE_TOKEN_REQUIRED', message: 'Google credential is required.' });
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ code: 'GOOGLE_NOT_CONFIGURED', message: 'Google sign-in is not configured.' });

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID.trim() });
    const payload = ticket.getPayload() || {};
    const email = normalizeEmail(payload.email);
    const googleIsAuthoritative = email.endsWith('@gmail.com') || (payload.email_verified === true && Boolean(payload.hd));
    if (!payload.sub || !email || payload.email_verified !== true || !googleIsAuthoritative) {
      return res.status(403).json({ code: 'GOOGLE_EMAIL_NOT_AUTHORITATIVE', message: 'Use Gmail, verified Google Workspace, or email verification.' });
    }

    let user = await User.findOne({ googleSub: payload.sub });
    if (!user) {
      const sameEmail = await User.findOne({ email });
      if (sameEmail) return res.status(409).json({ code: 'ACCOUNT_LINK_REQUIRED', message: 'This email already has a password account. Sign in with your password.' });
      user = await User.create({
        name: String(payload.name || email.split('@')[0]).slice(0, 50), email,
        profilePic: payload.picture || '', authProvider: 'google', googleSub: payload.sub,
        emailVerified: true, emailVerifiedAt: new Date(),
      });
    } else if (user.email !== email) {
      if (await User.exists({ email, _id: { $ne: user._id } })) return res.status(409).json({ code: 'EMAIL_CONFLICT', message: 'Google email conflicts with another account.' });
      user.email = email;
      user.emailVerified = true;
      user.emailVerifiedAt = new Date();
      if (!user.profilePic && payload.picture) user.profilePic = payload.picture;
      await user.save();
    }

    const session = await establishSession(user._id);
    setSessionCookies(res, session.accessToken, session.refreshToken);
    return res.json({ success: true, user: safeUser(session.user) });
  } catch (error) {
    console.error('[Google Auth Error]:', error.message);
    return res.status(401).json({ code: 'GOOGLE_AUTH_FAILED', message: 'Google sign-in could not be verified.' });
  }
});

module.exports = router;
