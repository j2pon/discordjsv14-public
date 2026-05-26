const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, AttachmentBuilder, ComponentType, PermissionsBitField, ButtonBuilder, ButtonStyle } = require("discord.js");
const moment = require("moment");
require("moment-duration-format");
const kanal = require("../../../../../../Global/Settings/AyarName");
const Canvas = require('@napi-rs/canvas');
const path = require('path');
const { MessageStat, MessageUserChannel, VoiceStat, VoiceUserChannel, StreamerStat, StreamerUserChannel, CameraStat, CameraUserChannel } = require("../../../../../../Global/Models");

module.exports = {
    name: "top",
    description: "Kullanıcıların istatiklerini sıralar.",
    category: "STAT",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["topstat"],
        usage: ".top",
    },

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {
        const StartTime = Date.now();

        const allowedChannels = kanal.KomutKullanımKanalİsim;
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && 
            !allowedChannels.includes(message.channel.name)) {
            return message.reply({ 
                content: `${allowedChannels.map(x => `${client.channels.cache.find(chan => chan.name == x)}`)} kanallarında kullanabilirsiniz.` 
            }).then((e) => setTimeout(() => { e.delete(); }, 10000));
        }
        
        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('tops')
                    .setPlaceholder('Detaylı veriler için menüden seçim yapın!')
                    .addOptions([
                        { label: 'En Fazla Mesaj Atan Kullanıcılar', value: 'mesaj', emoji: '💬' },
                        { label: 'En Fazla Seste Duran Kullanıcılar', value: 'ses', emoji: '🎧' },
                        { label: 'En Fazla Yayın Açan Kullanıcılar', value: 'yayin', emoji: '📡' },
                        { label: 'En Fazla Kamera Açan Kullanıcılar', value: 'kamera', emoji: '📷' },
                    ]),
            );

        message.react(`${client.emoji("server_onay")}`);
        const msg = await message.channel.send({ content: "Sıralamasını görmek istediğiniz listeyi seçin.", components: [row] });
        const filter = i => i.user.id === message.member.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });
        collector.on("collect", async (interaction) => {

            if (interaction.values[0] === "mesaj") {
                await interaction.deferUpdate();
                const data = await MessageStat.aggregate([{ $match: { guildID: message.guild.id } }, { $sort: { TotalStat: -1 } }]);
                const image = await dataToCanvas("mesaj", data, message.guild);
                msg.edit({ content: ``, components: [row], files: [{ attachment: image, name: "top.png" }] }).catch(err => {});
            }

            if (interaction.values[0] === "ses") {
                await interaction.deferUpdate();
                const data = await VoiceStat.aggregate([{ $match: { guildID: message.guild.id } }, { $sort: { TotalStat: -1 } }]);
                const image = await dataToCanvas("ses", data, message.guild);
                msg.edit({ content: ``, components: [row], files: [{ attachment: image, name: "top.png" }] }).catch(err => {});
            }

            if (interaction.values[0] === "yayin") {
                await interaction.deferUpdate();
                const data = await StreamerStat.find({ guildID: message.guild.id });
                const image = await dataToCanvas("yayin", data, message.guild);
                msg.edit({ content: ``, components: [row], files: [{ attachment: image, name: "top.png" }] }).catch(err => {});
            }

            if (interaction.values[0] === "kamera") {
                await interaction.deferUpdate();
                const data = await CameraStat.find({ guildID: message.guild.id });
                const image = await dataToCanvas("kamera", data, message.guild);
                msg.edit({ content: ``, components: [row], files: [{ attachment: image, name: "top.png" }] }).catch(err => {});
            }
        });
    },
};

