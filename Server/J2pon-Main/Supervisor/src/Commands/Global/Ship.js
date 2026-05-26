const { ApplicationCommandOptionType, EmbedBuilder, PermissionsBitField,AttachmentBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle } = require("discord.js");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const j2poncik = require("../../../../../../Global/Settings/System");
const Canvas = require('@napi-rs/canvas');
const {red,green} = require("../../../../../../Global/Settings/Emojis.json"); 
const path = require('path');

module.exports = {
    name: "ship",
    description: "Random veya belirttiğiniz üyeyi shipler",
    category: "USER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["shiple", "shipim","ship"],
      usage: ".ship",
    },


    onLoad: function (client) { },

    onCommand: async function (client, message, args) { 

        const allowedChannelIds = [
          j2ponm.BotCommandsChannel,
          j2ponm.ShipChatChannel,
        ].filter(Boolean);

        if (
          !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
          !allowedChannelIds.includes(message.channel.id)
        ) {
          const allowedChannelsText = allowedChannelIds
            .map((id) => client.channels.cache.get(id))
            .filter((ch) => ch)
            .join(", ");

          return message
            .reply({
              content: `${allowedChannelsText} kanallarında kullanabilirsiniz.`,
            })
            .then((e) => setTimeout(() => { e.delete(); }, 10000));
        }

        const j2ponman = j2ponm.ManRoles[0];
        const byj2ponwoman = j2ponm.GirlRoles[0];
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.members.cache.filter(m => m.user.bot === false && message.member.roles.cache.has(j2ponman) ? m.roles.cache.get(byj2ponwoman) : m.roles.cache.get(j2ponman)).random();
        
        if (!member) {
            return message.reply({ content: `${red} Ship yapılacak bir üye bulunamadı.` }).catch(() => {});
        }
        
    let replies = [
      '5% Uyumlu!',     '3% Uyumlu!',
      '10% Uyumlu!',    '14% Uyumlu!',
      '17% Uyumlu!',    '20% Uyumlu!',
      '22% Uyumlu!',    '25% Uyumlu!',
      '24% Uyumlu!',    '27% Uyumlu!',
      '32% Uyumlu!',    '36% Uyumlu!',
      '34% Uyumlu!',    '39% Uyumlu!',
      '42% Uyumlu!',    '45% Uyumlu!',
      '47% Uyumlu!',    '51% Uyumlu!',
      '54% Uyumlu!',    '56% Uyumlu!',
      '59% Uyumlu!',    '58% Uyumlu!',
      '60% Uyumlu!',    '63% Uyumlu!',
      '65% Uyumlu!',    '64% Uyumlu!',
      '68% Uyumlu!',    '70% Uyumlu!',
      '74% Uyumlu!',    '78% Uyumlu!',
      '79% Uyumlu!',    '80% Uyumlu!',
      '83% Uyumlu!',    '86% Uyumlu!',
      '84% Uyumlu!',    '89% Uyumlu!',
      '91% Uyumlu!',    '93% Uyumlu!',
      '95% Uyumlu!',    '97% Uyumlu!',
      '98% Uyumlu!',    '99% Uyumlu!',
      'Evlenek Ne Bekliyon', 'Çabuk Evlenmeniz Gereken Konular Var'
  ]
  
  let şarkı = [
      'https://open.spotify.com/track/2SGltWNsdjCjyf6eh3iM0g?si=c49bb2c15ac343f5',
      'https://open.spotify.com/track/0ywlnV6QEZneCbbqLev6qL?si=a94d3ae7328b476c',
      'https://open.spotify.com/track/0JkZUrGmvzpX4yP8CoqItc?si=c5b35b77a6804b43',
      'https://open.spotify.com/track/0yrqfgfaQs222WGcZMvIFA?si=3219a4f749884702',
      'https://open.spotify.com/track/2911GW6Gdfuc3CQ2HrLDn6?si=a590bce4552f40a0',
      'https://open.spotify.com/track/3ZGUpGjkL9D5wjMWd7wFB5?si=ed9b59544f6a4eab',
      'https://open.spotify.com/track/38j60DwttFNYk2GmCTIUod?si=2ab67840f1a84dd0',
      'https://open.spotify.com/track/6KmThLltgcLO058vNzxvMV?si=2a89388eeb42414c',
      'https://open.spotify.com/track/26EzdCBOvRJljcc2zYOEVP?si=e4c5cd109369406e',
      'https://open.spotify.com/track/7hrjh79DQVNwGTL3EgrBi4?si=c4e24bf978ea457c',
      'https://open.spotify.com/track/11AkXmBdjwu4upt22GjJrG?si=76fe1e69c3224af3',
      'https://open.spotify.com/track/6ZvKnJSendvbZGiVMmgIdp?si=c3fb586f7c0142b2',
      'https://open.spotify.com/track/0kjy0Qk3anB4t1dNIL7No3?si=8f9cea3da1e146e3',
      'https://open.spotify.com/track/3jDcUArWhSonfHpK3QXJug?si=2b4db33b15784b89',
      'https://open.spotify.com/track/4uoXb2toU8zWD27TpJS7Yk?si=1a6217915dd5422f',
      'https://open.spotify.com/track/4UohOvkgmCt3p0PYOPnHjN?si=8f0199b91b164724',
      'https://open.spotify.com/track/04RR90pc7GMGHfELXfuX2Z?si=56154d8544164a7b',
      'https://open.spotify.com/track/6CcJMwBtXByIz4zQLzFkKc?si=a76b6157d1c6480b',
      'https://open.spotify.com/track/1GvNBnLOlRKZYS93fdEN9h?si=9e3a97956b3d4046',
      'https://open.spotify.com/track/0wr0JTOlgZVYccny0GlL4T?si=432cd351bee74708',
      'https://open.spotify.com/track/3bKMzeLEDmPHzDMWplhdtP?si=4d28a63f8a3a4a67',
      'https://open.spotify.com/track/5SFBaOi2ELB2P5tFzmcD73?si=713b86f5e0d64a62',
      'https://open.spotify.com/track/2pPJA6IEl9iyXtVyrE06cT?si=05e234d20ad645b7',
      'https://open.spotify.com/track/6nhJ2KSi1rKGX75frHpkXK?si=7bd37d56f85f4148',
      'https://open.spotify.com/track/5XMAeSjjinBwKjdANxHbeZ?si=87ec32afe2994536',
      'https://open.spotify.com/track/0slHapEcgmGP0kwfqQLLmP?si=4bf5c78418ef4136',
  ]

  let emoti ;
  if(j2poncik.BotsOwners.some(x=> x == message.member.id)){
  emoti = 43;
  } else {
  emoti= Math.floor((Math.random()*replies.length))
  }
  let love = replies[emoti]
  
  const canvas = Canvas.createCanvas(384, 128);
  const ctx = canvas.getContext('2d');
  
  // Bottaki görselleri kullan
  const backgroundImagePath = path.join(__dirname, '../../../../../../Global/Images/ShipBackgroundPurple.png');
  
  let avatar1, avatar2;
  try {
    const avatar1URL = message.member?.user?.displayAvatarURL({ extension: "jpg", forceStatic: true, size: 256 });
    const avatar2URL = member?.displayAvatarURL({ extension: "jpg", forceStatic: true, size: 256 });
    if (!avatar1URL || !avatar2URL) {
      return message.reply({ content: `${red} Avatar görselleri alınamadı.` }).catch(() => {});
    }
    avatar1 = await Canvas.loadImage(avatar1URL);
    avatar2 = await Canvas.loadImage(avatar2URL);
  } catch (err) {
    console.error('Ship avatar yüklenemedi:', err.message);
    return message.reply({ content: `${red} Görsel oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.` }).catch(() => {});
  }
  
  ctx.beginPath();
  ctx.moveTo(0 + Number(10), 0);
  ctx.lineTo(0 + 384 - Number(10), 0);
  ctx.quadraticCurveTo(0 + 384, 0, 0 + 384, 0 + Number(10));
  ctx.lineTo(0 + 384, 0 + 128 - Number(10));
  ctx.quadraticCurveTo(
  0 + 384,
  0 + 128,
  0 + 384 - Number(10),
  0 + 128
  );
  ctx.lineTo(0 + Number(10), 0 + 128);
    ctx.quadraticCurveTo(0, 0 + 128, 0, 0 + 128 - Number(10));
    ctx.lineTo(0, 0 + Number(10));
    ctx.quadraticCurveTo(0, 0, 0 + Number(10), 0);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 384, 128);
    
    // Arka plan olarak kullanıcıdan gelen görseli kullan
    try {
      let background = await Canvas.loadImage(backgroundImagePath);
      ctx.drawImage(background, 0, 0, 384, 129);
    } catch (err) {
      console.error('Ship background yüklenemedi:', err.message);
      // Background yüklenemezse devam et
    }

    const loveMatch = String(love).match(/\d{1,3}/);
    const lovePercentage = loveMatch ? `${Math.min(100, Number(loveMatch[0]))}%` : "100%";

    // Ortaya daha belirgin, kırmızı bir kalp çiz.
    const centerX = 192;
    const centerY = 66;
    const heartSize = 31;
    drawHeart(ctx, centerX, centerY, heartSize);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 17px Sans";
    ctx.fillText(lovePercentage, centerX, centerY - 6);
    
    drawCircleAvatar(ctx, avatar1, 20, 20, 96);
    drawCircleAvatar(ctx, avatar2, 270, 20, 96);
    
    let buffer;
    try {
      buffer = canvas.toBuffer('image/png');
      if (!buffer) {
        return message.reply({ content: `${red} Görsel oluşturulurken bir hata oluştu.` }).catch(() => {});
      }
    } catch (err) {
      console.error('Ship canvas buffer oluşturulamadı:', err.message);
      return message.reply({ content: `${red} Görsel oluşturulurken bir hata oluştu.` }).catch(() => {});
    }
    
    const img = new AttachmentBuilder().setFile(buffer)
    let Row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setLabel("Tanış!")
        .setEmoji("🥰")
        .setDisabled(emoti <= 44 && emoti >= 23 ? false : true)
        .setCustomId("test")
        .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
        .setLabel("Sizin Şarkınız")
        .setEmoji("🎶")
        .setDisabled(emoti <= 44 && emoti >= 23 ? false : true)
        .setCustomId("test2")
        .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
        .setLabel("Sil")
        .setEmoji("1099793976644599959")
        .setDisabled(emoti <= 44 && emoti >= 23 ? true : false)
        .setCustomId("test3")
        .setStyle(ButtonStyle.Secondary)
    )
    const targetName = resolveMemberName(member);
    const authorName = resolveMemberName(message.member);

    message.react(`${client.emoji("server_onay")}`)
    message.reply({components: [Row] ,content: `[ **${targetName}** & **${authorName}** ]\nYakışıyor musunuz? **${love}**\nBebeğinizin İsmi : **${compareToNames(targetName, authorName)}**`, files: [img]})

    .then(async (msg) => {
      try {
        await msg.react("🥰").catch(() => {});
        await msg.react("😘").catch(() => {});
        await msg.react("😳").catch(() => {});
      } catch (err) {
        // React hatalarını görmezden gel
      }
      
      var filter = (i) => i.user.id == message.member.id
      let collector = msg.createMessageComponentCollector({filter: filter, time: 30000 , max: 2})
      collector.on('collect', async (i) => {
          if(i.customId == "test") {
  
              const row = new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                  .setLabel("Profil Görmek İçin Tıkla")
                  .setStyle(ButtonStyle.Link)
                  .setURL(`https://discord.com/users/${member.id}`), )
            
              i.reply({content: `${member}`,components: [row], ephemeral: true}).catch(() => {})
             
          }
          if(i.customId == "test2") {
              let şarkıcık;
              şarkıcık = Math.floor((Math.random()*şarkı.length))
              let love = şarkı[şarkıcık]
              i.reply({content: `${love}`, ephemeral: true}).catch(() => {})
             
          }
          if(i.customId == "test3") {
              try {
                await message.delete().catch(() => {});
                await i.message.delete().catch(() => {});
              } catch (err) {
                // Mesaj silme hatalarını görmezden gel
              }
          }
      })

      collector.on("end", async (i) => {
        try {
          // Mesaj hala mevcut mu kontrol et
          if (msg && msg.editable) {
            Row.components[0].setDisabled(true);
            Row.components[1].setDisabled(true);
            Row.components[2].setDisabled(true);
            await msg.edit({ components: [Row] }).catch(() => {});
          }
        } catch (err) {
          // Mesaj düzenleme hatalarını görmezden gel
        }
      });
    })
    .catch(() => {
      // Mesaj gönderme hatalarını görmezden gel
    })
 },
};

