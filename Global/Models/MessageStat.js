const { Schema, model } = require("mongoose");

const MessageStat = Schema({
    guildID: { type: String, required: true },
    userID: { type: String, required: true },
    TotalStat: { type: Number, default: 0, min: 0 },
    DailyStat: { type: Number, default: 0, min: 0 },
    WeeklyStat: { type: Number, default: 0, min: 0 },
    MonthlyStat: { type: Number, default: 0, min: 0 },
    date: { type: Date, default: Date.now },
}, {
    timestamps: true
});

module.exports = model("MessageStat", MessageStat);