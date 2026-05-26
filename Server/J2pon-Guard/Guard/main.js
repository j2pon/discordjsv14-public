const { Body } = require('../Structures/Default.Clients');
const Bots = require("../../../Global/Settings/System.js")

let client = global.client = new Body({
    token: Bots.Security.Guard_I,
    owners: Bots.BotsOwners,
    MongoURI: Bots.MongoURL,
    _dirname: "Guard"
});

process.on("unhandledRejection", function(error) {
    // DAVE protokolü hatası normal, görmezden gel
    if (error && error.message && (error.message.includes('DAVE') || error.message.includes('davey'))) {
        return;
    }
    // MongoDB hatalarını atla
    if (error && (error.message && (error.message.includes('MongooseError') || error.message.includes('buffering timed out') || error.message.includes('querySrv') || error.message.includes('ETIMEOUT') || error.message.includes('No compatible encryption modes')))) {
        return;
    }
    console.error(error);
});
process.on("uncaughtException", function(error) {
    // DAVE protokolü hatası normal, görmezden gel
    if (error && error.message && (error.message.includes('DAVE') || error.message.includes('davey'))) {
        return;
    }
    // MongoDB hatalarını atla
    if (error && (error.message && (error.message.includes('MongooseError') || error.message.includes('buffering timed out') || error.message.includes('querySrv') || error.message.includes('ETIMEOUT') || error.message.includes('No compatible encryption modes')))) {
        return;
    }
    console.error(error);
});

client.fetchEvents2(true)
client.connect()





