const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, PermissionsBitField, Intents, ActivityType, Events } = require('discord.js');
const moment = global.moment = require('moment');
require("moment-duration-format");
require("moment-timezone");
const Guild = require('../../../Global/Settings/System');
const Distributors = global.Distributors = [];
const query = require("./Distributors")
const GUILD_ROLES = require("../Schemas/Backup/Guild.Roles");
const GUILD_CATEGORY = require("../Schemas/Backup/Guild.Category.Channels");
const GUILD_TEXT = require("../Schemas/Backup/Guild.Text.Channels");
const GUILD_VOICE = require("../Schemas/Backup/Guild.Voice.Channels");
const rolePermissions = require('../Schemas/rolePermissions');
const voice = global.voice = require("@discordjs/voice")
const guard = require("../Schemas/Guard");
const setup = require("../../../Global/Settings/Setup.json");


let aylartoplam = { "01": "Ocak", "02": "Şubat", "03": "Mart", "04": "Nisan", "05": "Mayıs", "06": "Haziran", "07": "Temmuz", "08": "Ağustos", "09": "Eylül", "10": "Ekim", "11": "Kasım", "12": "Aralık" };
global.aylar = aylartoplam;

const guvenli = global.guvenli = async function(member, type){
  try {
    // member veya member.id yoksa false döndür (guard işlem yapsın)
    if (!member || !member.id) {
      console.log(`[GUARD] guvenli: member veya member.id bulunamadı, false döndürülüyor`);
      return false;
    }

    const guardData = await guard.findOne({guildID: Guild.ServerID});
    
    // Whitelist'leri güvenli şekilde al (array olduğundan emin ol)
    const botsOwners = Array.isArray(Guild.BotsOwners) ? Guild.BotsOwners : [];
    const whitelistFull = (guardData && Array.isArray(guardData.SafedMembers)) ? guardData.SafedMembers : botsOwners;
    const whitelistServer = (guardData && Array.isArray(guardData.serverSafedMembers)) ? guardData.serverSafedMembers : botsOwners;
    const whitelistRole = (guardData && Array.isArray(guardData.roleSafedMembers)) ? guardData.roleSafedMembers : botsOwners;
    const whitelistChannel = (guardData && Array.isArray(guardData.channelSafedMembers)) ? guardData.channelSafedMembers : botsOwners;
    const whitelistBanKick = (guardData && Array.isArray(guardData.banKickSafedMembers)) ? guardData.banKickSafedMembers : botsOwners;
    const whitelistEmojiSticker = (guardData && Array.isArray(guardData.emojiStickers)) ? guardData.emojiStickers : botsOwners;
    
    // Limitli whitelist kontrolü - limitli whitelist'teki kullanıcılar guard'dan muaf (chat guard hariç)
    // Chat guard'dan muaf değiller, sadece ban/kick/role gibi işlemlerden muaf olacaklar
    if (type !== "chatguard" && guardData && Array.isArray(guardData.limitedWhitelistMembers) && guardData.limitedWhitelistMembers.length > 0) {
      const limitedUser = guardData.limitedWhitelistMembers.find(x => x.userId === member.id);
      if (limitedUser) {
        // Limitli whitelist'teki kullanıcılar ban/kick/role gibi işlemlerden muaf
        // Sadece limit kontrolü yapılacak, normal guard devreye girmeyecek
        return true;
      }
    }
    
    const memberId = member.id;
    
    // Yardımcı fonksiyon: whitelist kontrolü
    const isInWhitelist = (list) => Array.isArray(list) && list.some(id => memberId === id);
    const isOwner = () => botsOwners.some(x => memberId === x);
    
    if(type == "full"){
      return isInWhitelist(whitelistFull) || isOwner();
    }
    if(type == "server"){
      return isInWhitelist(whitelistFull) || isInWhitelist(whitelistServer) || isOwner();
    }
    if(type == "role"){
      return isInWhitelist(whitelistFull) || isInWhitelist(whitelistRole) || isOwner();
    }
    if(type == "channel"){
      return isInWhitelist(whitelistFull) || isInWhitelist(whitelistChannel) || isOwner();
    }
    if(type == "bankick"){
      return isInWhitelist(whitelistFull) || isInWhitelist(whitelistBanKick) || isOwner();
    }
    if(type == "emojisticker"){
      return isInWhitelist(whitelistFull) || isInWhitelist(whitelistEmojiSticker) || isOwner();
    }
    
    // Bilinmeyen type için false döndür (guard işlem yapsın)
    console.log(`[GUARD] guvenli: Bilinmeyen type "${type}", false döndürülüyor`);
    return false;
  } catch (error) {
    console.error(`[GUARD] guvenli fonksiyonunda hata:`, error);
    // Hata durumunda false döndür (guard işlem yapsın)
    return false;
  }
}

