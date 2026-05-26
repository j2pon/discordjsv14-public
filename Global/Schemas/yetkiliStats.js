const { Schema, model } = require("mongoose");

const schema = Schema({
  guildID: { type: String, default: "" },
  userID: { type: String, default: "" }, // yetkili çeken kullanıcı
  count: { type: Number, default: 0 },
  users: {
    type: Array,
    default: [], // { memberId: string, roleId: string, date: number }
  },
});

module.exports = model("yetkili-stats", schema);

