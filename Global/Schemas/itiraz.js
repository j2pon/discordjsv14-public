const { Schema, model } = require("mongoose");

const schema = Schema({
  userID: { type: String, required: true },
  guildID: { type: String, required: true },
  lastItirazDate: { type: Number, default: Date.now }
}, {
  timestamps: true
});

module.exports = model("itiraz", schema);

