const mongoose = require('mongoose');

const AuthChallengeSchema = new mongoose.Schema({
  challengeId: { type: String, required: true, unique: true, index: true },
  purpose: { type: String, enum: ['registration', 'existing-account'], required: true },
  email: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  name: { type: String, default: '' },
  pendingPasswordHash: { type: String, default: '' },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

module.exports = mongoose.model('auth_challenge', AuthChallengeSchema);