const ytkapa = global.ytkapa = async function(guildID) {
    let sunucu = global.client.guilds.cache.get(guildID);
    if (!sunucu) return;
    sunucu.roles.cache.filter(r => r.editable && (r.permissions.has(PermissionsBitField.Flags.Administrator) || r.permissions.has(PermissionsBitField.Flags.ManageGuild) || r.permissions.has(PermissionsBitField.Flags.ManageRoles) || r.permissions.has(PermissionsBitField.Flags.ManageWebhooks) || r.permissions.has(PermissionsBitField.Flags.BanMembers) || r.permissions.has(PermissionsBitField.Flags.KickMembers)|| r.permissions.has(PermissionsBitField.Flags.ModerateMembers))).forEach(async r => {
      await rolePermissions.findOneAndUpdate({roleID:r.id},{$set:{BitField:new PermissionsBitField(r.permissions.bitfield)}},{upsert:true})
      await r.setPermissions(PermissionsBitField.Flags.SendMessages);
    });
  }
  const jailMember = async (member, reason = "Server Security") => {
    if (!member || !member.manageable) return false;
    if (!Array.isArray(setup.JailedRoles) || !setup.JailedRoles.length) return false;
    if (setup.JailedRoles.some((roleId) => member.roles.cache.has(roleId))) return true;

    const rolesToSet = member.roles.cache.has(setup.BoosterRole)
      ? [setup.BoosterRole, setup.JailedRoles[0]]
      : setup.JailedRoles;

    await member.roles.set(rolesToSet, reason).catch(() => {});
    return true;
  };

  const ytçek = global.ytçek = async function(member){
    if (!member) return;
    let roller = await member.roles.cache.filter(r => r.permissions.has(PermissionsBitField.Flags.Administrator) || r.permissions.has(PermissionsBitField.Flags.ManageGuild) || r.permissions.has(PermissionsBitField.Flags.ManageRoles) || r.permissions.has(PermissionsBitField.Flags.ManageWebhooks) || r.permissions.has(PermissionsBitField.Flags.BanMembers) || r.permissions.has(PermissionsBitField.Flags.KickMembers)|| r.permissions.has(PermissionsBitField.Flags.ModerateMembers)).map(z=> z.id)
    await member.roles.remove(roller).catch(() => {});
    await jailMember(member, "Whitelist/Limited whitelist disi guard islemi").catch(() => {});
  }
  const sik = global.sik = async function(guild,kisiID, tur) {
    let uye = guild.members.cache.get(kisiID);
    if (!uye) return;
    if (tur == "am") {
      await jailMember(uye, "Whitelist/Limited whitelist disi guard islemi").catch(() => {});
      return;
    }
  };
  const dataCheck = global.dataCheck = async function(oldID, newID, type) {
    // Placeholder function - Eski ID'yi yeni ID ile güncellemek için kullanılır
    // Şu an için boş bırakıldı, gerekirse implement edilebilir
    return;
  };
  const guildChannels = global.guildChannels = async function (guild, snapshotKey) {
    if (!guild) return;
    const key = snapshotKey || new Date().toISOString().slice(0, 10);

    const channels = [];
    guild.channels.cache.forEach((ch) => channels.push(ch));

    let channelSuccess = 0;
    let channelFail = 0;

    for (let index = 0; index < channels.length; index++) {
      const channel = channels[index];
      const ChannelPermissions = [];

      if (channel.permissionOverwrites) {
        channel.permissionOverwrites.cache.forEach((perm) => {
          ChannelPermissions.push({
            id: perm.id,
            type: perm.type,
            allow: "" + perm.allow.bitfield,
            deny: "" + perm.deny.bitfield,
          });
        });
      }

      // Text & announcement
      if (channel.type === 0 || channel.type === 5) {
        try {
          let kanalYedek = await GUILD_TEXT.findOne({
            guildID: guild.id,
            channelID: channel.id,
            snapshotKey: key,
          });

          if (!kanalYedek) {
            const newData = new GUILD_TEXT({
              type: 0,
              guildID: guild.id,
              channelID: channel.id,
              name: channel.name,
              nsfw: channel.nsfw,
              parentID: channel.parentId,
              position: channel.position,
              rateLimit: channel.rateLimitPerUser,
              overwrites: ChannelPermissions,
              snapshotKey: key,
            });
            await newData.save();
            channelSuccess++;
          } else {
            kanalYedek.name = channel.name;
            kanalYedek.nsfw = channel.nsfw;
            kanalYedek.parentID = channel.parentId;
            kanalYedek.position = channel.position;
            kanalYedek.rateLimit = channel.rateLimitPerUser;
            kanalYedek.overwrites = ChannelPermissions;
            kanalYedek.snapshotKey = key;
            await kanalYedek.save();
            channelSuccess++;
          }
        } catch (err) {
          console.error(
            `[TEXT KANAL YEDEKLEME HATASI] Text kanal kaydedilemedi - İsim: "${channel.name}" | ID: ${channel.id} | Hata:`,
            err
          );
          channelFail++;
        }
      }

      // Voice
      if (channel.type === 2) {
        try {
          let kanalYedek = await GUILD_VOICE.findOne({
            guildID: guild.id,
            channelID: channel.id,
            snapshotKey: key,
          });

          if (!kanalYedek) {
            const newData = new GUILD_VOICE({
              type: 2,
              guildID: guild.id,
              channelID: channel.id,
              name: channel.name,
              bitrate: channel.bitrate,
              parentID: channel.parentId,
              position: channel.position,
              userLimit: channel.userLimit ? channel.userLimit : 0,
              overwrites: ChannelPermissions,
              snapshotKey: key,
            });
            await newData.save();
            channelSuccess++;
          } else {
            kanalYedek.name = channel.name;
            kanalYedek.bitrate = channel.bitrate;
            kanalYedek.parentID = channel.parentId;
            kanalYedek.position = channel.position;
            kanalYedek.userLimit = channel.userLimit ? channel.userLimit : 0;
            kanalYedek.overwrites = ChannelPermissions;
            kanalYedek.snapshotKey = key;
            await kanalYedek.save();
            channelSuccess++;
          }
        } catch (err) {
          console.error(
            `[VOICE KANAL YEDEKLEME HATASI] Voice kanal kaydedilemedi - İsim: "${channel.name}" | ID: ${channel.id} | Hata:`,
            err
          );
          channelFail++;
        }
      }

      // Category
      if (channel.type === 4) {
        try {
          let kanalYedek = await GUILD_CATEGORY.findOne({
            guildID: guild.id,
            channelID: channel.id,
            snapshotKey: key,
          });

          if (!kanalYedek) {
            const newData = new GUILD_CATEGORY({
              guildID: guild.id,
              channelID: channel.id,
              name: channel.name,
              position: channel.position,
              overwrites: ChannelPermissions,
              snapshotKey: key,
            });
            await newData.save();
            channelSuccess++;
          } else {
            kanalYedek.name = channel.name;
            kanalYedek.position = channel.position;
            kanalYedek.overwrites = ChannelPermissions;
            kanalYedek.snapshotKey = key;
            await kanalYedek.save();
          }
        } catch (err) {
          console.error(
            `[KATEGORİ YEDEKLEME HATASI] Kategori kaydedilemedi - İsim: "${channel.name}" | ID: ${channel.id} | Hata:`,
            err
          );
          channelFail++;
        }
      }
    }

    console.log(
      `${tarihsel(Date.now())} tarihinde Kanal güncelleme işlemleri tamamlandı. Toplam: ${channels.length}, Başarılı: ${channelSuccess}, Hatalı: ${channelFail}.`
    );

    return key;
  }
  const guildRoles = global.guildRoles = async function (guild, snapshotKey) {
    if (!guild) return;
    const key = snapshotKey || new Date().toISOString().slice(0, 10);

    const roles = [];
    guild.roles.cache
      .filter((r) => r.name !== "@everyone")
      .forEach((rol) => roles.push(rol));

    let roleSuccess = 0;
    let roleFail = 0;

    for (let index = 0; index < roles.length; index++) {
      const role = roles[index];
      const Overwrites = [];

      guild.channels.cache
        .filter((channel) => channel.permissionOverwrites && channel.permissionOverwrites.cache.has(role.id))
        .forEach((channel) => {
          const channelPerm = channel.permissionOverwrites.cache.get(role.id);
          if (!channelPerm) return;
          const perms = {
            id: channel.id,
            allow: channelPerm.allow.toArray(),
            deny: channelPerm.deny.toArray(),
          };
          Overwrites.push(perms);
        });

      try {
        let data = await GUILD_ROLES.findOne({
          guildID: guild.id,
          roleID: role.id,
          snapshotKey: key,
        });

        if (!data) {
          const newData = new GUILD_ROLES({
            guildID: guild.id,
            roleID: role.id,
            name: role.name,
            color: role.hexColor,
            hoist: role.hoist,
            position: role.position,
            permissions: role.permissions.bitfield,
            mentionable: role.mentionable,
            date: Date.now(),
            members: role.members.map((m) => m.id),
            channelOverwrites: Overwrites,
            snapshotKey: key,
          });
          await newData.save();
          roleSuccess++;
        } else {
          data.name = role.name;
          data.color = role.hexColor;
          data.hoist = role.hoist;
          data.position = role.position;
          data.permissions = role.permissions.bitfield;
          data.mentionable = role.mentionable;
          data.date = Date.now();
          data.members = role.members.map((m) => m.id);
          data.channelOverwrites = Overwrites;
          data.snapshotKey = key;
          await data.save();
          roleSuccess++;
        }
      } catch (err) {
        console.error(
          `[ROL YEDEKLEME HATASI] Rol kaydedilemedi - İsim: "${role.name}" | ID: ${role.id} | Hata:`,
          err
        );
        roleFail++;
      }
    }

    try {
      const allRoles = await GUILD_ROLES.find({ guildID: guild.id });
      allRoles
        .filter(
          (r) =>
            !guild.roles.cache.has(r.roleID) &&
            Date.now() - r.date > 1000 * 60 * 60 * 24 * 3
        )
        .forEach((r) => {
          r.remove().catch(() => {});
        });
    } catch {
      // temizlik hatalarını sessizce yut
    }

    console.log(
      `${tarihsel(Date.now())} tarihinde Rol güncelleme işlemleri tamamlandı. Toplam: ${roles.length}, Başarılı: ${roleSuccess}, Hatalı: ${roleFail}.`
    );

    return key;
  };
  const rolKur = global.rolKur = async function(role, newRole) {
    await dataCheck(role,newRole.id,"role")
   await GUILD_ROLES.findOne({ roleID: role }, async (err, data) => {
      let length = (data.members.length + 5);
      const sayı = Math.floor(length / Distributors.length);
      if (sayı < 1) sayı = 1;
      const channelPerm = data.channelOverwrites.filter(e => newRole.guild.channels.cache.get(e.id))
      
      for await (const perm of channelPerm) {
        const bott = Distributors[1]
        const guild = bott.guilds.cache.get(Guild.ServerID)
        let kanal = guild.channels.cache.get(perm.id);
        let newPerm = {};
        perm.allow.forEach(p => {
          newPerm[p] = true;
        });
        perm.deny.forEach(p => {
          newPerm[p] = false;
        });
        if (kanal && kanal.permissionOverwrites) {
          kanal.permissionOverwrites.create(newRole, newPerm).catch(error => console.log(error));
        }
      }
      for (let index = 0; index < Distributors.length; index++) {
        const bot = Distributors[index];
        const guild = bot.guilds.cache.get(Guild.ServerID)
        if (newRole.deleted) {
         console.log(`[${role}] - ${bot.user.tag} - Rol Silindi Dağıtım İptal`);
          break;
        }
        const members = data.members.filter(e => guild.members.cache.get(e) && !guild.members.cache.get(e).roles.cache.has(newRole.id)).slice((index * sayı), ((index + 1) * sayı));
        console.log(members)
        if (members.length <= 0) {
         console.log(`[${role}] Olayında kayıtlı üye olmadığından veya rol üyelerine dağıtıldığından dolayı rol dağıtımı gerçekleştirmedim.`);
          break;
        }
        for await (const user of members) {
          const member = guild.members.cache.get(user)
          member.roles.add(newRole.id)
        }
      }
      const newData = new GUILD_ROLES({
        roleID: newRole.id,
        name: newRole.name,
        color: newRole.hexColor,
        hoist: newRole.hoist,
        position: newRole.position,
        permissions: newRole.permissions.bitfield,
        mentionable: newRole.mentionable,
        time: Date.now(),
        members: data.members.filter(e => newRole.guild.members.cache.get(e)),
        channelOverwrites: data.channelOverwrites.filter(e => newRole.guild.channels.cache.get(e.id))
      });
      newData.save();
    }).catch(err => { })
  }
  const rolVer = global.rolVer = async function(sunucu, role) {
    let length = (sunucu.members.cache.filter(member => member && !member.roles.cache.has(role.id) && !member.user.bot).array().length + 5);
    const sayı = Math.floor(length / Distributors.length);
    for (let index = 0; index < Distributors.length; index++) {
      const bot = Distributors[index];
      if (role.deleted) {
        console.log(`[${role.id}] - ${bot.user.tag} - Rol Silindi Dağıtım İptal`);
        break;
      }
      const members = bot.guilds.cache.get(sunucu.id).members.cache.filter(member => !member.roles.cache.has(role.id) && !member.user.bot).array().slice((index * sayı), ((index + 1) * sayı));
      if (members.length <= 0) return;
      for (const member of members) {
        member.roles.add(role.id)
      }
    }
  }
  const startDistributors = global.startDistributors = async function() {
    console.log('Başlatma fonksiyonu tetiklendi.')
  require("../../../Global/Settings/System").Security.Dis.forEach(async (token) => {
        let botClient = new Client({ 
          intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences],
          presence: {
            activities: [{
              name: 'sa xd',
              type: ActivityType.Playing
            }],
            status: 'online'
          }
        });
          
        botClient.once(Events.ClientReady, (client) => {
            console.log(`${botClient.user.tag} isimli dağıtıcı başarıyla aktif oldu.`)
            botClient.queryTasks = new query();
            botClient.queryTasks.init(1000);
            Distributors.push(botClient)
            
            for (let index = 0; index < Distributors.length; index++) {
              const welcome = Distributors[index];
              welcome.once(Events.ClientReady, async ()=> {
                const guild = welcome.guilds.cache.get(require("../../../Global/Settings/System").ServerID)
                const channel = guild.channels.cache.get(require("../../../Global/Settings/System"))
              try {
                // Opus encoder'ı açıkça opusscript olarak ayarla
                require('opusscript');
                const connection = voice.joinVoiceChannel({
                  channelId: Guild.BotVoiceChannel,
                  guildId: Guild.ServerID,
                  adapterCreator: channel.guild.voiceAdapterCreator,
                });
                
                connection.on('error', (error) => {
                  // DAVE protokolü hatası normal, görmezden gel
                  if (error && error.message && error.message.includes('DAVE')) {
                    return;
                  }
                  // Diğer voice bağlantı hatalarını sessizce yakala
                });
                
                connection.on('stateChange', (oldState, newState) => {
                  if (newState.status === 'disconnected') {
                    connection.destroy().catch(() => {});
                  }
                });
              } catch (error) {
                // Voice bağlantı hatası
              }
              })
            }
          })
          await botClient.login(token).catch(err => {
            console.log(`Dağıtıcı Token Arızası`)
          })
    })
  }

  module.exports = {
    startDistributors,
    guildRoles,
    guildChannels,
  }

  const closeDistributors = global.closeDistributors= async function() { 
    if(Distributors && Distributors.length) {
        if(Distributors.length >= 1) {
            Distributors.forEach(x => {
                x.destroy()
            })
        }
    }
  }
  const tarihsel = global.tarihsel = function(tarih) {
    let tarihci = moment(tarih).tz("Europe/Istanbul").format("DD") + " " + global.aylar[moment(tarih).tz("Europe/Istanbul").format("MM")] + " " + moment(tarih).tz("Europe/Istanbul").format("YYYY")   
    return tarihci;
};

