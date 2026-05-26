const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "ping",
    description: "Botun pingini gösterir",
    category: "OWNER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: [],
      usage: ".ping", 
    },
  
    onLoad: function (client) { },

    onCommand: async function (client, message, args) {
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🏓 Pong!')
            .setDescription(`**Gecikme:** ${client.ws.ping}ms\n**API Gecikmesi:** ${Date.now() - message.createdTimestamp}ms`)
            .setTimestamp();
            
        message.reply({ embeds: [embed] });
    },
};