const { Schema, model } = require("mongoose");

// Her öğe: { value: String, type: "guild" | "isim" }
// Eski kayıtlar: taglar = ["#", "x"] -> okunurken { value, type: "isim" } olarak normalize edilir
const schema = Schema({
	guildID: { type: String, default: "" },
	taglar: { type: Array, default: [] }
});

module.exports = model("bannedTag", schema);
 
