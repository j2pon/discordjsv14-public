const { EmbedBuilder,Events } = require("discord.js");
const j2ponm = require('../../../../../../Global/Settings/Setup.json');
const moment = require("moment");
require("moment-duration-format");
moment.locale("tr");

const client = global.client;

let iltifatSayi = 0;
let gerekenler = [
  "Yazdigin mesajlar cok duzgun ve anlasilir, emegine saglik.",
  "Sohbete kattigin saygili uslup ortami gercekten guzellestiriyor.",
  "Aktifligin ve sakin tavrin server icin baya degerli.",
  "Insanlarla iletisim kurma seklin gercekten hos ve olgun.",
  "Katkin sayesinde chat daha keyifli bir hale geliyor.",
  "Yardimsever tavrin fark ediliyor, guzel bir enerjin var."
];

client.on(Events.MessageCreate, async (message) => {
    if (message.channel.id === j2ponm.ChatChannel && !message.author.bot) {
        iltifatSayi++;
        if (iltifatSayi >= 200) {
            iltifatSayi = 0;
            const randomMessage = gerekenler[Math.floor(Math.random() * gerekenler.length)];
            message.reply({ content: randomMessage});
        }
    }
});