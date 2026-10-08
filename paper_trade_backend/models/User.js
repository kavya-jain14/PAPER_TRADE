const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name:           { type: String, default: '' },
  email:          { type: String, required: true, unique: true },
  password:       { type: String },
  authProvider:   { type: String, enum: ['local', 'google'], default: 'local' },
  googleSub:      { type: String, unique: true, sparse: true },
  emailVerified:  { type: Boolean, default: false },
  emailVerifiedAt:{ type: Date },
  profilePic:     { type: String, default: '' },    // URL (Google OAuth) or base64 (manual upload)
  avatar:         { type: String, default: '' },    // User-uploaded base64 avatar
  bio:            { type: String, default: '' },    // Short user bio
  refreshToken:   { type: String, default: '' },    // Hashed refresh token
  sessionVersion: { type: Number, default: 0 },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil:    { type: Date },
  virtualBalance: { type: Number, default: 1000000 },
  totalDeposited: { type: Number, default: 0 },
  date:           { type: Date, default: Date.now },
  resetToken:     String,
  expireToken:    Date
});

UserSchema.index({ virtualBalance: -1 });

module.exports = mongoose.model('user', UserSchema);