function compareToNames(name1, name2) {
  const clear = (name) => {
    const normalized = String(name || "")
      .replace(/[^a-zA-Z0-9 ]+/g, " ")
      .trim();
    return normalized.split(/\s+/).filter(Boolean)[0] || "";
  };

  const first = clear(name1);
  const second = clear(name2);

  const safeFirst = first.length >= 3 ? first.substring(0, 3) : (first || "lov");
  const safeSecond = second.length >= 3 ? second.substring(second.length - 3) : (second || "ely");

  return `${safeFirst}${safeSecond}`;
}

function resolveMemberName(member) {
  if (!member) return "User";
  const nickname = typeof member.nickname === "string" ? member.nickname.trim() : "";
  const displayName = typeof member.displayName === "string" ? member.displayName.trim() : "";
  const username = typeof member.user?.username === "string" ? member.user.username.trim() : "";

  return nickname || displayName || username || "User";
}

function drawCircleAvatar(ctx, image, x, y, size) {
  const radius = size / 2;
  const centerX = x + radius;
  const centerY = y + radius;

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, x, y, size, size);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.stroke();
  ctx.restore();
}

function drawHeart(ctx, centerX, centerY, size) {
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 2;

  const topY = centerY - size * 0.55;
  const bottomY = centerY + size * 0.72;

  ctx.beginPath();
  ctx.moveTo(centerX, bottomY);
  ctx.bezierCurveTo(
    centerX - size * 1.35,
    centerY + size * 0.05,
    centerX - size * 1.1,
    topY - size * 0.7,
    centerX,
    topY
  );
  ctx.bezierCurveTo(
    centerX + size * 1.1,
    topY - size * 0.7,
    centerX + size * 1.35,
    centerY + size * 0.05,
    centerX,
    bottomY
  );
  ctx.closePath();

  const gradient = ctx.createLinearGradient(centerX, topY, centerX, bottomY);
  gradient.addColorStop(0, "#ff6b7a");
  gradient.addColorStop(0.55, "#ff2e44");
  gradient.addColorStop(1, "#cc001a");
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
  ctx.stroke();
  ctx.restore();
}
