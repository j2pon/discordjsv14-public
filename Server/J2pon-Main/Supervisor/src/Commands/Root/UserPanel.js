const { ApplicationCommandOptionType, EmbedBuilder, Events, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder, Embed, MessageFlags } = require("discord.js");
let ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, SectionBuilder, ThumbnailBuilder;
try {
    const v2 = require("discord.js");
    ContainerBuilder = v2.ContainerBuilder;
    TextDisplayBuilder = v2.TextDisplayBuilder;
    SeparatorBuilder = v2.SeparatorBuilder;
    SeparatorSpacingSize = v2.SeparatorSpacingSize;
    SectionBuilder = v2.SectionBuilder;
    ThumbnailBuilder = v2.ThumbnailBuilder;
} catch (_) {}
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const j2poncik = require("../../../../../../Global/Settings/System");
const voiceUserParent = require("../../../../../../Global/Schemas/voiceUserParent");
const inviterSchema = require("../../../../../../Global/Schemas/inviter");
const inviteMemberSchema = require("../../../../../../Global/Schemas/inviteMember");
const nameData = require("../../../../../../Global/Schemas/names")
const cezapuan = require("../../../../../../Global/Schemas/cezapuan")
const ceza = require("../../../../../../Global/Schemas/ceza")
const levels = require("../../../../../../Global/Schemas/level");
const { profileImage } = require('discord-arts');
const { YamlDatabase } = require("../../../../../../Global/Helpers/YamlDB");
const { nokta, green, star,red } = require('../../../../../../Global/Settings/Emojis.json');
const db = new YamlDatabase();
const moment = require("moment");
const penals = require("../../../../../../Global/Schemas/penals");
const { MessageStat, MessageUserChannel, VoiceStat, VoiceUserChannel, StreamerStat, StreamerUserChannel, CameraStat, CameraUserChannel } = require("../../../../../../Global/Models")

// Cooldown maps (per-user) for öneri/şikayet (30 minutes)
const suggestionCooldowns = new Map();
const complaintCooldowns = new Map();

