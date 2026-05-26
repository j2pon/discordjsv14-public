const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, PermissionsBitField, ComponentType } = require("discord.js");
const setup = require("../../../../../../Global/Settings/Setup.json");
const system = require("../../../../../../Global/Settings/System");

module.exports = {
  name: "sorumlulukgekle",
  description: "Bir üyeye sorumluluk rolü ekler.",
  category: "OWNER",
  cooldown: 0,
  command: {
    enabled: true,
    aliases: ["sorumluluk-ekle", "sorumlulukekle"],
    usage: ".sorumlulukgekle <@User/ID>",
  },

  onLoad: function (client) {},

  onCommand: async function (client, message, args) {
    if (!system.BotsOwners.includes(message.author.id)) {
      return message.reply({ content: "Bu komutu sadece bot sahipleri kullanabilir." }).then((e) => setTimeout(() => e.delete(), 5000));
    }

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!member) {
      return message.reply({ content: "Lütfen bir üye belirtin. Örn: `.sorumlulukgekle @üye`" }).then((e) => setTimeout(() => e.delete(), 5000));
    }

    const responsibilityConfig = setup.Sorumluluk?.StaffRoles || {};
    const options = [];

    for (const [key, roles] of Object.entries(responsibilityConfig)) {
      const responsibleRole = message.guild.roles.cache.get(roles.responsible);
      if (responsibleRole) {
        options.push({
          label: `${key.toUpperCase()} Sorumlusu`,
          value: roles.responsible,
          description: `${responsibleRole.name} rolünü verir.`
        });
      }

      const leaderRole = message.guild.roles.cache.get(roles.leader);
      if (leaderRole) {
        options.push({
          label: `${key.toUpperCase()} Lideri`,
          value: roles.leader,
          description: `${leaderRole.name} rolünü verir.`
        });
      }
    }

    if (options.length === 0) {
      return message.reply({ content: "Setup dosyasında tanımlı sorumluluk rolü bulunamadı." }).then((e) => setTimeout(() => e.delete(), 5000));
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId("sorumluluk_ekle_menu")
      .setPlaceholder("Eklenecek sorumluluk rolünü seçin...")
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(menu);

    const embed = new EmbedBuilder()
      .setColor(0x2f3136)
      .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
      .setDescription(`${member} kullanıcısına eklemek istediğiniz sorumluluk rolünü aşağıdan seçin.`);

    const msg = await message.channel.send({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 30000,
      filter: (i) => i.user.id === message.author.id && i.customId === "sorumluluk_ekle_menu"
    });

    collector.on("collect", async (interaction) => {
      const roleId = interaction.values[0];
      const role = message.guild.roles.cache.get(roleId);

      if (!role) {
        return interaction.reply({ content: "Rol bulunamadı.", ephemeral: true });
      }

      try {
        await member.roles.add(role);
        await interaction.reply({ content: `${member} kullanıcısına **${role.name}** sorumluluk rolü başarıyla eklendi.`, ephemeral: true });
        msg.delete().catch(() => {});
      } catch (err) {
        console.error(err);
        await interaction.reply({ content: "Rol eklenirken bir hata oluştu.", ephemeral: true });
      }
    });

    collector.on("end", (_, reason) => {
      if (reason === "time") {
        msg.edit({ components: [] }).catch(() => {});
      }
    });
  },
};
