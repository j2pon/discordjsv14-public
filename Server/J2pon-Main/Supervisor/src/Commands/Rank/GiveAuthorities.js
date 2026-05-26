const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");
const setup = require("../../../../../../Global/Settings/Setup.json");
const system = require("../../../../../../Global/Settings/System");
const kanal = require("../../../../../../Global/Settings/AyarName");
const userTask = require("../../../../../../Global/Schemas/userTask");
const tasks = require("../../../../../../Global/Schemas/tasks");
const yetkis = require("../../../../../../Global/Schemas/yetkialdir");
const GuildTagService = require("../../../../../../Global/Services/GuildTagService");
module.exports = {
    name: "yetkialdır",
    description: "Yetkili",
    category: "STAT",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["yetki-aldır","yetkili","yetkiliyap","yetkili-yap","yetkiver"],
        usage: ".yetkiiliyap",
    },
   

    onLoad: function (client) { },

    onCommand: async function (client, message, args) {
        if (!setup.RolePanelRoles.some(role => message.member.roles.cache.has(role)) && 
            !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            message.react(`${client.emoji("server_carpi")}`);
            return message.reply({ content: "Yeterli yetkin yok!" })
                .then((e) => setTimeout(() => { e.delete(); }, 5000)); 
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            return message.channel.send({ content: "Bir üye belirtmeyi unuttun!" })
                .then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        const hasTag = await GuildTagService.memberHasGuildTag(client, member);
        if (!hasTag) {
            return message.channel.send({ content: "Bu üyede tagımız bulunmuyor!" })
                .then((e) => setTimeout(() => { e.delete(); }, 5000));
        }
        const yetkiData = await yetkis.findOne({ guildID: message.guild.id });
        if (!yetkiData) {
            await new yetkis({ guildID: message.guild.id }).save();
        }
        
        if (yetkiData) {
            const isaretlenenIDAsNumber = parseInt(yetkiData.ısaretlenenID, 10);
            if (isaretlenenIDAsNumber === parseInt(member.id, 10)) {
                message.react(`${client.emoji("server_carpi")}`);
                return message.channel.send({ content: "Bu üye daha önceden yetkili olarak işaretlenmiş!" })
                    .then((e) => setTimeout(() => { e.delete(); }, 5000)); 
            }
        }


        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("evet")
                    .setLabel("Evet")
                    .setStyle(ButtonStyle.Success)
                    .setEmoji(`${client.emoji("server_onay")}`),
                
                new ButtonBuilder()
                    .setCustomId("hayir")
                    .setLabel("Hayır")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji(`${client.emoji("server_carpi")}`)
            );
        
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("evet")
                    .setLabel("Evet")
                    .setStyle(ButtonStyle.Success)
                    .setEmoji(`${client.emoji("server_onay")}`)
                    .setDisabled(true),
                
                new ButtonBuilder()
                    .setCustomId("hayir")
                    .setLabel("Hayır")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji(`${client.emoji("server_carpi")}`)
                    .setDisabled(true)
            );

        const onayembed = new EmbedBuilder() 
            .setAuthor({ name: member.displayName, iconURL: member.user.avatarURL({ dynamic: true })})
            .setFooter({ text: message.author.tag, iconURL: message.author.avatarURL({ dynamic: true })})
            .setDescription(`${member.toString()}, ${message.member.toString()} üyesi seni yetkili olarak başlatmak istiyor. Kabul ediyor musun?`);

        const msg = await message.reply({ content: `${member.toString()}`, embeds: [onayembed], components: [row]});
        const filter = button => button.user.id === member.user.id;
        const collector = await msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on("collect", async (button) => {
            if (button.customId === "evet") {
                await button.deferUpdate();
        
                message.react(`${client.emoji("server_onay")}`);
                const yetkiliembed = new EmbedBuilder() 
                    .setAuthor({ name: member.displayName, iconURL: member.user.avatarURL({ dynamic: true })})
                    .setFooter({ text: message.author.tag, iconURL: message.author.avatarURL({ dynamic: true })})
                    .setDescription(`${client.emoji("server_onay")} ${member.toString()} üyesi ${message.author} tarafından ${setup.StartAuthority.map(x => `<@&${x}>`)} rolleri verilerek yetkili olarak işaretlendi.`);
                
                try {
                    await member.roles.add(setup.StartAuthority);
                    await member.roles.add(setup.AuthRole);
                    await msg.edit({ embeds: [yetkiliembed], components: [row2]});
                    await yetkis.findOneAndUpdate(
                        { guildID: message.guild.id, userID: message.member.id }, 
                        { $inc: {count: 1}, $push: { users: {memberId: member.id, date: Date.now()}}}, 
                        {upsert: true}
                    );
                    
                    // Görev Sistemleri Güncelleme
                    await userTask.findOneAndUpdate(
                        { userId: message.member.id },
                        { $inc: { 'counts.yetkili': 1 } },
                        { upsert: true }
                    );

                    await require("../../../../../../Global/Schemas/userResponsibilityTask").findOneAndUpdate(
                        { userId: message.member.id, responsibilityKey: "yetkili" },
                        { $inc: { 'counts.yetkili': 1 } }
                    );

                    const existingDocs = await yetkis.find({});
                    for (const doc of existingDocs) {
                        await yetkis.updateOne({ _id: doc._id }, { $set: { ısaretlenenID: member.id } });
                    }

                } catch (error) {
                    console.error("Yetki verme işlemi başarısız:", error);
                }
            }
    
            if (button.customId === "hayir") {
                await button.deferUpdate();
        
                message.react(`${client.emoji("server_carpi")}`);
                const embedss = new EmbedBuilder() 
                    .setAuthor({ name: member.displayName, iconURL: member.user.avatarURL({ dynamic: true })})
                    .setFooter({ text: message.author.tag, iconURL: message.author.avatarURL({ dynamic: true })})
                    .setDescription(`${client.emoji("server_carpi")} ${member.toString()} Adlı kullanıcı ${message.author} kişisinin taglı aldırma isteğini reddetti.`);
                
                await msg.edit({ embeds: [embedss], components: [row2]});
            }
        });
    } 
};