async function dataToCanvas(type, longData, guild) {
    let back;
    switch (type) {
        case 'mesaj':
            back = path.join(__dirname, '../../../../../../Global/Images/TopStat_Mesaj.png');
            break;
        case 'ses':
            back = path.join(__dirname, '../../../../../../Global/Images/TopStat_Ses.jpeg');
            break;
        case 'yayin':
            back = path.join(__dirname, '../../../../../../Global/Images/TopStat_Yayin.png');
            break;
        case 'kamera':
            back = path.join(__dirname, '../../../../../../Global/Images/TopStat_Kamera.png');
            break;
    }

    const canvas = Canvas.createCanvas(1280, 660);
    const ctx = canvas.getContext("2d");

    try {
        const background = await Canvas.loadImage(back);
        ctx.drawImage(background, 0, 0, 1280, 660);
    } catch (err) {
        console.error('TopStat background yüklenemedi:', err.message);
        // Background yüklenemezse devam et, sadece arka plan olmadan
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 1280, 660);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '45px "NotoSansSymbols2-Regular"';
    const guildName = guild.name;
    ctx.fillText(`${guildName}`, canvas.width / 9.10, 90);

    const top = longData.filter(x => {
        const member = guild.members.cache.get(x.userID);
        return member && !member.user.bot;
    }).sort((a, b) => b.TotalStat - a.TotalStat);

    const maxWidth = 100;
    const startY = 245;
    const userListLeft = [];
    const userListRight = [];

    top.forEach((data, i) => {
        if (i > 6) {
            userListRight.push({ username: `${guild.members.cache.get(data.userID).user.username}`, TotalStat: data.TotalStat.toString() });
        } else {
            userListLeft.push({ username: `${guild.members.cache.get(data.userID).user.username}`, TotalStat: data.TotalStat.toString() });
        }
    });

    userListLeft.forEach((data, i) => {
        const user = data;
        const sayi = i * 90;
        const textColor = i < 3 ? ['#A7F9F9', '#F6CD46', '#C1853C'][i] : '#FFFFFF';

        ctx.font = '30px "Segoe UI"';
        ctx.fillStyle = textColor;
        ctx.textAlign = 'left';
        ctx.fillText(`${user.username}`, canvas.width / 9.10, startY + sayi);

        ctx.font = '27px "Segoe UI"';
        ctx.fillStyle = textColor;
        ctx.textAlign = 'left';

        let TotalStat;
        if (type !== "mesaj") {
            if (user.TotalStat >= 3600000) {
                TotalStat = moment.duration(Math.floor(data.TotalStat)).format('H [sa]');
            } else if (user.TotalStat < 3600000) {
                TotalStat = moment.duration(Math.floor(data.TotalStat)).format('m [dk]');
            } else {
                TotalStat = false;
            }
            ctx.textAlign = "end";
            ctx.fillText(`${TotalStat === false ? ` ` : TotalStat}`, 610, startY + sayi);
        } else {
            if (parseInt(user.TotalStat) > 9) {
                ctx.textAlign = "end";
                ctx.fillText(user.TotalStat, 610, startY + sayi);
            } else {
                if (ctx.measureText(user.TotalStat).width > maxWidth) {
                    const startX = canvas.width / 2.15 + maxWidth - ctx.measureText(user.TotalStat).width;
                    ctx.fillText(user.TotalStat, startX, startY + sayi);
                } else {
                    ctx.fillText(user.TotalStat, canvas.width / 2.15, startY + sayi);
                }
            }
        }
    });

    userListRight.forEach((data, i) => {
        const user = data;
        const sayi = i * 90;
        const textColor = '#FFFFFF';

        ctx.font = '30px "Segoe UI"';
        ctx.fillStyle = textColor;
        ctx.textAlign = 'left';
        ctx.fillText(`${user.username}`, canvas.width / 1.66, startY + sayi);

        ctx.font = '27px "Segoe UI"';
        ctx.fillStyle = textColor;
        ctx.textAlign = 'left';

        let TotalStat;
        if (type !== "mesaj") {
            if (user.TotalStat >= 3600000) {
                TotalStat = moment.duration(Math.floor(data.TotalStat)).format('H [sa]');
            } else if (user.TotalStat < 3600000) {
                TotalStat = moment.duration(Math.floor(data.TotalStat)).format('m [dk]');
            } else {
                TotalStat = false;
            }
            ctx.textAlign = "end";
            ctx.fillText(`${TotalStat === false ? ` ` : TotalStat}`, 1236, startY + sayi);
        } else {
            if (parseInt(user.TotalStat) > 9) {
                ctx.textAlign = "end";
                ctx.fillText(user.TotalStat, 1236, startY + sayi);
            } else {
                if (ctx.measureText(user.TotalStat).width > maxWidth) {
                    const startX = canvas.width / 1.04 + maxWidth - ctx.measureText(user.TotalStat).width;
                    ctx.fillText(user.TotalStat, startX, startY + sayi);
                } else {
                    ctx.fillText(user.TotalStat, canvas.width / 1.05, startY + sayi);
                }
            }
        }
    });

    const iconURL = guild?.iconURL({ size: 128, extension: 'png', forceStatic: true });
    if (iconURL) {
        try {
            let image = await Canvas.loadImage(iconURL);
            ctx.beginPath();
            ctx.arc(62, 73, 61, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(image, 14, 25, 95, 96.5);
            ctx.restore();
        } catch (err) {
            console.error('TopStat guild icon yüklenemedi:', err.message);
        }
    } else {
        console.log("Guild icon not found.");
    }

    return canvas.toBuffer('image/png');
}
