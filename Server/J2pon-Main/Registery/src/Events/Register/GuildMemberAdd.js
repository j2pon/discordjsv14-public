const client = global.client;
const { ActivityType, Events, ChannelType, AttachmentBuilder, MessageFlags } = require('discord.js');
let ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, SectionBuilder, ThumbnailBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder;
try {
    const v2 = require('discord.js');
    ContainerBuilder = v2.ContainerBuilder;
    TextDisplayBuilder = v2.TextDisplayBuilder;
    SeparatorBuilder = v2.SeparatorBuilder;
    SeparatorSpacingSize = v2.SeparatorSpacingSize;
    SectionBuilder = v2.SectionBuilder;
    ThumbnailBuilder = v2.ThumbnailBuilder;
    MediaGalleryBuilder = v2.MediaGalleryBuilder;
    MediaGalleryItemBuilder = v2.MediaGalleryItemBuilder;
} catch (_) {}
const { green } = require('../../../../../../Global/Settings/Emojis.json');
const j2ponm = require('../../../../../../Global/Settings/Setup.json');
const system = require('../../../../../../Global/Settings/System');
const { generateWelcomeBanner } = require('../../../../../../Global/Helpers/WelcomeBanner');
const forceBans = require('../../../../../../Global/Schemas/forceBans');
const inviterSchema = require('../../../../../../Global/Schemas/inviter');
const inviteMemberSchema = require('../../../../../../Global/Schemas/inviteMember');
const davetStats = require('../../../../../../Global/Schemas/davetStats');
const otokayit = require('../../../../../../Global/Schemas/otokayit');
const bannedTag = require('../../../../../../Global/Schemas/bannedTag');
const regstats = require('../../../../../../Global/Schemas/registerStats');
const isimler = require('../../../../../../Global/Schemas/names');
const penals = require('../../../../../../Global/Schemas/penals');
const userTask = require('../../../../../../Global/Schemas/userTask');
const tasks = require('../../../../../../Global/Schemas/tasks');
const userRoles = require('../../../../../../Global/Schemas/userRoles');
const GuildTagService = require('../../../../../../Global/Services/GuildTagService');
const { checkMemberBannedTag, sendBannedTagLog } = require('../../../../../../Global/Helpers/BannedTagHelper');
const emojis = require('../../../../../../Global/Settings/Emojis.json');

