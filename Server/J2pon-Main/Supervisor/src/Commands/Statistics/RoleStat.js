const { EmbedBuilder } = require("discord.js");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const j2poncik = require("../../../../../../Global/Settings/System");
const moment = require("moment");
require("moment-duration-format");
moment.locale("tr")
const { MessageStat, MessageUserChannel, VoiceStat, VoiceUserChannel, StreamerStat, StreamerUserChannel, CameraStat, CameraUserChannel } = require("../../../../../../Global/Models")


module.exports = {
    name: "roldenetim",
    description: "Roldeki kişilerin istatistiğini listeler.",
    category: "ADMIN",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["rolstat"],
      usage: ".roldenetim @rol", 
    },
  

    onLoad: function (client) { },

    onCommand: async function (client, message, args) {

        if (!j2ponm.OwnerRoles.some(j2ponlan => message.member.roles.cache.has(j2ponlan)) && !message.member.permissions.has()) {
            message.reply({ content: `Yetkin bulunmamakta dostum.` }).then((e) => setTimeout(() => { e.delete(); }, 5000));
            return
         }
          
         const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);

         if (!role) return message.reply({ content: `Lütfen istatiğine bakmak istediğiniz bir rolü etiketleyiniz.`}).then((e) => setTimeout(() => { e.delete(); }, 10000)); 

         if (role) {
            if(!client.guilds.cache.get(j2poncik.ServerID).roles.cache.get(role.id)) {
              return message.reply({ content: "Sunucuda belirttiğiniz rol bulunmamaktadır.", ephemeral: true })
            }
        }

// helper: fetch, filter by role, sort desc by stat, format lines
const buildStatLines = async (Model, type, isTime = false) => {
  let data = await Model.find({ guildID: message.guild.id }).lean();
  // keep only users who are in guild and have the role
  data = data.filter((x) => {
    const m = message.guild.members.cache.get(x.userID);
    return m && m.roles.cache.has(role.id);
  });
  // sort descending by numeric stat (handle missing fields)
  data.sort((a, b) => (Number(b[type] || b.TotalStat || 0) - Number(a[type] || a.TotalStat || 0)));
  // do not limit here — include all role members' stats
  if (!data.length) return "Veri bulunmuyor!";

  const lines = [];
  for (let i = 0; i < data.length; i++) {
    const x = data[i];
    const statRaw = Number(x[type] ?? x.TotalStat ?? 0) || 0;
    let value = "";
    if (isTime) {
      // normalize milliseconds/seconds ambiguity
      let seconds = statRaw;
      if (seconds > 1e12) seconds = Math.floor(seconds / 1000);
      value = moment.duration(seconds, "seconds").format("H [saat], m [dakika]");
    } else {
      value = Number(statRaw).toLocaleString();
    }
    // format: "n - username : `value`" (no mentions in the file)
    let member = message.guild.members.cache.get(x.userID);
    if (!member) {
      try {
        member = await message.guild.members.fetch(x.userID).catch(() => null);
      } catch {
        member = null;
      }
    }
    // use username (not displayName) inside the JS file content
    const username = member ? (member.user.username) : (x.userTag || x.userID);
    lines.push(`${i + 1} - ${username} : \`${value}\``);
  }
  return lines.join("\n");
};

// build the embed content
const roleName = client.guilds.cache.get(j2poncik.ServerID).roles.cache.get(role.id).name;
const voiceText = await buildStatLines(VoiceStat, "TotalStat", true);
const messageText = await buildStatLines(MessageStat, "TotalStat", false);
const streamText = await buildStatLines(StreamerStat, "TotalStat", true);
const cameraText = await buildStatLines(CameraStat, "TotalStat", true);

// build role members list (numbered mentions) in one message
const roleMembers = role.members.map((m) => m.id);
roleMembers.sort((a, b) => {
  const ma = (message.guild.members.cache.get(a)?.displayName || "").toLowerCase();
  const mb = (message.guild.members.cache.get(b)?.displayName || "").toLowerCase();
  return ma.localeCompare(mb);
});
const roleMemberLines = roleMembers.map((id, i) => `${i + 1} - <@${id}>`).join("\n") || "Rolde üye yok.";

// Build full text file (JS/text) containing all stats (no truncation)
const text = `────────────────────────────────────

➜ ${roleName} Rolündeki Üyeler ve Ses Bilgileri:
            
${voiceText}
            
────────────────────────────────────
            
➜ ${roleName} Rolündeki Üyeler ve Mesaj Bilgileri:

${messageText}
            
────────────────────────────────────

➜ ${roleName} Rolündeki Üyeler ve Yayın Bilgileri:

${streamText}

────────────────────────────────────

➜ ${roleName} Rolündeki Üyeler ve Kamera Bilgileri:

${cameraText}
            
────────────────────────────────────`;

// send as file (like before) to avoid embed limits
await message.channel.send({ content: `${message.guild.roles.cache.get(role.id).toString()} rolüne sahip üyelerin verileri;`, files: [{ attachment: Buffer.from(text), name: "j2ponrolstat.js" }] });

// send role members as plain content below (chunk if too long)
const chunkAndSendContent = async (fullText, maxLen = 1900) => {
  if (!fullText) return;
  if (fullText.length <= maxLen) {
    await message.channel.send({ content: fullText }).catch(() => {});
    return;
  }
  const lines = fullText.split("\n");
  let buffer = "";
  for (const line of lines) {
    if ((buffer + "\n" + line).length > maxLen) {
      await message.channel.send({ content: buffer }).catch(() => {});
      buffer = line;
    } else {
      buffer = buffer ? buffer + "\n" + line : line;
    }
  }
  if (buffer) await message.channel.send({ content: buffer }).catch(() => {});
};

await chunkAndSendContent(`Roldeki Kişiler (${roleName}):\n${roleMemberLines}`);
    }

  };