const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField, codeBlock } = require("discord.js");
const system = require("../../../../../../Global/Settings/System");
const moment = require("moment");
const kanal = require("../../../../../../Global/Settings/AyarName");

module.exports = {
    name: "yardım",
    description: "Yardım Komudu",
    category: "USER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["help","yardim"],
      usage: ".yardım", 
    },
   

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {

     

      let command = args[0]
      if (client.commands.has(command)) {
      command = client.commands.get(command)
      message.reply({ embeds: [byj2ponembed.setThumbnail(message.author.avatarURL({dynamic: true, size: 2048})).setDescription(codeBlock("md",
`# ${command.name} komutunun detayları;
> İsmi              : ${command.name}
> Kullanım          : ${command.command.usage}
> Diğer Anahtarları : ${command.command.aliases.filter(x=> x !== command.name).join(", ")}
> Bekleme Süresi    : ${moment.duration(command.cooldown).format("s [Saniye]")}
< Açıklaması        : ${command.description}
`
))]})
        return;
      }

    const row = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('yardım')
        .setPlaceholder(`${client.commands.size} adet komut bulunmakta!`)
        .addOptions([
          { label: 'Üye Komutları', description: 'Genel tüm komutları içerir.', value: 'USER' },
          // Ekonomi komutları kaldırıldı
          { label: 'İstatistik Komutları', description: 'Genel tüm stat komutlarını içerir.', value: 'STATISTICS' },
          { label: 'Teyit Komutları', description: 'Genel tüm kayıt komutlarını içerir.', value: 'REGISTER' },
          { label: 'Yetkili Komutları', description: 'Genel tüm yetkili komutlarını içerir.', value: 'STAFF' },
          { label: 'Yönetim Komutları', description: 'Genel tüm yönetim komutlarını içerir.', value: 'ADMIN'},
          { label: 'Kurucu Komutları', description: 'Genel tüm kurucu komutlarını içerir.', value: 'OWNER' },
         ]),
    );

    let msg = await message.reply({ embeds: [byj2ponembed.setDescription(`:tada: Aşağıdaki kategorilerden komut yardım almak istediğiniz kategoriyi seçin`)], components: [row] })
    var filter = (menu) => menu.user.id === message.author.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 90000 })

    collector.on("collect", async (menu) => {
      const categories = ["USER", "REGISTER", "STATISTICS", "STAFF", "ADMIN", "OWNER"];
      const selectedCategory = categories.find(category => menu.values[0] === category);
      
      if (selectedCategory) {
        await menu.deferUpdate();
    
        try {
          const commands = client.commands.filter(x => x.category !== "-" && x.category === selectedCategory.toUpperCase());
          const emojiFunc = client.emoji || (() => null);
          const emojiResult = emojiFunc("server_nokta");
          const emoji = emojiResult ? emojiResult.toString() : "•";
          const description = commands.size > 0 
            ? commands.map(x => {
                const usage = x.command?.usage || x.name || "N/A";
                return `${emoji} \`${usage}\``;
              }).join('\n')
            : 'Bu kategoride komut bulunmamaktadır.';
          
          if (!description || description.trim().length === 0) {
            return;
          }
          
          const embed = new EmbedBuilder()
            .setAuthor({ name: message.guild?.name || "Sunucu", iconURL: message.guild?.iconURL({ dynamic: true, size: 2048 }) || undefined })
            .setDescription(description);
          
          await msg.edit({ embeds: [embed], components: [row] });
        } catch (error) {
          // Hata durumunda sessizce geç
        }
      }
    });
    
  collector.on("end", () => {
    msg.delete().catch(err => {})
  })
},

  };