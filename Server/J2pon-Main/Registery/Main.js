require("../../../Global/Helpers/Extenders/Prototypes");

const System = require("../../../Global/Settings/System");
const { j2pon } = require("./src/Structures/j2pon");
const { Collection } = require("discord.js");

let client = global.client = new j2pon({ 
   Directory: "Server Register Bot", 
   token: System.Mainframe.Registery,
});

client.loadClient({
   Events   : true,
   Database : true,
});

client.emoji = function (emojiName)  {
   const emoji = client.emojis.cache.find(x => x.name.includes(emojiName));
   if (!emoji) return null;
   return emoji;
 } 

 client.sayıEmoji = (sayi) => {
   const numberString = sayi.toString().replace(/ /g, "     ");
   const numberMatch = numberString.match(/([0-9])/g);
   let result = numberString.replace(/([a-zA-Z])/g, "Belirlenemiyor").toLowerCase();
   
   if (numberMatch) {
     result = result.replace(/([0-9])/g, d => {
       const emojiMap = {
         '0': client.emoji("sayiEmoji_sifir") || "0",
         '1': client.emoji("sayiEmoji_bir") || "1",
         '2': client.emoji("sayiEmoji_iki") || "2",
         '3': client.emoji("sayiEmoji_uc") || "3",
         '4': client.emoji("sayiEmoji_dort") || "4",
         '5': client.emoji("sayiEmoji_bes") || "5",
         '6': client.emoji("sayiEmoji_alti") || "6",
         '7': client.emoji("sayiEmoji_yedi") || "7",
         '8': client.emoji("sayiEmoji_sekiz") || "8",
         '9': client.emoji("sayiEmoji_dokuz") || "9"
       };
       return emojiMap[d];
     });
   }
   return result;
 };

// Process-level error handlers for DAVE protocol and MongoDB
process.on("unhandledRejection", (err) => {
    // DAVE protokolü hatası normal, görmezden gel
    if (err && err.message && (err.message.includes('DAVE') || err.message.includes('davey'))) {
        return;
    }
    // MongoDB hatalarını atla
    if (err && (err.message && (err.message.includes('MongooseError') || err.message.includes('buffering timed out') || err.message.includes('querySrv') || err.message.includes('ETIMEOUT') || err.message.includes('No compatible encryption modes')))) {
        return;
    }
});

process.on("uncaughtException", (err) => {
    // DAVE protokolü hatası normal, görmezden gel
    if (err && err.message && (err.message.includes('DAVE') || err.message.includes('davey'))) {
        return;
    }
    // MongoDB hatalarını atla
    if (err && (err.message && (err.message.includes('MongooseError') || err.message.includes('buffering timed out') || err.message.includes('querySrv') || err.message.includes('ETIMEOUT') || err.message.includes('No compatible encryption modes')))) {
        return;
    }
});

module.exports = client;
client.connect();
