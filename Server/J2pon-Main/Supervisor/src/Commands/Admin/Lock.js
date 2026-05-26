const { ApplicationCommandOptionType,EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,PermissionsBitField } = require("discord.js");
const j2poncik = require("../../../../../../Global/Settings/System");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");

module.exports = {
    name: "kilit",
    description: "Kanalı kitlersiniz.",
    category: "ADMIN",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["kilitle","lock","unlock"],
      usage: ".kilit",
    },

    onLoad: function (client) { },

    onCommand: async function (client, message, args) {
      if(!j2ponm.OwnerRoles.some(j2ponlan => message.member.roles.cache.has(j2ponlan)) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) 
      { 
      message.react(`${client.emoji("server_carpi")}`)
      message.reply({ content:`Yeterli yetkin yok!`}).then((e) => setTimeout(() => { e.delete(); }, 5000)); 
      return }

  const ac = new ButtonBuilder()
  .setCustomId("ac")
  .setStyle(ButtonStyle.Secondary)
  .setEmoji("🔓");

const kapa = new ButtonBuilder()
  .setCustomId("kapa")
  .setStyle(ButtonStyle.Secondary)
  .setEmoji("🔒");

const hasSendMessagesPermission = message.channel.permissionsFor(message.guild.id).has(PermissionsBitField.Flags.SendMessages);

if (hasSendMessagesPermission) {
  // Kanal açıksa, "aç" butonu disabled, "kapa" butonu enabled
  ac.setStyle(ButtonStyle.Success).setDisabled(true);
  kapa.setStyle(ButtonStyle.Danger).setDisabled(false);
} else {
  // Kanal kilitliyse, "aç" butonu enabled, "kapa" butonu disabled
  ac.setStyle(ButtonStyle.Success).setDisabled(false);
  kapa.setStyle(ButtonStyle.Danger).setDisabled(true);
}

const row = new ActionRowBuilder()
  .addComponents([ac, kapa]);

const byj2pon = new EmbedBuilder()
  .setFooter({ text: j2poncik.SubTitle })
  .setDescription(`${message.author} Kanalı kitlemek veya kilidini açmak için butonları kullanınız.`);

const msg = await message.channel.send({ embeds: [byj2pon], components: [row] });

const filter = button => button.user.id === message.author.id;
const collector = await msg.createMessageComponentCollector({ filter, time: 30000 });

collector.on("collect", async (button) => {
  if (button.customId === "ac") {
    await button.deferUpdate();
    const everyone = message.guild.roles.cache.find(r => r.name === "@everyone");
    await message.channel.permissionOverwrites.edit(everyone.id, {
      SendMessages: true
    });
    message.react("🔓");
    await msg.edit({ content: `Kanalın kilidi başarıyla açıldı.`, embeds: [], components: [] });
  } else if (button.customId === "kapa") {
    await button.deferUpdate();
    const everyone = message.guild.roles.cache.find(r => r.name === "@everyone");
    await message.channel.permissionOverwrites.edit(everyone.id, {
      SendMessages: false
    });
    message.react("🔒");
    await msg.edit({ content: `Kanal başarıyla kilitlendi.`, embeds: [], components: [] });
  }
});



     },

  };