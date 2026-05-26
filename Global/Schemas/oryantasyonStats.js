const { Schema, model } = require("mongoose");

const schema = Schema({
  guildID: { type: String, default: "" },
  userID: { type: String, default: "" }, // oryantasyon veren yetkili
  count: { type: Number, default: 0 },
  sessions: {
    type: Array,
    default: [], // { targetId: string, date: number }
  },
});

module.exports = model("oryantasyon-stats", schema);

