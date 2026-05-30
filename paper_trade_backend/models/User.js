const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name:           { type: String, default: '' },
  email:          { type: String, required: true, unique: true },
  password:       { type: String },
  profilePic:     { type: String, default: '' },    // URL (Google OAuth) or base64 (manual upload)
  avatar:         { type: String, default: '' },    // User-uploaded base64 avatar
  bio:            { type: String, default: '' },    // Short user bio
  refreshToken:   { type: String, default: '' },    // Hashed refresh token
  virtualBalance: { type: Number, default: 1000000 },
  date:           { type: Date, default: Date.now },
});

module.exports = mongoose.model('user', UserSchema);