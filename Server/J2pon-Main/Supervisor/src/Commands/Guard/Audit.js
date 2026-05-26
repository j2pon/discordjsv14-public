const { ApplicationCommandOptionType, codeBlock } = require("discord.js");

module.exports = {
    name: "denetim",
    description: "Sunucu denetimi",
    category: "OWNER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: [],
      usage: ".denetim", 
    },
  

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {

        if (!args[0] || (args[0].toLowerCase() !== "rol" && args[0].toLowerCase() !== "kanal")) return message.channel.send({ embeds: [byj2ponembed.setDescription(`Lütfen \`rol/kanal\` olmak üzere geçerli bir eylem belirtiniz`)]})
        try {
            if (args[0].toLowerCase() === "rol") {
                const audit = await message.guild.fetchAuditLogs({ type: 32 }).then(a => a.entries);
                const denetim = audit.filter(e => !e.executor.bot && Date.now() - e.createdTimestamp < 1000 * 60 * 60 * 3).map(e => ` Rol İsim: ${e.changes.filter(e => e.key === 'name').map(e => e.old)}\n Rol id: ${e.target.id}\n Silen: ${e.executor.tag}\n────────────────────────────────────────────────────────────────────────`);
                if (!denetim.length) return message.channel.send({ embeds: [byj2ponembed.setDescription(`Son **3** saat de silinmiş herhangi bir rol bulunamadı!`)]});
                let list = global.chunkify(denetim, 10);
                list.forEach(x => {
                    message.channel.send(codeBlock("js", x.join("\n")));
                });
            } else if (args[0].toLowerCase() === "kanal") {
                const audit = await message.guild.fetchAuditLogs({ type: 12 }).then(a => a.entries);
                const denetim = audit.filter(e => !e.executor.bot && Date.now() - e.createdTimestamp < 1000 * 60 * 60 * 3).map(e => ` Kanal İsim: ${e.changes.filter(e => e.key === 'name').map(e => e.old)}\n Kanal id: ${e.target.id}\n Silen: ${e.executor.tag}\n────────────────────────────────────────────────────────────────────────`);
                if (!denetim.length) return message.channel.send({ embeds: [byj2ponembed.setDescription(`Son **3** saat de silinmiş herhangi bir kanal bulunamadı!`)]});
                let list = global.chunkify(denetim, 10);
                list.forEach(x => {
                    message.channel.send(codeBlock("js", x.join("\n")));
                });
            }
        } catch (error) {
            message.channel.send({ embeds: [byj2ponembed.setDescription(`Denetim sırasında bir hata oluştu: ${error.message}`)]});
        }


     },

  };