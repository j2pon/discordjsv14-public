const { Schema, model } = require("mongoose");

const schema = Schema({
  id: { type: Number, default: 0, required: true },
  userID: { type: String, required: true },
  guildID: { type: String, required: true },
  type: { type: String, required: true },
  active: { type: Boolean, default: true },
  staff: { type: String, required: true },
  reason: { type: String, default: "Sebep belirtilmedi" },
  temp: { type: Boolean, default: false },
  finishDate: { type: Number, default: null },
  removed: { type: Boolean, default: false },
  date: { type: Number, default: Date.now },
  proofImage: { type: String, default: "" }
}, {
  timestamps: true
});

module.exports = model("penals", schema);
