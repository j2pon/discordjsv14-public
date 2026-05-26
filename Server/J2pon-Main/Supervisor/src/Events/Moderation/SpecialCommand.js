
const { EmbedBuilder, Events,PermissionFlagsBits,ChannelType,PermissionsBitField } = require('discord.js');
const { green } = require("../../../../../../Global/Settings/Emojis.json");
const j2ponm = require("../../../../../../Global/Settings/Setup.json")
const özelPerms = require("../../../../../../Global/Schemas/specialcommand")
const system = require("../../../../../../Global/Settings/System");
const client = global.client;
const { YamlDatabase } = require("../../../../../../Global/Helpers/YamlDB");
const db = new YamlDatabase();


client.on(Events.MessageCreate, async (message) => {

  if (!message.guild || message.channel.type === ChannelType.DM || message.author.bot) return;
  
  // Prefix kontrolü - mesaj prefix ile başlamalı
  const prefix = system.Mainframe.Prefixs.find((x) => message.content.toLowerCase().startsWith(x.toLowerCase()));
  if (!prefix) return; // Prefix yoksa devam etme
  
  const data = await özelPerms.findOne({ guildID: message.guild.id })
  const permsData = data ? data.perms : [];
  
  // Prefix'i çıkar ve komutu al
  let args = message.content.toLowerCase().substring(prefix.length).trim().split(" ");
  let talentPerm = permsData.find((e) => e.permName === args[0]);
  if (talentPerm) {
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[1]) 
    
    // Rol kontrolü
    let hasRole = false; 
    if (talentPerm.staffRoleID && Array.isArray(talentPerm.staffRoleID) && talentPerm.staffRoleID.length > 0) {
      hasRole = talentPerm.staffRoleID.some(app => message.member.roles.cache.has(app));
    } else if (talentPerm.staffRoleID && !Array.isArray(talentPerm.staffRoleID) && talentPerm.staffRoleID) {
      hasRole = message.member.roles.cache.has(talentPerm.staffRoleID);
    }
    
    // Kullanıcı kontrolü
    let hasUser = false;
    if (talentPerm.staffUserID && Array.isArray(talentPerm.staffUserID) && talentPerm.staffUserID.length > 0) {
      hasUser = talentPerm.staffUserID.includes(message.author.id);
    } else if (talentPerm.staffUserID && !Array.isArray(talentPerm.staffUserID) && talentPerm.staffUserID) {
      hasUser = talentPerm.staffUserID === message.author.id;
    }
    
    // Yetki kontrolü (rol, kullanıcı veya admin yetkisi)
    const hasAdminPerms = message.member.permissions.has(PermissionsBitField.Flags.Administrator) || 
                          message.member.permissions.has(PermissionsBitField.Flags.ManageRoles) || 
                          message.member.permissions.has(PermissionsBitField.Flags.BanMembers);
    
    // Eğer ne rol kontrolü, ne kullanıcı kontrolü, ne de admin yetkisi varsa, komut kullanılamaz
    if (!hasRole && !hasUser && !hasAdminPerms) {
      return message.reply({content: `${client.emoji("server_carpi")} Yetkin Yetersiz!`})
    }
    if (!member) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${client.emoji("server_carpi")} Lütfen rol verilecek kişiyi etiketle.`)] }).then((e) => setTimeout(() => { e.delete(); }, 5000)).catch(err => {});
    if (Array.isArray(talentPerm.permID) ? talentPerm.permID.some(app => member.roles.cache.has(app)) : member.roles.cache.has(talentPerm.permID)) {
      let removedRoles = member.roles.cache.filter(x => Array.isArray(talentPerm.permID) ? talentPerm.permID.some(y => x.id === y) : talentPerm.permID == x.id).map(x => x.id)
      member.roles.remove(removedRoles)
      message.channel.send({
        embeds: [new EmbedBuilder().setAuthor({ name: message.author.tag, iconURL: message.author.avatarURL({ dynamic: true }) })
          .setDescription(`${client.emoji("server_onay")} ${member} kullanıcısından ${Array.isArray(talentPerm.permID) ? talentPerm.permID.map(x => `<@&${x}>`) : `<@&${talentPerm.permID}>`} ${Array.isArray(talentPerm.permID) ? "rolleri" : `rolü`} alındı.`)]
      }).then(e => setTimeout(() => e.delete(), 5000))
    } else {
      member.roles.add(talentPerm.permID)
      message.channel.send({
        embeds: [new EmbedBuilder().setAuthor({ name: message.author.tag, iconURL: message.author.avatarURL({ dynamic: true }) })
          .setDescription(`${client.emoji("server_onay")} ${member} kullanıcısına ${Array.isArray(talentPerm.permID) ? talentPerm.permID.map(x => `<@&${x}>`) : `<@&${talentPerm.permID}>`} ${Array.isArray(talentPerm.permID) ? "rolleri" : `rolü`} verdi.`)]
      }).then(e => setTimeout(() => e.delete(), 5000))
    }
    await message.react(`${client.emoji("server_onay")}`)
  }
});

  