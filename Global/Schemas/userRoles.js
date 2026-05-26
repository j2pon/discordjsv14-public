const { Schema, model } = require("mongoose");

const schema = Schema({
	guildID: { type: String, default: "" },
	userID: { type: String, default: "" },
	roles: { type: Array, default: [] },
	kayitTarihi: { type: Number, default: Date.now() }
});

module.exports = model("userRoles", schema);

