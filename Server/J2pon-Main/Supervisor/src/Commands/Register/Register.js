const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle, PermissionsBitField, ChannelType } = require("discord.js");
const toplams = require("../../../../../../Global/Schemas/toplams");
const isimler = require("../../../../../../Global/Schemas/names");
const regstats = require("../../../../../../Global/Schemas/registerStats");
const otokayit = require("../../../../../../Global/Schemas/otokayit");
const setup = require("../../../../../../Global/Settings/Setup.json");
const system = require("../../../../../../Global/Settings/System");
const kanal = require("../../../../../../Global/Settings/AyarName");
const cezapuan = require("../../../../../../Global/Schemas/cezapuan");
const ceza = require("../../../../../../Global/Schemas/ceza");
const userTask = require("../../../../../../Global/Schemas/userTask");
const tasks = require("../../../../../../Global/Schemas/tasks");
const GuildTagService = require("../../../../../../Global/Services/GuildTagService");

module.exports = {
  name: "kayıt",
  description: "Belirttiğiniz üyeyi kayıt eder",
  category: "REGISTER",
  cooldown: 0,
  command: {
    enabled: true,
    aliases: ["kayit", "kayıt", "kadın", "Kadın", "k", "kadin", "Kadin", "Woman", "kız", "Kız", "erkek", "Erkek", "e", "ERKEK", "Man", "man"],
    usage: ".k <@user/ID> <Isim>",
  },


  onLoad: function (client) {
  },

  onCommand: async function (client, message, args) {


    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
    const data = await isimler.findOne({ guildID: message.guild.id, userID: member.user.id });

    if (!setup.ConfirmerRoles.some(role => message.member.roles.cache.has(role)) && 
        !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return messageReactAndReply(`${client.emoji("server_carpi")}`, `Yeterli yetkin yok!`);
    }
    
    if (!member) {
      return messageReactAndReply(`${client.emoji("server_carpi")}`,`Bir kullanıcı etiketlemelisin ya da ID'sini girmelisin.\nÖrn: .k @üye Can`);
    }
    
    if (setup.ManRoles.some(x => member.roles.cache.has(x)) && !setup.GirlRoles.some(x => member.roles.cache.has(x))) {
      return messageReactAndReply(`${client.emoji("server_carpi")}`, "Bu üye zaten kayıtlı durumda yanlış kayıt ettiyseniz eğer kayıtsız atarak tekrar kayıt edebilirsiniz.");
    }
    
    if (message.author.id === member.id) {
      return messageReactAndReply(`${client.emoji("server_carpi")}`, "Kendini kaydedemezsin!");
    }
    
    if (!member.manageable) {
      return messageReactAndReply(`${client.emoji("server_carpi")}`, "Böyle birisini kayıt edemiyorum!");
    }
    
    if (message.member.roles.highest.position <= member.roles.highest.position) {
      return messageReactAndReply(`${client.emoji("server_carpi")}`, "Belirttiğin kişinin yetkisi senden yüksek!");
    }


    function messageReactAndReply(emoji, content) {
      message.react(emoji);
      message.reply({ content }).then((e) => setTimeout(() => { e.delete(); }, 5000));
    }
    
    const tagModedata = await regstats.findOne({ guildID: message.guild.id });
    if (tagModedata && tagModedata.tagMode === true) {
      const hasTag = await GuildTagService.memberHasGuildTag(client, member);
      if (!hasTag &&
          !member.roles.cache.has(setup.VipRole) &&
          !member.roles.cache.has(setup.BoosterRole)) {
        return message.reply({
          embeds: [new EmbedBuilder().setDescription(`${member.toString()} isimli üyenin profilinde tagımız (\` ${setup.ServerTag} \`) olmadığı, <@&${setup.BoosterRole}>, <@&${setup.VipRole}> Rolü olmadığı için isim değiştirmekden başka kayıt işlemi yapamazsınız.`)]
        });
      }
    }

    const cezasayi = await ceza.findOne({ guildID: message.guild.id, userID: member.user.id });
    if (cezasayi?.top >= 5 && 
        !message.member.roles.cache.some(role => 
          setup.ConfirmerRoles.includes(role.id) && 
          role.rawPosition <= message.guild.roles.cache.get(setup.ConfirmerRoles[0]).rawPosition
        )) {
      const embed = new EmbedBuilder()
        .setAuthor({name: message.author.username, iconURL: message.author.avatarURL({dynamic: true})})
        .setColor("Random")
        .setDescription(`
        ${client.emoji("server_carpi")} ${member.toString()} adlı kişinin kayıt işlemi, daha önce toplam **${cezasayi.top}** kez ceza-i işlem uygulandığı için iptal edildi. Sunucumuz, tüm faaliyetleri kayıt altına almaktadır. Sunucunun huzurunu bozan ve kurallara uymayan kullanıcılar, kayıt olamazlar.

        Eğer bu konu hakkında şikayetiniz varsa, ${setup.ConfirmerRoles.map(x => `<@&${x}>`)} rolüne veya üstlerine başvurabilirsiniz. İyi bir çözüm bulabilmek için işbirliği yapmaktan mutluluk duyarız.
        `);
      return message.reply({ embeds: [embed], content: `Kayıt duraklatıldı.` });
    }

    args = args.filter(a => a !== "" && a !== " ").splice(1);
    let isim = args.map(arg => String(arg).charAt(0).replace('i', "İ").toUpperCase() + String(arg).slice(1)).join(" ");
    
    if (!isim) {
      message.reply({ content: `\`.k <@User/ID> <Isim>\`` }).then((e) => setTimeout(() => { e.delete(); }, 5000));
      return;
    }

    member.setNickname(`${setup.ServerUntagged} ${isim}`).catch(err => message.reply({ content: `İsim çok uzun.` }));


    const row = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
        .setCustomId("MAN")
        .setLabel("Erkek")
        .setEmoji("1145434181682331718")
        .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
        .setCustomId("WOMAN")
        .setLabel("Kadın")
        .setEmoji("1145434185604014253")
        .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
        .setCustomId("iptal")
        .setLabel("İptal")
        .setEmoji("1099793976644599959")
        .setStyle(ButtonStyle.Danger)
    )
 
    const byj2pon = new EmbedBuilder()
      .setDescription(`
    ${member.toString()} (\`${isim}\`) isimli üyenin kayıt işlemini tamamlanabilmesi için lütfen aşağıdaki düğmelerden cinsiyeti seçiniz.
    
    Bu kayıt işlemine \`30 Saniye\` içerisinde tepki vermezseniz, işlem otomatik olarak iptal edilir.
    `)
    const byj2ponMan = new EmbedBuilder()
      .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setDescription(`${client.emoji("server_onay")} ${member.toString()} isimli üye **Erkek** olarak kayıt edildi.`)

    const byj2ponWoman = new EmbedBuilder()
      .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setDescription(`${client.emoji("server_onay")} ${member.toString()} isimli üye **Kadın** olarak kayıt edildi.`)

    message.react(`${client.emoji("server_onay")}`)
    let msg = await message.channel.send({ embeds: [byj2pon], components: [row] })
    const filter = button => button.member.id === message.author.id;
    const collector = msg.createMessageComponentCollector({ filter: filter, time: 30000 });

    collector.on("collect", async (button) => {
      if (button.customId === "MAN") {
        msg.edit({ embeds: [byj2ponMan], components: [] });
        await member.roles.add(setup.ManRoles);
        await member.roles.remove(setup.UnRegisteredRoles);
        await toplams.findOneAndUpdate({ guildID: message.guild.id, userID: message.author.id }, { $push: { toplams: member.user.id } }, { upsert: true });
        await regstats.findOneAndUpdate({ guildID: message.guild.id, userID: message.author.id }, { $inc: { top: 1, erkek: 1 }}, { upsert: true });
        await regstats.findOneAndUpdate({ guildID: message.guild.id, userID: message.author.id }, { $push: { kayitlar: member.user.id} }, { upsert: true });
        await isimler.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $push: { names: { name: member.displayName, yetkili: message.author.id, rol: setup.ManRoles.map(x => `<@&${x}>`).join(" , "), date: Date.now(), Gender: "Erkek" } } }, { upsert: true });
        if (setup.ChatChannel && client.channels.cache.has(setup.ChatChannel)) {
          client.channels.cache.get(setup.ChatChannel).send({content: `${member} aramıza katıldı! Ona hoşgeldin diyelim :tada:`}).delete(30);
        }
        await otokayit.updateOne({ userID: member.user.id }, { $set: { userID: member.user.id, roleID: setup.ManRoles, name: isim } }, { upsert: true }).exec();

                // Görev 
        await userTask.findOneAndUpdate(
            { userId: message.author.id },
            { $inc: { 'counts.register': 1 } },
            { upsert: true }
        );

        // Sorumluluk Görevi (Teyit Sorumlusu)
        await require("../../../../../../Global/Schemas/userResponsibilityTask").findOneAndUpdate(
            { userId: message.author.id, responsibilityKey: "register" },
            { $inc: { 'counts.register': 1 } }
        );
        // Görev
        const log = new EmbedBuilder().setDescription(`**${member.user.tag}** kullanıcısı **${message.author.tag}** tarafından **ERKEK** olarak kayıt edildi.`)
          .addFields(
            { name: "Kullanıcı", value: `${member}`, inline: true },
            { name: "Yetkili", value: `${message.author}`, inline: true },
            { name: "Kayıt Tarihi", value: `<t:${Math.floor((Date.now()) / 1000)}:R>`, inline: true },
          )
          .setFooter({ text: 'Üyenin geçmiş isimlerini görüntülemek için .isimler komutunu kullanabilirsiniz.' });
        const channel = client.channels.cache.find(x => x.name === "register_log")
        if (!channel) return;
        channel.send({ embeds: [log] });

        // Kayıttan sonra otomatik kanal taşıma kaldırıldı
      }
      if (button.customId === "WOMAN") {
        msg.edit({ embeds: [byj2ponWoman], components: [] })
        await member.roles.add(setup.GirlRoles);
        await member.roles.remove(setup.UnRegisteredRoles);
        await toplams.findOneAndUpdate({ guildID: message.guild.id, userID: message.author.id }, { $push: { toplams: member.user.id } }, { upsert: true });
        await regstats.findOneAndUpdate({ guildID: message.guild.id, userID: message.author.id }, { $inc: { top: 1, kız: 1, }}, { upsert: true });
        await regstats.findOneAndUpdate({ guildID: message.guild.id, userID: message.author.id }, { $push: { kayitlar: member.user.id} }, { upsert: true });
        await isimler.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $push: { names: { name: member.displayName, yetkili: message.author.id, rol: setup.GirlRoles.map(x => `<@&${x}>`).join(" , "), date: Date.now(), Gender: "Kadın" } } }, { upsert: true });
        // Görev 

        const checkForTask = await userTask.findOne({ userId: message.author.id });

        if (!checkForTask) {
            new userTask({
                userId: message.author.id,
                roleId: message.member.roles.highest.id
            }).save()
        }

        const dataForTask = await userTask.findOne({ userId: message.author.id });

        if (dataForTask) {
            const activeTask = await tasks.findOne({ currentRole: dataForTask.roleId })
            
            if (activeTask) {
                if (!dataForTask.completeds?.register && dataForTask.counts?.register > activeTask.requiredCounts.register) {
                    await userTask.findOneAndUpdate(
                        { userId: message.author.id },
                        { $set: {'counts.register': 0, 'completeds.register': true} },
                        { upsert: true, new: true }
                    )
                } else {
                    await userTask.findOneAndUpdate(
                        { userId: message.author.id },
                        { $inc: { 'counts.register': 1 } },
                        { upsert: true, new: true }
                    )
                }
            }
        }

        // Görev       
        if (setup.ChatChannel && client.channels.cache.has(setup.ChatChannel)) {
          client.channels.cache.get(setup.ChatChannel).send({content: `${member} aramıza katıldı! Kendisine Hoşgeldin diyelim :tada:`}).delete(30);
        }
        await otokayit.updateOne({
          userID: member.user.id
        }, {
          $set: {
            userID: member.user.id,
            roleID: setup.GirlRoles,
            name: isim
          }
        }, {
          upsert: true
        }).exec();

          const log = new EmbedBuilder().setDescription(`**${member.user.tag}** kullanıcısı **${message.author.tag}** tarafından **KADIN** olarak kayıt edildi.`)
            .addFields(
              { name: "Kullanıcı", value: `${member}`, inline: true },
              { name: "Yetkili", value: `${message.author}`, inline: true },
              { name: "Kayıt Tarihi", value: `<t:${Math.floor((Date.now()) / 1000)}:R>`, inline: true },
            )
            .setFooter({ text: 'Üyenin geçmiş isimlerini görüntülemek için .isimler komutunu kullanabilirsiniz.' });
          const channel2 = client.channels.cache.find(x => x.name === "register_log")
          if (!channel2) return;
          channel2.send({ embeds: [log] });

          // Kayıttan sonra otomatik kanal taşıma kaldırıldı
        
      }
      if (button.customId === "iptal") {
        if(msg) msg.delete();
        button.reply({ content:`İşlem Başarıyla İptal Edildi`, embeds: [], components: [], ephemeral: true});
        member.setNickname(`${setup.ServerUntagged} Kayıtsız`);
        await member.roles.add(setup.UnRegisteredRoles);
        await member.roles.remove(setup.GirlRoles);
        await member.roles.remove(setup.ManRoles);
      }
    });
  },
};

