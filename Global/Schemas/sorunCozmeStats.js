const { Schema, model } = require("mongoose");

const schema = Schema({
  guildID: { type: String, default: "" },
  userID: { type: String, default: "" }, // sorun çözme başlatan yetkili
  count: { type: Number, default: 0 },
  sessions: {
    type: Array,
    default: [], // { channelId: string, durationMs: number, date: number }
  },
});

module.exports = model("soruncozme-stats", schema);

