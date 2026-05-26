const { Schema, model } = require("mongoose");

const schema = Schema({
  guildID: { type: String, default: "" },
  userID: { type: String, default: "" }, // davet eden kullanıcı
  count: { type: Number, default: 0 },
  users: {
    type: Array,
    default: [], // { memberId: string, date: number }
  },
});

module.exports = model("davet-stats", schema);

