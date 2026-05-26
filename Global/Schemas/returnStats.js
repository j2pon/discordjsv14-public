const mongoose = require("mongoose");

const returnStatsSchema = mongoose.Schema({
    guildID: String,
    userID: String,
    count: { type: Number, default: 0 },
    totalReturns: { type: Array, default: [] } // Detaylı log için [{userID, date}]
});

module.exports = mongoose.model("returnStats", returnStatsSchema);
