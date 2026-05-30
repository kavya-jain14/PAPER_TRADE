const express      = require('express');
const router       = express.Router();
const User         = require('../models/User');
const jwt          = require('jsonwebtoken');
const bcrypt       = require('bcryptjs');
const fetchuser    = require('../middleware/fetchuser');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID?.trim());

// ─────────────────────────────────────────────────────────────────
// 🔑 Token Helpers
// ─────────────────────────────────────────────────────────────────
const generateAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });

const generateRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', { expiresIn: '30d' });

const COOKIE_OPTIONS = {
  httpOnly: true,           // Not accessible via JS — prevents XSS token theft
  sameSite: 'strict',       // Prevents CSRF attacks
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// ─────────────────────────────────────────────────────────────────
// 📌 Register
// ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: 'All fields are required.' });

    // 🔒 Minimum 8 characters (was 5 — security improvement)
    if (password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: 'Invalid email format.' });

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser)
      return res.status(400).json({ message: 'This email is already registered!' });

    const salt = await bcrypt.genSalt(12); // 12 rounds (was 10)
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name: username, email: email.toLowerCase(), password: hashedPassword });
    await newUser.save();

    res.status(201).json({
      message: 'Account created successfully! ₹10,00,000 credited.',
      user: { id: newUser._id, name: newUser.name, email: newUser.email, virtualBalance: newUser.virtualBalance }
    });
  } catch (error) {
    console.error('[Register Error]:', error.message);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────
// 📌 Login
// ─────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(401).json({ error: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, user.password);

    // 🔒 Legacy migration: if password wasn't hashed, hash it now
    if (!isMatch) {
      if (user.password === password) {
        const salt = await bcrypt.genSalt(12);
        const hashed = await bcrypt.hash(password, salt);
        await User.findByIdAndUpdate(user._id, { $set: { password: hashed } });
      } else {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }
    }

    const authtoken     = generateAccessToken(user._id);
    const refreshToken  = generateRefreshToken(user._id);

    // Store hashed refresh token in DB
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await User.findByIdAndUpdate(user._id, { $set: { refreshToken: hashedRefresh } });

    // Send refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    res.json({
      success: true,
      authtoken,
      user: { name: user.name, email: user.email, balance: user.virtualBalance }
    });
  } catch (error) {
    console.error('[Login Error]:', error.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────
// 📌 Refresh Token — get new access token using cookie
// ─────────────────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token.' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');
    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshToken) return res.status(401).json({ error: 'Invalid session.' });

    const isValid = await bcrypt.compare(token, user.refreshToken);
    if (!isValid) return res.status(401).json({ error: 'Invalid refresh token.' });

    const newAccessToken  = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    const hashedRefresh = await bcrypt.hash(newRefreshToken, 10);
    await User.findByIdAndUpdate(user._id, { $set: { refreshToken: hashedRefresh } });

    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);
    res.json({ success: true, authtoken: newAccessToken });
  } catch (error) {
    res.clearCookie('refreshToken');
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
});

// ─────────────────────────────────────────────────────────────────
// 📌 Logout — clear refresh token
// ─────────────────────────────────────────────────────────────────
router.post('/logout', fetchuser, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, { $set: { refreshToken: '' } });
    res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, maxAge: 0 });
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed.' });
  }
});

// ─────────────────────────────────────────────────────────────────
// 📌 Get User Data
// ─────────────────────────────────────────────────────────────────
router.get('/getuser', fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found!' });

    res.json({
      balance:    user.virtualBalance,
      portfolio:  user.portfolio || [],
      name:       user.name,
      email:      user.email,
      bio:        user.bio || '',
      avatar:     user.avatar || user.profilePic || '',
    });
  } catch (error) {
    console.error('[GetUser Error]:', error.message);
    res.status(500).json({ message: 'Failed to fetch user data.' });
  }
});

// ─────────────────────────────────────────────────────────────────
// 📌 Update Profile — name, bio, avatar
// ─────────────────────────────────────────────────────────────────
router.put('/update-profile', fetchuser, async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (name.trim().length < 1) return res.status(400).json({ message: 'Name cannot be empty.' });
      updates.name = name.trim().slice(0, 50);
    }
    if (bio !== undefined)    updates.bio    = bio.trim().slice(0, 200);
    if (avatar !== undefined) {
      // Guard: base64 images shouldn't exceed ~400KB (300KB data + encoding overhead)
      if (avatar.length > 550000) return res.status(400).json({ message: 'Avatar image too large. Max 400KB.' });
      updates.avatar = avatar;
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, select: '-password -refreshToken' }
    );

    res.json({ success: true, name: user.name, bio: user.bio, avatar: user.avatar });
  } catch (error) {
    console.error('[UpdateProfile Error]:', error.message);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

// ─────────────────────────────────────────────────────────────────
// 📌 Google OAuth Login
// ─────────────────────────────────────────────────────────────────
router.post('/googlelogin', async (req, res) => {
  try {
    const { tokenId } = req.body;
    if (!tokenId) return res.status(400).json({ success: false, message: 'Token is required.' });

    const ticket = await client.verifyIdToken({ idToken: tokenId, audience: process.env.GOOGLE_CLIENT_ID?.trim() });
    const { name, email, picture } = ticket.getPayload();

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = new User({ name, email: email.toLowerCase(), profilePic: picture, virtualBalance: 1000000 });
      await user.save();
    } else if (!user.profilePic) {
      await User.findByIdAndUpdate(user._id, { $set: { profilePic: picture } });
    }

    const authtoken    = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await User.findByIdAndUpdate(user._id, { $set: { refreshToken: hashedRefresh } });
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    res.json({ success: true, authtoken });
  } catch (error) {
    console.error('[Google Auth Error]:', error.message);
    res.status(500).json({ success: false, message: 'Google authentication failed.' });
  }
});

module.exports = router;