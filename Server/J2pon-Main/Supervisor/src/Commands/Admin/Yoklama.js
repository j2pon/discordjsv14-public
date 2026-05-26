const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder,ButtonStyle } = require("discord.js");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const j2poncik = require("../../../../../../Global/Settings/System");
module.exports = {
    name: "yoklama",
    description: "Toplantıda bulunan kişilere katıldı permi verir.",
    category: "ADMIN",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["yoklama", "katıldı"],
      usage: ".yoklama", 
    },
  

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {

    if (!j2ponm.OwnerRoles.some(j2ponlan => message.member.roles.cache.has(j2ponlan)) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply({ content: `Yetkin bulunmamakta dostum.` }).then((e) => setTimeout(() => { e.delete(); }, 5000));

    if (!message.member.voice.channel || message.member.voice.channel.id != j2ponm.MeetingChannel) return message.reply({content:"Bu komutu başlatabilmek için toplantı kanalında olmalısın."});
    

    const confirmerRole = message.guild.roles.cache.get(j2ponm.ConfirmerRoles[0]);

    if (!confirmerRole) {
      return console.log("Belirtilen rol bulunamadı.");
    }
    
    let yetkili = [
      ...message.guild.members.cache.filter(
        (member) => !member.user.bot && member.roles.highest.position >= confirmerRole.position
      ).values()
    ];

const joinedMeetingMembers = yetkili.filter((member) => {
    return (
      member.voice.channel &&
      member.voice.channel.id === j2ponm.MeetingChannel &&
      !member.roles.cache.has(j2ponm.JoinedRole)
    );
  });
  
  await Promise.all(
    joinedMeetingMembers.map((member) => {
      return member.roles.add(j2ponm.JoinedRole);
    })
  );
  
  const leftMeetingMembers = yetkili.filter((member) => {
    return (
      (!member.voice.channel && member.roles.cache.has(j2ponm.JoinedRole)) ||
      (member.voice.channel &&
        member.voice.channel.id !== j2ponm.JoinedRole &&
        member.roles.cache.has(j2ponm.JoinedRole))
    );
  });
  
  await Promise.all(
    leftMeetingMembers.map((member) => {
    return member.roles.remove(j2ponm.JoinedRole);
    })
  );
  
 message.channel.send({
content: `Toplantıda bulunan ${joinedMeetingMembers.length} yetkililere katıldı rolü veriliyor.
  
Toplantıda bulunmayan ${leftMeetingMembers.length} yetkiliden katıldı rolü alınıyor.`,
});
},
};