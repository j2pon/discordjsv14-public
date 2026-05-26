const mongoose = require("mongoose");

const levelSchema = new mongoose.Schema({
  guildID: { type: String, required: true },
  userID: { type: String, required: true },
  gerekli: { type: Number, default: 500, min: 1 },
  xp: { type: Number, default: 1, min: 0 },
  level: { type: Number, default: 1, min: 1 },
  top: { type: Number, default: 0, min: 0 },
}, {
  timestamps: true
});

module.exports = mongoose.model("level", levelSchema);
