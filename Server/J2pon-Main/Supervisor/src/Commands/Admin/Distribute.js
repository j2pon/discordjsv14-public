const { ApplicationCommandOptionType,PermissionsBitField, ChannelType } = require("discord.js");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const j2poncik = require("../../../../../../Global/Settings/System");

module.exports = {
    name: "dağıt",
    description: "Bulunduğunuz ses kanalındaki üyeleri public odalara dağıtmaya yarar.",
    category: "ADMIN",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["dağıt", "dagit"],
      usage: ".dağıt", 
    },
  

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {

        if(!j2ponm.OwnerRoles.some(j2ponlan => message.member.roles.cache.has(j2ponlan)) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) 
        {
        message.reply({ content:`Yeterli yetkin yok!`}).then((e) => setTimeout(() => { e.delete(); }, 5000)); 
        return }
	
		let voiceChannel = message.member.voice.channelId;
		if (!voiceChannel)
			return message.reply({ content: "Bir ses kanalında olmalısın!" });
		let publicRooms = message.guild.channels.cache.filter(
			(c) =>
				c.parentId === j2ponm.PublicRoomsCategory &&
				c.id !== j2ponm.SleepRoomChannel &&
				c.type === ChannelType.GuildVoice,
		);
		[...message.member.voice.channel.members.values()].forEach(
			(m, index) => {
				setTimeout(() => {
					if (m.voice.channelId !== voiceChannel) return;
					m.voice.setChannel(publicRooms.random().id);
				}, index * 1000);
			},
		);
		message.reply({content: `\`${message.member.voice.channel.name}\` ses kanalında bulunan üyeler public kanallara dağıtılmaya başlandı!`});
     },

  };