module.exports = {
    name: "userpanel",
    description: "Kullanıcı Panel",
    category: "OWNER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["kullanicipanel"],
      usage: ".userpanel", 
    },

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {

     
      // Build panel matching provided design: numbered grid + action buttons (Yetkili Başvuru, Öneri/İstek, Şikayet)
      const infoText = [
        "`1` Sunucuya giriş tarihinizi öğrenin.",
        "`2` Hesap oluşturma tarihinizi öğrenin.",
        "`3` Ceza durumunuzu görüntüleyin.",
        "",
        "`4` Sunucudaki eski isim bilgilerinizi görüntüleyin.",
        "`5` Üzerinizdeki rollerin listesini görüntüleyin.",
        "`6` Sunucudaki toplam mesaj sayınızı görüntüleyin.",
        "",
        "`7` Sesli sohbet sürelerinizi görüntüleyin.",
        "`8` Hesabınızın oluşturulma tarihini görüntüleyin.",
        "`9` Davet bilgilerinizi görüntüleyin.",
        "",
        "- Yetkili başvuru: Yetkili olmak isteyenler için başvuru sürecini başlatır. Başvurunuz ilgili ekip tarafından incelenecek, değerlendirilecek ve sonuç size DM olarak iletilecektir. Başvuruların incelenmesi zaman alabilir; lütfen sonuç için sabırlı olun.",
        "- Öneri / İstek: Sunucu ile ilgili fikir, öneri veya isteklerinizi buradan iletebilirsiniz. Her kullanıcı, spamı engellemek amacıyla 30 dakikalık bir cooldown ile öneri gönderebilir. Gönderilen öneriler belirtilen log kanalına kayıt edilir ve yönetim tarafından değerlendirilir.",
        "- Şikayet: Sunucu içi kural ihlalleri veya ciddi sorunları bu bölümden bildirebilirsiniz. Şikayetleriniz, ilgili log kanalına iletilir ve moderasyon ekibi tarafından incelenir; her kullanıcı 30 dakikada bir şikayet gönderebilir. Acil veya tehlikeli durumlarda doğrudan yetkililere ulaşmanız önerilir."
      ].join("\n\n");

      const numericRows = [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("I").setStyle(ButtonStyle.Secondary).setEmoji(client.emoji("sayiEmoji_bir") || "1"),
          new ButtonBuilder().setCustomId("II").setStyle(ButtonStyle.Secondary).setEmoji(client.emoji("sayiEmoji_iki") || "2"),
          new ButtonBuilder().setCustomId("III").setStyle(ButtonStyle.Secondary).setEmoji(client.emoji("sayiEmoji_uc") || "3")
        ),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("IV").setStyle(ButtonStyle.Secondary).setEmoji(client.emoji("sayiEmoji_dort") || "4"),
          new ButtonBuilder().setCustomId("V").setStyle(ButtonStyle.Secondary).setEmoji(client.emoji("sayiEmoji_bes") || "5"),
          new ButtonBuilder().setCustomId("VI").setStyle(ButtonStyle.Secondary).setEmoji(client.emoji("sayiEmoji_alti") || "6")
        ),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("VII").setStyle(ButtonStyle.Secondary).setEmoji(client.emoji("sayiEmoji_yedi") || "7"),
          new ButtonBuilder().setCustomId("VIII").setStyle(ButtonStyle.Secondary).setEmoji(client.emoji("sayiEmoji_sekiz") || "8"),
          new ButtonBuilder().setCustomId("IX").setStyle(ButtonStyle.Secondary).setEmoji(client.emoji("sayiEmoji_dokuz") || "9")
        ),
      ];

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("userpanel_yetkili")
          .setLabel("Yetkili Başvuru")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(client.emoji("appEmoji_create") || "📋"),
        new ButtonBuilder()
          .setCustomId("userpanel_oneri")
          .setLabel("Öneri / İstek")
          .setStyle(ButtonStyle.Primary)
          .setEmoji(client.emoji("server_info") || "💬"),
        new ButtonBuilder()
          .setCustomId("userpanel_sikayet")
          .setLabel("Şikayet")
          .setStyle(ButtonStyle.Danger)
          .setEmoji(client.emoji("server_carpi") || "⚠️"),
      );

      // Build components V2 container
      if (ContainerBuilder && TextDisplayBuilder && SeparatorBuilder && SeparatorSpacingSize != null) {
        const welcome = new ContainerBuilder();
        try {
          if (SectionBuilder && ThumbnailBuilder) {
            // single section that contains both title and infoText, with thumbnail accessory shown at top-right
            const section = new SectionBuilder()
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## ${message.guild.name} Kullanıcı Paneli`),
                new TextDisplayBuilder().setContent(infoText)
              )
              .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.client.user.displayAvatarURL({ size: 128 })));
            welcome.addSectionComponents(section);
          } else {
            welcome.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`## ${message.guild.name} Kullanıcı Paneli`),
              new TextDisplayBuilder().setContent(infoText)
            );
          }
          welcome.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true));

          // attach action rows and send
          if (welcome.addActionRowComponents && Array.isArray(numericRows)) {
            welcome.addActionRowComponents(...numericRows, actionRow);
            await message.channel.send({ components: [welcome], flags: MessageFlags.IsComponentsV2 });
            return;
          }
        } catch (e) {
          console.error("[UserPanel] Components V2 send failed, falling back to embed:", e?.message);
        }
      }

      // Fallback to embed if Components V2 not available
      const embed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle(`${message.guild.name} Kullanıcı Paneli`)
        .setDescription(infoText)
        .setThumbnail(message.client.user.displayAvatarURL({ size: 256 }));
      await message.channel.send({ embeds: [embed], components: [...numericRows, actionRow] });
},
}       

