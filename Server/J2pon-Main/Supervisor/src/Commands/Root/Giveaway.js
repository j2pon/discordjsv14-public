const { ApplicationCommandOptionType,EmbedBuilder,ActionRowBuilder, StringSelectMenuBuilder,Events, TextInputStyle,ModalBuilder,TextInputBuilder  } = require("discord.js");
const client = global.bot;
const ms = require("ms");
const messages = require('../../../../../../Global/Settings/messages');

module.exports = {
    name: "cekilis",
    description: "Çekiliş başlatırsın",
    category: "OWNER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["çekiliş"],
      usage: ".çekiliş", 
    },

    onLoad: function (client) {
        client.on(Events.InteractionCreate,async(interaction) => {
            if(!interaction.isModalSubmit()) return;
            if (interaction.customId === 'gvstartModal') {
                let kanal = interaction.channel.id
                if(!interaction.guild.channels.cache.get(kanal))return interaction.reply({content:`\`${kanal}\` ID'sine Sahip Bir kanal Bulunamadı!`})
                let prize = interaction.fields.getTextInputValue('gvprize');
                let time = interaction.fields.getTextInputValue('gvtime');
                let winnders = interaction.fields.getTextInputValue('gvwinners');
                let desc = interaction.fields.getTextInputValue('gvdesc');
                let req = interaction.fields.getTextInputValue('gvreq');
                
                let customMessages = Object.assign({}, messages);
                let extraText = "";
                if(desc) extraText += `**Açıklama:**\n${desc}\n\n`;
                if(req) extraText += `**Şartlar:**\n${req}\n\n`;
                
                if (extraText) {
                    customMessages.inviteToParticipate = `${extraText}${messages.inviteToParticipate}`;
                }
            
                client.giveawaysManager.start(interaction.guild.channels.cache.get(kanal), {duration: ms(time),winnerCount:parseInt(winnders),prize:prize,messages: customMessages})
                interaction.reply({content:` 🎉 \`${prize}\` Ödüllü ${winnders} Kişinin Kazanacağı ${time} Sürelik Çekiliş ${interaction.guild.channels.cache.get(kanal)} Kanalında Başlatıldı!`})
                
            }else if(interaction.customId === 'gvendModal'){
                let id = interaction.fields.getTextInputValue('gvendid');
                let x = client.giveawaysManager.giveaways.find((g) => g.prize === id)
                if (!x) return interaction.reply({content:`\`${id}\` adında aktif bir çekiliş bulunamadı!`, ephemeral: true});
                client.giveawaysManager.end(x.messageId).catch(() => {});
                interaction.reply({content:` 🎉 \`${x.prize}\` Ödüllü Çekiliş Bitirildi!`})
            }
        });
    },

    onCommand: async function (client, message, args, byj2ponembed) {

    let buttons = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
    .setPlaceholder("Çekiliş İşlemini Şeçiniz!")
    .setCustomId("giveawaymenu")
    .setOptions([
    { label: `Çekiliş Başlat`, description: `Bir Çekiliş Başlatır!`, value: `gvstart`, emoji: `🎉` },
    { label: `Çekiliş Bitir`, description: `Aktif Olan Bir Çekilişi Bitirir!`, value: `gvend`, emoji: `🛑` }
    ]))

    let msg = await message.reply({ components: [buttons], embeds: [byj2ponembed.setDescription(`Menuden Bir \`Çekiliş\` İşlemi Belirtiniz!`)] })
    message.delete();     

    const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === message.member.id, time: 30000, max: 1 });

    collector.on('end', async (byj2pon) => {
        if (byj2pon.size == 0) msg.delete();
    })

    collector.on('collect', async (interaction) => {
        if (!interaction.isStringSelectMenu()) return;
        let value = interaction.values[0];
        switch (value) {
            case "gvstart":
                msg.delete();
                const modal = new ModalBuilder()
                .setCustomId('gvstartModal')
                .setTitle('Çekiliş Başlat');
                
                const gvprize = new TextInputBuilder()
                .setCustomId('gvprize')
                .setLabel("Çekiliş Başlığı / Ödülü")
                .setMinLength(2)
                .setMaxLength(100)
                .setPlaceholder("Örn; Spotify Premium")
                .setStyle(TextInputStyle.Short)   
                .setRequired(true);
                
                const gvtime = new TextInputBuilder()
                .setCustomId('gvtime')
                .setMinLength(2)
                .setMaxLength(10)
                .setLabel("Çekiliş Süresi")
                .setPlaceholder("Örn; 10m")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

                const gvwinners = new TextInputBuilder()
                .setCustomId('gvwinners')
                .setLabel("Kazanacak Kişi Sayısı")
                .setMinLength(1)
                .setMaxLength(2)
                .setPlaceholder("Örn; 2")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

                const gvdesc = new TextInputBuilder()
                .setCustomId('gvdesc')
                .setLabel("Çekiliş Açıklaması")
                .setMaxLength(2000)
                .setPlaceholder("Açıklama giriniz (İsteğe bağlı)")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false);

                const gvreq = new TextInputBuilder()
                .setCustomId('gvreq')
                .setLabel("Katılım Şartları")
                .setMaxLength(1000)
                .setPlaceholder("Şartları giriniz (İsteğe bağlı)")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false);

                let g1 = new ActionRowBuilder().addComponents(gvprize);
                let g2 = new ActionRowBuilder().addComponents(gvtime);
                let g3 = new ActionRowBuilder().addComponents(gvwinners);
                let g4 = new ActionRowBuilder().addComponents(gvdesc);
                let g5 = new ActionRowBuilder().addComponents(gvreq);
                modal.addComponents(g1, g2, g3, g4, g5);

                await interaction.showModal(modal);

                break;
                case "gvend":
                    msg.delete();
                    const modal2 = new ModalBuilder()
                    .setCustomId('gvendModal')
                    .setTitle('Çekiliş Bitir');
                const gvend1 = new TextInputBuilder()
                    .setCustomId('gvendid')
                    .setLabel("Bitirilecek Çekilişin Ödül Adı")
                    .setPlaceholder("Örn; Spotify")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);
        
                    let gend = new ActionRowBuilder().addComponents(gvend1);
                    modal2.addComponents(gend);

                    await interaction.showModal(modal2);

                break;

        }});
},
};