client.on('guildMemberAdd', async (member) => {
    try {
        if (member.user.bot) return;

        console.log(`Yeni üye geldi: ${member.user.tag}`);

        // ForceBan kontrolü
        const j2ponData = await forceBans.findOne({ guildID: system.ServerID, userID: member.user.id });
        if (j2ponData) {
            console.log(`Kullanıcı yasaklı, sunucudan atılıyor: ${member.user.tag}`);
            return member.guild.members.ban(member.user.id, {
                reason: 'Force Ban Systems | Sunucudan kalıcı olarak yasaklandı!',
            }).catch(() => {});
        }


        // Yasaklı Tag kontrolü (Guild tag + İsim tag)
        let hasBannedTag = false;
        let foundTag = null;
        const yasaklitag = await bannedTag.findOne({ guildID: system.ServerID });
        if (yasaklitag && yasaklitag.taglar && yasaklitag.taglar.length > 0) {
            const config = j2ponm.ForbiddenTagConfig || {};
            const result = await checkMemberBannedTag(client, member, yasaklitag.taglar, config);
            hasBannedTag = result.has;
            foundTag = result.found ? result.found.value : null;
            const foundType = result.found ? result.found.type : null;

            if (hasBannedTag && !member.roles.cache.has(j2ponm.BoosterRole)) {
                console.log(`Kullanıcı yasaklı tag içeriyor: ${member.user.tag} (Tag: ${foundTag})`);
                
                // Tüm rolleri kaldır (@everyone ve yasaklı tag rolü hariç)
                const forbiddenTagRoleId = Array.isArray(j2ponm.ForbiddenTagRoles) ? j2ponm.ForbiddenTagRoles[0] : j2ponm.ForbiddenTagRoles;
                const kaldirilacakRoller = member.roles.cache
                    .filter(r => r.id !== member.guild.id && r.id !== forbiddenTagRoleId && r.editable)
                    .map(r => r);
                
                // Diğer tüm rolleri kaldır
                if (kaldirilacakRoller.length > 0) {
                    try {
                        await member.roles.remove(kaldirilacakRoller);
                        console.log(`🗑️ ${member.user.tag} kullanıcısından ${kaldirilacakRoller.length} rol kaldırıldı.`);
                    } catch (error) {
                        console.error(`Rol kaldırma hatası (${member.user.tag}):`, error.message);
                    }
                }
                
                // Yasaklı tag rolünü ver
                if (!member.roles.cache.has(forbiddenTagRoleId)) {
                    await member.roles.add(forbiddenTagRoleId).catch();
                }
                await member.setNickname('Yasaklı Tag').catch();
                sendBannedTagLog(member.client, member, result.found || null, "guildMemberAdd");
                
                member.send({ content:`
  **Merhaba** ${member}

  Bu yazı, sunucumuz içerisindeki kurallarımıza uymadığı tespit edilen bir sembolün, sizin hesabınızda tespit edildiğini bildirmek amacıyla yazılmıştır. Üzerinizde bulunan (${foundTag}) sembolü sunucumuz kurallarına aykırı olduğu için hesabınız yasaklı kategorisine eklenmiştir.

  Bu durumun düzeltilmesi için, yasaklı sembolü kaldırmanız gerekmektedir. Söz konusu yasaklı sembol hesabınızdan çıkarıldığında, eğer daha önce kayıtlıysanız otomatik olarak kayıtlı duruma geçeceksiniz. Ancak, eğer kayıtlı değilseniz, tekrar kayıtsıza düşeceksiniz.
  
  Herhangi bir sorunuz veya açıklamanız için moderatör ekibimizle iletişime geçebilirsiniz.
  
  Saygılarımla,
  **${member.guild.name}** Moderasyon Ekibi `}).catch(() => {});
            }
        }

        // Aktif cezaları kontrol et
        const muteRoles = j2ponm.MutedRole[0];
        const vmuteRoles = j2ponm.VMutedRole[0];
        const jailRoles = j2ponm.JailedRoles[0];

        // Aktif ceza durumunu takip et
        let hasActivePunishment = false;
        let hasJailPunishment = false; // Jail cezası ayrı takip (hoşgeldin mesajı için)

        await checkActivePunishments('Chat-Mute', muteRoles);
        await checkActivePunishments('Jail', jailRoles);
        await checkActivePunishments('Voice-Mute', vmuteRoles);

        async function checkActivePunishments(type, roleID) {
            try {
                console.log(`Aktif ${type} cezalarını kontrol ediyorum.`);
                const activePunishments = await penals.find({
                    guildID: member.guild.id,
                    userID: member.id,
                    type: type,
                    active: true,
                });

                if (activePunishments && activePunishments.length > 0) {
                    hasActivePunishment = true; // Aktif ceza var
                    if (type === 'Jail') hasJailPunishment = true; // Jail cezası var
                    const role = member.guild.roles.cache.get(roleID);
                    if (role) {
                        console.log(`${type} rolü uygulanıyor.`);
                        await member.roles.add(role);
                    } else {
                        console.error(`${type} rolü bulunamadı.`);
                    }
                }
            } catch (error) {
                console.error(`Hata oluştu: ${error}`);
            }
        }

        // Davet takibi
        let usedInvite = null;
        
        try {
            if (!client.invites) {
                client.invites = new Map();
            }
            
            let cachedInvites = client.invites.get(member.guild.id);
            if (!cachedInvites) {
                cachedInvites = new Map();
                client.invites.set(member.guild.id, cachedInvites);
            }
            
            const newInvites = await member.guild.invites.fetch().catch(() => null);
            if (newInvites && newInvites.size > 0) {
                usedInvite = newInvites.find(inv => {
                    const cachedUses = cachedInvites.get(inv.code) || 0;
                    return cachedUses < inv.uses;
                });
                
                newInvites.each(inv => cachedInvites.set(inv.code, inv.uses));
                client.invites.set(member.guild.id, cachedInvites);
                
                if (usedInvite) {
                    console.log(`Kullanılan davet: ${usedInvite.code}, Davet eden: ${usedInvite.inviter?.tag || 'Bilinmiyor'}`);
                }
            } else {
                console.log('Davetler alınamadı veya davet yok.');
            }
        } catch (error) {
            console.error('Davet takibi hatası:', error);
        }

        // Oto kayıt kontrolü (yasaklı tag varsa atla)
        if (hasBannedTag && !member.roles.cache.has(j2ponm.BoosterRole)) {
            console.log('Kullanıcı yasaklı tag\'a sahip, oto kayıt atlanıyor.');
        } else {
            const otoreg = await otokayit.findOne({ userID: member.id });
            const tagModedata = await regstats.findOne({ guildID: system.ServerID });

            console.log(`Oto kayıt verisi: ${otoreg ? 'Bulundu' : 'Bulunamadı'}`);

            if (system.Mainframe.otoKayit) {
                if (tagModedata && !tagModedata?.tagMode && otoreg) {
                    console.log(`Oto kayıt işlemi uygulanıyor.`);
                    await member.roles.set(otoreg.roleID);
                    await member.setNickname(`${j2ponm.ServerUntagged} ${otoreg.name}`);
                    await isimler.findOneAndUpdate(
                        { guildID: system.ServerID, userID: member.user.id },
                        {
                            $push: {
                                names: {
                                    name: member.displayName,
                                    sebep: 'Oto Bot Kayıt',
                                    rol: otoreg.roleID.map(x => `<@&${x}>`),
                                    date: Date.now(),
                                },
                            },
                        },
                        { upsert: true }
                    );
                } else {
                    console.log('Tag modunda kayıt yok, varsayılan isim ayarlanıyor.');
                    await member.setNickname(`${j2ponm.ServerUntagged} Kayıtsız`);
                }
            } else {
                console.log('Oto kayıt kapalı, varsayılan isim ayarlanıyor.');
                await member.setNickname(`${j2ponm.ServerUntagged} Kayıtsız`);
            }
        }

        // Güvenilirlik kontrolü (7 gün altı = şüpheli)
        const isSuspect = Date.now() - member.user.createdTimestamp < 1000 * 60 * 60 * 24 * 7;

        // Şüpheli, cezalı, jail, yasaklı tag kontrolü - kayıtsız rolü verilmemeli
        if (hasBannedTag && !member.roles.cache.has(j2ponm.BoosterRole)) {
            // Yasaklı tag'a sahipse kayıtsız rolü verilmemeli
            console.log('Kullanıcı yasaklı tag\'a sahip (kayıtsız rolü verilmeyecek).');
            if (Array.isArray(j2ponm.UnRegisteredRoles) && j2ponm.UnRegisteredRoles.length) {
                await member.roles.remove(j2ponm.UnRegisteredRoles).catch(() => {});
            }
        } else if (isSuspect && Array.isArray(j2ponm.SuspectedRoles) && j2ponm.SuspectedRoles.length) {
            console.log('Kullanıcı şüpheli hesap olarak işaretlendi (kayıtsız rolü verilmeyecek).');

            // Şüpheli rolünü ekle, kayıtsız rolünü kaldır (ceza rollerini bozmayacak şekilde set kullanmıyoruz)
            await member.roles.add(j2ponm.SuspectedRoles).catch(e => console.error('SuspectedRoles eklenirken hata:', e));
            if (Array.isArray(j2ponm.UnRegisteredRoles) && j2ponm.UnRegisteredRoles.length) {
                await member.roles.remove(j2ponm.UnRegisteredRoles).catch(() => {});
            }
        } else if (hasActivePunishment) {
            // Aktif cezası varsa (Jail, Mute vb.) kayıtsız rolü verilmeyecek
            console.log('Kullanıcının aktif cezası var (kayıtsız rolü verilmeyecek).');
            if (Array.isArray(j2ponm.UnRegisteredRoles) && j2ponm.UnRegisteredRoles.length) {
                await member.roles.remove(j2ponm.UnRegisteredRoles).catch(() => {});
            }
        } else {
            // Şüpheli değilse, aktif cezası yoksa, yasaklı tag yoksa: Guild Tag servisi rolü güncelleyecek + kayıtsız rol
            if (Array.isArray(j2ponm.UnRegisteredRoles) && j2ponm.UnRegisteredRoles.length) {
                await member.roles.add(j2ponm.UnRegisteredRoles).catch(e => console.error('UnRegisteredRoles eklenirken hata:', e));
            }
            setTimeout(() => GuildTagService.checkMember(client, member).catch(() => {}), 3000);
        }

        // Jail cezası varsa hoşgeldin mesajı gönderilmeyecek
        if (hasJailPunishment) {
            console.log('Kullanıcının jail cezası var, hoşgeldin mesajı gönderilmeyecek.');
            return;
        }

        // Kanal kontrolleri ve mesaj gönderme
        try {
            const invChannel = member.guild.channels.cache.get(j2ponm.InviteChannel);
            const welChannel = member.guild.channels.cache.get(j2ponm.WelcomeChannel);
            const RulesChannel = member.guild.channels.cache.get(j2ponm.RulesChannel);

            console.log(`Invite Channel: ${invChannel?.id || 'Bulunamadı'}`);
            console.log(`Welcome Channel: ${welChannel?.id || 'Bulunamadı'}`);
            console.log(`Rules Channel: ${RulesChannel?.id || 'Bulunamadı'}`);

            if (!invChannel || !welChannel || !RulesChannel) {
                console.error('Bir veya daha fazla kanal bulunamadı!');
                return;
            }

            let inviterData = null;
            if (usedInvite?.inviter) {
                console.log(`Davet kullanıldı, inviter bilgisi alınıyor: ${usedInvite.inviter.tag}`);
                
                await inviteMemberSchema.findOneAndUpdate(
                    { guildID: member.guild.id, userID: member.user.id },
                    { $set: { inviter: usedInvite.inviter.id } },
                    { upsert: true }
                );
                
                await inviterSchema.findOneAndUpdate(
                    { guildID: member.guild.id, userID: member.user.id },
                    { $set: { inviterID: usedInvite.inviter.id } },
                    { upsert: true }
                );
                
                inviterData = await inviterSchema.findOneAndUpdate(
                    { guildID: member.guild.id, userID: usedInvite.inviter.id },
                    { $inc: { total: 1, regular: 1 } },
                    { upsert: true, new: true }
                );

                // Davet yapma statı
                await davetStats.findOneAndUpdate(
                    { guildID: member.guild.id, userID: usedInvite.inviter.id },
                    {
                        $inc: { count: 1 },
                        $push: { users: { memberId: member.user.id, date: Date.now() } },
                    },
                    { upsert: true, new: true }
                );
                
                console.log(`Inviter: ${usedInvite.inviter.tag}, toplam davet sayısı: ${inviterData?.total || 0}`);
                
                        // Görev sistemi - Invite sayma
                        if (usedInvite.inviter && usedInvite.inviter.id) {
                            const inviterId = usedInvite.inviter.id;
                            const currentInviteCount = inviterData?.total || 0;

                            // Ana Görev
                            await userTask.findOneAndUpdate(
                                { userId: inviterId },
                                { $set: { 'counts.invite': currentInviteCount } },
                                { upsert: true }
                            );

                            // Sorumluluk Görevi (Yetkili Alım Sorumlusu invite sayar)
                            await require("../../../../../../Global/Schemas/userResponsibilityTask").findOneAndUpdate(
                                { userId: inviterId, responsibilityKey: "yetkili" },
                                { $set: { 'counts.invite': currentInviteCount } },
                                { upsert: true }
                            );
                        }

            }

            // Tek mesaj: content + banner (files ile inline resim), embed yok
            const memberCount = member.guild.memberCount;
            const titleContent = `## ${emojis.server_star} **Carmenta** sunucumuza hoş geldin, ${member}!`;
            const descContent = `> Seninle beraber sunucumuz **${memberCount}** kişiyiz!`;
            const infoContent = [
                `${emojis.server_info} Hesabın <t:${Math.floor(member.user.createdTimestamp / 1000)}:R> oluşturulmuş.`,
                "",
                `${emojis.j2pon_booster} Sunucumuza **Takviye** yaparak bize destek olabilirsin.`,
                "",
                "**Kayıt & Kurallar:**",
                "",
                `${emojis.server_nokta} Kayıt işleminden sonra ${RulesChannel ? RulesChannel.toString() : "#kurallar"} kanalına göz atmayı unutma.`,
                "",
                `${emojis.server_nokta1} Sunucuya erişebilmek için **Carmenta** kayıt odalarında kayıt olup ismini belirtmen gerekmektedir!`,
                "",
                (j2ponm.ConfirmerRoles && j2ponm.ConfirmerRoles.length)
                    ? `${emojis.server_nokta2} ${j2ponm.ConfirmerRoles.map(id => `<@&${id}>`).join(" ")} yetkilileri seninle ilgilenecektir, lütfen sabırlı ol!`
                    : "",
                "",
                "*Kayıt olduktan sonra kuralları okuduğunuzu kabul edeceğiz ve içeride yapılacak cezalandırma işlemlerini bunu göz önünde bulundurarak yapacağız.*",
            ].filter(Boolean).join("\n\n");

            let welcomeAttachment = null;
            try {
                const buffer = await generateWelcomeBanner(member, memberCount);
                welcomeAttachment = new AttachmentBuilder(buffer, { name: "welcome.png" });
            } catch (e) {
                console.error("Hoşgeldin banner oluşturulamadı:", e?.message);
            }

            // Yeni mesaj tipi: Section (TextDisplay + Thumbnail) + MediaGallery (banner) + Separator - API yapısına uygun
            if (ContainerBuilder && SectionBuilder && ThumbnailBuilder && MediaGalleryBuilder && MediaGalleryItemBuilder && SeparatorBuilder && SeparatorSpacingSize != null && MessageFlags?.IsComponentsV2 != null) {
                const welcomeContent = [titleContent, "", descContent, "", infoContent].join("\n\n");
                const section = new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(welcomeContent))
                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(member.displayAvatarURL({ size: 128 })));
                const mediaGallery = new MediaGalleryBuilder().addItems(
                    new MediaGalleryItemBuilder().setURL("attachment://welcome.png")
                );
                const container = new ContainerBuilder()
                    .setAccentColor(15983705)
                    .addSectionComponents(section);
                if (welcomeAttachment) {
                    container.addMediaGalleryComponents(mediaGallery);
                }
                container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true));
                const payload = welcomeAttachment
                    ? { components: [container], files: [welcomeAttachment], flags: MessageFlags.IsComponentsV2 }
                    : { components: [container], flags: MessageFlags.IsComponentsV2 };
                await welChannel.send(payload)
                    .then(() => console.log("Hoşgeldin mesajı (Components V2) gönderildi."))
                    .catch((e) => console.error("Hoşgeldin mesajı gönderilemedi:", e));
            } else {
                const welcomeContent = [titleContent, "", descContent, "", infoContent].join("\n\n");
                const payload = welcomeAttachment
                    ? { content: welcomeContent, files: [welcomeAttachment] }
                    : { content: welcomeContent };
                await welChannel.send(payload)
                    .then(() => console.log("Hoşgeldin mesajı gönderildi."))
                    .catch((e) => console.error("Hoşgeldin mesajı gönderilemedi:", e));
            }

            // Davet mesajı
            const totalInvites = inviterData?.total || 0;
            const inviteMessage = usedInvite?.inviter 
                ? `${member} üyesi **${usedInvite.inviter.tag}** tarafından <t:${Math.floor(member.joinedAt / 1000)}:R> sunucumuza davet edildi. (Toplam Davet: \`${totalInvites}\`)`
                : `${member} üyesi **Sunucu Özel URL** kullanarak <t:${Math.floor(member.joinedAt / 1000)}:R> sunucumuza katıldı.`;

            await invChannel.send({ content: inviteMessage })
                .then(() => console.log('Davet mesajı başarıyla gönderildi.'))
                .catch(e => console.error('Davet mesajı gönderilemedi:', e));

        } catch (error) {
            console.error('Kanal işlemlerinde hata:', error);
        }

    } catch (error) {
        console.error('Üye eklenirken genel hata:', error);
    }
});