client.on(Events.InteractionCreate, async (interaction) => {
      
const member = interaction.user;
const inviterData = await inviterSchema.findOne({ guildID: j2poncik.ServerID, userID: interaction.user.id });
const total = inviterData ? inviterData.total : 0;
const regular = inviterData ? inviterData.regular : 0;
const bonus = inviterData ? inviterData.bonus : 0;
const leave = inviterData ? inviterData.leave : 0;
const fake = inviterData ? inviterData.fake : 0;
const invMember = await inviteMemberSchema.find({ guildID: j2poncik.ServerID, inviter: interaction.user.id });
const daily = invMember ? interaction.guild.members.cache.filter((m) => invMember.some((x) => x.userID === m.user.id) && Date.now() - m.joinedTimestamp < 1000 * 60 * 60 * 24).size : 0;
const weekly = invMember ? interaction.guild.members.cache.filter((m) => invMember.some((x) => x.userID === m.user.id) && Date.now() - m.joinedTimestamp < 1000 * 60 * 60 * 24 * 7).size : 0;
const davetettigim = invMember ? invMember.filter(byj2pon => interaction.guild.members.cache.get(byj2pon.userID)).slice(0, 10).map((byj2pon, index) => interaction.guild.members.cache.get(byj2pon.userID)).join(", ") : "Veri Yok"
            
////////////////////////////////////////////////////////////////////////////////////////////

const data = await nameData.findOne({ guildID: j2poncik.ServerID, userID: member.id });

////////////////////////////////////////////////////////////////////////////////////////////
const messageData =  await MessageStat.findOne({guildID: j2poncik.ServerID, userID: member.id});
const voiceData = await VoiceStat.findOne({guildID: j2poncik.ServerID, userID: member.id});
const streamData = await StreamerStat.findOne({guildID: j2poncik.ServerID, userID: member.id});
const cameraData = await CameraStat.findOne({guildID: j2poncik.ServerID, userID: member.id});

const messageTop = messageData ? messageData.TotalStat : 0;
const messageWeekly = messageData ? messageData.WeeklyStat : 0;
const messageDaily = messageData ? messageData.DailyStat : 0;
const voiceTop = moment.duration(voiceData ? voiceData.TotalStat : 0).format("H [saat], m [dakika]");
const voiceWeekly = moment.duration(voiceData ? voiceData.WeeklyStat : 0).format("H [saat], m [dakika]");
const voiceDaily = moment.duration(voiceData ? voiceData.DailyStat : 0).format("H [saat], m [dakika]");

////////////////////////////////////////////////////////////////////////////////////////////

if(interaction.customId === "I")
{
await interaction.reply({ content: `Sunucuya Katılma Tarihiniz: <t:${Math.floor(interaction.member.joinedTimestamp / 1000)}:R> (<t:${Math.floor(interaction.member.joinedTimestamp / 1000)}>)`, ephemeral: true });
}
if(interaction.customId === "II")
{
const byj2pon = await levels.findOne({ guildID: j2poncik.ServerID, userID: interaction.user.id })
interaction.reply({content: `**Mevcut Seviyen: \` ${byj2pon ? byj2pon.level : 1} \` bir sonraki seviyeye ulaşmak için \` ${byj2pon ? byj2pon.gerekli : 500 } \` __XP__ kazanman gerekiyor.**`, ephemeral: true});
}

if(interaction.customId === "III")

{
const data = await penals.find({ guildID: j2poncik.ServerID, userID: interaction.member.id }).sort({ date: -1 });
if (data.length === 0) { return interaction.reply({ content: `${client.emoji("server_onay")} ${member.toString()} üyesinin sicili temiz!`, ephemeral: true })}
let remainingData = [...data];
while (remainingData.length > 0) {
const dataSlice = remainingData.splice(0, 2000);
const formattedData = dataSlice.map((x) => `#${x.id} **[${x.type}]** ${moment(x.date).format("LLL")} tarihinde, <@${x.staff}> tarafından, \`${x.reason}\` nedeniyle, ${x.type.toLowerCase().replace("-", " ")} cezası almış.\n─────────────────`).join("\n");
const embed = new EmbedBuilder()
.setDescription(formattedData);
await interaction.reply({ embeds: [embed], ephemeral: true });
}
}

if(interaction.customId === "IV")

{
const byj2pon = new EmbedBuilder()
.setAuthor({ name: `${member.username} üyesinin isim bilgileri;`})
.setThumbnail(member.displayAvatarURL({ dynamic: true, size: 2048 }))
.setDescription(data ? data.names.splice(0, 10).map((x, i) => `\`${i + 1}.\` \`${x.name}\` (${x.rol}) **[**\`${moment(x.date).format("LLL")}\`**]**`).join("\n") : "Bu kullanıcıya ait isim geçmişi bulunmuyor!")         
await interaction.reply({ embeds: [byj2pon], ephemeral: true });
}

if(interaction.customId === "V")
{
await interaction.reply({ content: `Üzerinde bulunan rollerin listesi;  
${(await interaction.guild.members.cache.get(member.id).roles.cache.filter(a => a.name !== '@everyone').map(a => a).join(' ') ? await interaction.guild.members.cache.get(member.id).roles.cache.filter(a => a.name !== '@everyone').map(a => a).join(', ') : 'Hiç yok.')}`, ephemeral: true });
}

if(interaction.customId === "VI")
{
  await interaction.reply({ content: `
  ${client.emoji("server_star")} **Mesaj İstatistiği**
  ${client.emoji("server_nokta")} Toplam Mesaj: \` ${Number(messageTop).toLocaleString()} mesaj \`
  ${client.emoji("server_nokta")} Haftalık Mesaj: \` ${Number(messageWeekly).toLocaleString()} mesaj \`
  ${client.emoji("server_nokta")} Günlük Mesaj: \` ${Number(messageDaily).toLocaleString()} mesaj \`
  `, ephemeral: true });
}

if(interaction.customId === "VII")
{
  await interaction.reply({ content: `
  ${client.emoji("server_star")} **__Sesli Sohbet İstatistiği__**
  ${client.emoji("server_nokta")} Toplam Ses: \` ${voiceTop} \`
  ${client.emoji("server_nokta")} Haftalık Ses: \` ${voiceWeekly} \`
  ${client.emoji("server_nokta")} Günlük Ses: \` ${voiceDaily} \`
  
  ${client.emoji("server_star")} **__Yayın Sohbet İstatistiği__**
  ${client.emoji("server_nokta")} Toplam Yayın: \` ${moment.duration(streamData ? streamData.TotalStat : 0).format("H [saat], m [dakika]")} \`
  ${client.emoji("server_nokta")} Haftalık Yayın: \` ${moment.duration(streamData ? streamData.WeeklyStat : 0).format("H [saat], m [dakika]")} \`
  ${client.emoji("server_nokta")} Günlük Yayın: \` ${moment.duration(streamData ? streamData.DailyStat : 0).format("H [saat], m [dakika]")} \`
  
  ${client.emoji("server_star")} **__Kamera Sohbet İstatistiği__**
  ${client.emoji("server_nokta")} Toplam Kamera: \` ${moment.duration(cameraData ? cameraData.TotalStat : 0).format("H [saat], m [dakika]")} \`
  ${client.emoji("server_nokta")} Haftalık Kamera: \` ${moment.duration(cameraData ? cameraData.WeeklyStat : 0).format("H [saat], m [dakika]")} \`
  ${client.emoji("server_nokta")} Günlük Kamera: \` ${moment.duration(cameraData ? cameraData.DailyStat : 0).format("H [saat], m [dakika]")} \`
  `, ephemeral: true });}

if(interaction.customId === "VIII")
{
await interaction.reply({ content: `Hesabınızın Açılış Tarihi: <t:${Math.floor(member.createdTimestamp / 1000)}:R> (<t:${Math.floor(member.createdTimestamp / 1000)}>)`, ephemeral: true });
}

if(interaction.customId === "IX")
{
await interaction.reply({ content: `
Toplam **${total}** davet.
\` ${regular} gerçek \`
\` ${bonus} bonus \`
\` ${leave} ayrılmış \`
\` ${fake} fake \`
      
Günlük: \`${daily}\`, Haftalık: \`${weekly}\`

**❯ Davet ettiği tüm kişiler;**
${davetettigim ? `${davetettigim}` : 'Veri Yok'}
`, ephemeral: true });
}

// --- UserPanel custom actions ---
if (interaction.customId === "userpanel_yetkili") {
    const chId = j2ponm.BasvuruLogChannel || null;
    if (!chId) return interaction.reply({ content: "Yetkili başvuru kanalı ayarlı değil.", ephemeral: true });
    return interaction.reply({ content: `Yetkili başvuruları için lütfen şu kanala gidin: <#${chId}>`, ephemeral: true });
}

if (interaction.customId === "userpanel_oneri") {
    const userId = interaction.user.id;
    const last = suggestionCooldowns.get(userId) || 0;
    const now = Date.now();
    const COOLDOWN = 30 * 60 * 1000;
    if (now - last < COOLDOWN) {
        const remaining = Math.ceil((COOLDOWN - (now - last)) / 60000);
        return interaction.reply({ content: `Bu işlem için ${remaining} dakika daha bekleyin.`, ephemeral: true });
    }
    const modal = new (require('discord.js').ModalBuilder)()
        .setCustomId(`userpanel_oneri_modal_${userId}`)
        .setTitle("Öneri / İstek Gönder");
    modal.addComponents(
        new (require('discord.js').ActionRowBuilder)().addComponents(
            new (require('discord.js').TextInputBuilder)()
                .setCustomId("oneri_text")
                .setLabel("Öneri / İstekte Bulunun")
                .setStyle((require('discord.js').TextInputStyle).Paragraph)
                .setRequired(true)
        )
    );
    return interaction.showModal(modal);
}

if (interaction.customId === "userpanel_sikayet") {
    const userId = interaction.user.id;
    const last = complaintCooldowns.get(userId) || 0;
    const now = Date.now();
    const COOLDOWN = 30 * 60 * 1000;
    if (now - last < COOLDOWN) {
        const remaining = Math.ceil((COOLDOWN - (now - last)) / 60000);
        return interaction.reply({ content: `Bu işlem için ${remaining} dakika daha bekleyin.`, ephemeral: true });
    }
    const modal = new (require('discord.js').ModalBuilder)()
        .setCustomId(`userpanel_sikayet_modal_${userId}`)
        .setTitle("Şikayet Bildir");
    modal.addComponents(
        new (require('discord.js').ActionRowBuilder)().addComponents(
            new (require('discord.js').TextInputBuilder)()
                .setCustomId("sikayet_text")
                .setLabel("Şikayetinizi Yazın")
                .setStyle((require('discord.js').TextInputStyle).Paragraph)
                .setRequired(true)
        )
    );
    return interaction.showModal(modal);
}

// Modal submissions for öneri / şikayet
if (interaction.isModalSubmit() && interaction.customId && interaction.customId.startsWith("userpanel_oneri_modal_")) {
    const userId = interaction.user.id;
    const text = interaction.fields.getTextInputValue("oneri_text")?.trim();
    if (!text) return interaction.reply({ content: "Mesaj boş olamaz.", ephemeral: true });
    const logChannelId = j2ponm.IstekOneriSikayetLogChannel || null;
    if (logChannelId) {
        const guild = client.guilds.cache.get(j2poncik.ServerID);
        const logChannel = guild?.channels.cache.get(logChannelId);
        if (logChannel) {
            const embedLog = new (require('discord.js').EmbedBuilder)()
                .setTitle("Yeni Öneri / İstek")
                .setDescription(text)
                .addFields({ name: "Gönderen", value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true })
                .setTimestamp();
            await logChannel.send({ embeds: [embedLog] }).catch(() => {});
        }
    }
    suggestionCooldowns.set(userId, Date.now());
    setTimeout(() => suggestionCooldowns.delete(userId), 30 * 60 * 1000);
    return interaction.reply({ content: "Öneriniz başarıyla gönderildi. Teşekkürler!", ephemeral: true });
}

if (interaction.isModalSubmit() && interaction.customId && interaction.customId.startsWith("userpanel_sikayet_modal_")) {
    const userId = interaction.user.id;
    const text = interaction.fields.getTextInputValue("sikayet_text")?.trim();
    if (!text) return interaction.reply({ content: "Mesaj boş olamaz.", ephemeral: true });
    const logChannelId = j2ponm.SorunCozmeLogChannel || j2ponm.IstekOneriSikayetLogChannel || null;
    if (logChannelId) {
        const guild = client.guilds.cache.get(j2poncik.ServerID);
        const logChannel = guild?.channels.cache.get(logChannelId);
        if (logChannel) {
            const embedLog = new (require('discord.js').EmbedBuilder)()
                .setTitle("Yeni Şikayet")
                .setDescription(text)
                .addFields({ name: "Gönderen", value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true })
                .setTimestamp();
            await logChannel.send({ embeds: [embedLog] }).catch(() => {});
        }
    }
    complaintCooldowns.set(userId, Date.now());
    setTimeout(() => complaintCooldowns.delete(userId), 30 * 60 * 1000);
    return interaction.reply({ content: "Şikayetiniz başarıyla gönderildi. Gerekli inceleme yapılacaktır.", ephemeral: true });
}

    });
     

  const rakam = client.sayıEmoji = (sayi) => {
    var byj2pon = sayi.toString().replace(/ /g, "     ");
    var byj2pon2 = byj2pon.match(/([0-9])/g);
    byj2pon = byj2pon.replace(/([a-zA-Z])/g, "Belirlenemiyor").toLowerCase();
    if (byj2pon2) {
      byj2pon = byj2pon.replace(/([0-9])/g, d => {
        return {
          '0': client.emoji("sayiEmoji_sifir") !== null ? client.emoji("sayiEmoji_sifir") : "\` 0 \`",
          '1': client.emoji("sayiEmoji_bir") !== null ? client.emoji("sayiEmoji_bir") : "\` 1 \`",
          '2': client.emoji("sayiEmoji_iki") !== null ? client.emoji("sayiEmoji_iki") : "\` 2 \`",
          '3': client.emoji("sayiEmoji_uc") !== null ? client.emoji("sayiEmoji_uc") : "\` 3 \`",
          '4': client.emoji("sayiEmoji_dort") !== null ? client.emoji("sayiEmoji_dort") : "\` 4 \`",
          '5': client.emoji("sayiEmoji_bes") !== null ? client.emoji("sayiEmoji_bes") : "\` 5 \`",
          '6': client.emoji("sayiEmoji_alti") !== null ? client.emoji("sayiEmoji_alti") : "\` 6 \`",
          '7': client.emoji("sayiEmoji_yedi") !== null ? client.emoji("sayiEmoji_yedi") : "\` 7 \`",
          '8': client.emoji("sayiEmoji_sekiz") !== null ? client.emoji("sayiEmoji_sekiz") : "\` 8 \`",
          '9': client.emoji("sayiEmoji_dokuz") !== null ? client.emoji("sayiEmoji_dokuz") : "\` 9 \`"
        }[d];
      });
    }
    return byj2pon;
  }