const { EmbedBuilder, AuditLogEvent, ChannelType,Events } = require("discord.js");
const client = global.client;
const moment = require("moment");
require("moment-duration-format")
moment.locale("tr")
const ms = require("ms");
const usersMap = new Map();
const getLimit = new Map();
const LIMIT = 3;
const TIME = 10000;
const DIFF = 1000;
const system = require('../../../../../../Global/Settings/System');
const j2ponm = require('../../../../../../Global/Settings/Setup.json');
const {reklamlar, inviteEngel, küfürler} = require("../../../../../../Global/Settings/AyarName");
const guard = require("../../../../../J2pon-Guard/Schemas/Guard");
const mongoose = require("mongoose");


client.on(Events.MessageCreate, async (message) => {
  // MongoDB bağlantısının hazır olmasını bekle
  if (mongoose.connection.readyState !== 1) {
    if (mongoose.connection.readyState === 0) {
      await new Promise((resolve) => {
        if (mongoose.connection.readyState === 1) {
          resolve();
        } else {
          mongoose.connection.once('connected', resolve);
        }
      });
    } else {
      return; // Bağlantı hazır değilse devam etme
    }
  }

  const Guard = await guard.findOne({guildID: system.ServerID})
  const chatGuard = Guard ? Guard.chatGuards : false;
  const chatSettings = Guard?.chatGuardSettings || {};
  const reklamEngel = typeof chatSettings.reklam === "boolean" ? chatSettings.reklam : system.Security.ReklamEngel;
  const kufurEngel = typeof chatSettings.kufur === "boolean" ? chatSettings.kufur : system.Security.KufurEngel;
  const spamEngel = typeof chatSettings.spam === "boolean" ? chatSettings.spam : system.Security.SpamEngel;
  const capsEngel = typeof chatSettings.caps === "boolean" ? chatSettings.caps : system.Security.CapsEngel;
  if(chatGuard == true){
    if(message.webhookID || message.author.bot || message.channel.type === ChannelType.DM) return;
    if (await guvenli(message.author,"chatguard") == true) return;
    if ((message.mentions.roles.size + message.mentions.users.size + message.mentions.channels.size) >= 3) return send(message, "Birden çok kişiyi etiklemezsen seviniriz.")

    if (kufurEngel && küfürler.some(word => new RegExp("(\\b)+(" + word + ")+(\\b)", "gui").test(message.content))) return send(message, `Küfür etmekten vazgeç.`)

    if(message.content && message.content.length && message.content.length >= 165) return send(message, "Lütfen uzun mesaj göndermeyin Okumazlar zaten")
    // Caps engelleme (opsiyonel)
    if (capsEngel && message.content && message.content.length >= 15) {
      const Caps = (message.content.match(/[A-ZĞÇÖIÜ]/gm) || []).length;
      if ((Caps / message.content.length) >= 0.7) return send(message, `Sohbet kanallarında caps kullanmaktan vazgeç lütfen`)
    }

    // Discord linklerini kontrol et (discord.gg/, discord.com/invite/, discord.app/invite/)
    const discordLinkPattern = /discord\.(gg|com\/invite|app\/invite)\/[a-zA-Z0-9]+/gi;
    if (reklamEngel && discordLinkPattern.test(message.content)) {
        const invites = await message.guild.invites.fetch();
        const matches = message.content.match(discordLinkPattern);
        if (matches) {
            // Her bir match'i kontrol et
            for (const match of matches) {
                // Invite code'u çıkar (discord.gg/CODE veya discord.com/invite/CODE)
                const inviteCode = match.split('/').pop() || match.split('invite/').pop();
                if (inviteCode) {
                    // Vanity URL kontrolü
                    if (message.guild.vanityURLCode && inviteCode === message.guild.vanityURLCode) continue;
                    // Sunucudaki invite'leri kontrol et
                    const isGuildInvite = invites.some((x) => x.code === inviteCode);
                    if (isGuildInvite) continue;
                    // Sunucuya ait değilse reklam olarak algıla
                    return send(message, "Lütfen reklam yapmayı bırakınız yollarım valla jaile");
                }
            }
        }
    }

    if (reklamEngel && message.content.match(inviteEngel)) {
        const invites = await message.guild.invites.fetch();
        const matches = message.content.match(inviteEngel);
        if (matches && ((message.guild.vanityURLCode && matches.some((i) => i === message.guild.vanityURLCode)) || invites.some((x) => matches.some((i) => i === x.code)))) return;
        return send(message, "Lütfen reklam yapmayı bırakınız yollarım valla jaile")
    }

    if(reklamEngel && reklamlar.some(word => message.content.toLowerCase().includes(word))) return send(message, "Lütfen reklam yapmayı bırakınız")
  }
})

client.on(Events.MessageCreate, async (message) => {
  // MongoDB bağlantısının hazır olmasını bekle
  if (mongoose.connection.readyState !== 1) {
    if (mongoose.connection.readyState === 0) {
      await new Promise((resolve) => {
        if (mongoose.connection.readyState === 1) {
          resolve();
        } else {
          mongoose.connection.once('connected', resolve);
        }
      });
    } else {
      return; // Bağlantı hazır değilse devam etme
    }
  }

  const Guard = await guard.findOne({guildID: system.ServerID})
  const chatGuard = Guard ? Guard.chatGuards : false;
  if(chatGuard == true){
    if(message.webhookID || message.author.bot || message.channel.type === ChannelType.DM) return;
    if (await guvenli(message.author,"chatguard") == true) return;
    const chatSettings = Guard?.chatGuardSettings || {};
    const spamEngel = typeof chatSettings.spam === "boolean" ? chatSettings.spam : system.Security.SpamEngel;
    if (spamEngel == false) return;
  
      if(usersMap.has(message.author.id)) {
          const userData = usersMap.get(message.author.id);
          const {lastMessage, timer} = userData;
          const difference = message.createdTimestamp - lastMessage.createdTimestamp;
          let msgCount = userData.msgCount;
          
              if(difference > DIFF) {
                  clearTimeout(timer);
                  userData.msgCount = 1;
                  userData.lastMessage = message;
                      userData.timer = setTimeout(() => {
                          usersMap.delete(message.author.id);
                      }, TIME);
                  usersMap.set(message.author.id, userData)
              } else {
                      msgCount++;
                      if(parseInt(msgCount) === LIMIT) {
                          sonMesajlar(message, 30)
                          usersMap.delete(message.author.id);
                          client.guilds.cache.get(system.ServerID).members.cache.get(message.member.id).roles.add(j2ponm.MutedRole)
                          const duration = "3m" ? ms("3m") : undefined;
                          await message.member.send({content: `Sunucumuz da **Sohbet kanallarını kirletme!** sebebi ile metin kanallarında susturuldun. Ceza bitiş tarihi <t:${Math.floor((Date.now() + duration) / 1000)}:R>. Eğer bu konu hakkında bir itirazın var ise üst yetkililerimize ulaşmaktan çekinme! `})
                          await message.reply({content: `Sohbet kanallarını kirletme sebebiyle \` 3 dakika \` süresince susturuldunuz, mesajlar temizlendi. Lütfen yavaşlayın. ${message.member}`}).then(x => setTimeout(() => {
                              x.delete().catch(err => {})
                          }, 7500)).catch(err => {})
                          return client.penalize(message.guild.id, message.author.id, "Chat-Mute", true, client.user.id, "Metin Kanallarında Flood Yapmak!", true, Date.now() + duration);
                       } else {
            userData.msgCount = msgCount;
            usersMap.set(message.author.id, userData)
          }}}
           else{
          let fn = setTimeout(() => {
            usersMap.delete(message.author.id)
          }, TIME);
          usersMap.set(message.author.id, {
          msgCount: 1,
          lastMessage: message,
          timer: fn
          
          })
          }
        }
  })


  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    // MongoDB bağlantısının hazır olmasını bekle
    if (mongoose.connection.readyState !== 1) {
      if (mongoose.connection.readyState === 0) {
        await new Promise((resolve) => {
          if (mongoose.connection.readyState === 1) {
            resolve();
          } else {
            mongoose.connection.once('connected', resolve);
          }
        });
      } else {
        return; // Bağlantı hazır değilse devam etme
      }
    }

    const Guard = await guard.findOne({guildID: system.ServerID})
    const chatGuard = Guard ? Guard.chatGuards : false;
    const chatSettings = Guard?.chatGuardSettings || {};
    const reklamEngel = typeof chatSettings.reklam === "boolean" ? chatSettings.reklam : system.Security.ReklamEngel;
    const kufurEngel = typeof chatSettings.kufur === "boolean" ? chatSettings.kufur : system.Security.KufurEngel;
    const capsEngel = typeof chatSettings.caps === "boolean" ? chatSettings.caps : system.Security.CapsEngel;
    if(chatGuard == true){
    if(newMessage.webhookID || newMessage.author.bot || newMessage.channel.type === ChannelType.DM) return;
    if (await guvenli(newMessage.author,"chatguard") == true) return;
    
    if (kufurEngel && küfürler.some(word => new RegExp("(\\b)+(" + word + ")+(\\b)", "gui").test(newMessage.content))) newMessage.delete().catch(err => {});

    if (capsEngel && newMessage.content && newMessage.content.length >= 15) {
      const Caps = (newMessage.content.match(/[A-ZĞÇÖIÜ]/gm) || []).length;
      if ((Caps / newMessage.content.length) >= 0.7) return newMessage.delete().catch(() => {});
    }

    // Discord linklerini kontrol et (discord.gg/, discord.com/invite/, discord.app/invite/)
    const discordLinkPattern = /discord\.(gg|com\/invite|app\/invite)\/[a-zA-Z0-9]+/gi;
    if (reklamEngel && discordLinkPattern.test(newMessage.content)) {
        const invites = await newMessage.guild.invites.fetch();
        const matches = newMessage.content.match(discordLinkPattern);
        if (matches) {
            // Her bir match'i kontrol et
            for (const match of matches) {
                // Invite code'u çıkar (discord.gg/CODE veya discord.com/invite/CODE)
                const inviteCode = match.split('/').pop() || match.split('invite/').pop();
                if (inviteCode) {
                    // Vanity URL kontrolü
                    if (newMessage.guild.vanityURLCode && inviteCode === newMessage.guild.vanityURLCode) continue;
                    // Sunucudaki invite'leri kontrol et
                    const isGuildInvite = invites.some((x) => x.code === inviteCode);
                    if (isGuildInvite) continue;
                    // Sunucuya ait değilse reklam olarak algıla
                    return newMessage.delete().catch(err => {});
                }
            }
        }
    }

    if (reklamEngel && newMessage.content.match(inviteEngel)) {
        const invites = await newMessage.guild.invites.fetch();
        const matches = newMessage.content.match(inviteEngel);
        if (matches && ((newMessage.guild.vanityURLCode && matches.some((i) => i === newMessage.guild.vanityURLCode)) || invites.some((x) => matches.some((i) => i === x.code)))) return;
        return newMessage.delete().catch(err => {});
    }
    if(reklamEngel && reklamlar.some(word => newMessage.content.toLowerCase().includes(word))) return newMessage.delete().catch(err => {})
  }
});

  async function send(message, content) {
    // Null kontrolleri
    if (!message.member || !message.member.id) return;
    const memberId = message.member.id;
    const memberTag = message.member.user?.tag || 'Bilinmiyor';
    
    if ((Number(getLimit.get(`${memberId}`))) == 3) {
        message.delete().catch(err => {})
        getLimit.delete(`${memberId}`)
        const duration = ms("10m");
        await message.member.send({content: `Sunucumuz da **Metin Kanallarında kurallara uymamak!** sebebi ile metin kanallarında susturuldun. Ceza bitiş tarihi <t:${Math.floor((Date.now() + duration) / 1000)}:R>. Eğer bu konu hakkında bir itirazın var ise üst yetkililerimize ulaşmaktan çekinme! `}).catch(() => {})
        await message.channel.send({content: `${message.member} Sohbet kanallarında ki kurallara uymadığın için \` 10 Dakika \` susturuldun.`}).then(x => setTimeout(() => {
            x.delete().catch(err => {})
        }, 7500)).catch(err => {})
        const guild = client.guilds.cache.get(system.ServerID);
        const member = guild?.members.cache.get(memberId);
        if (member) member.roles.add(j2ponm.MutedRole).catch(() => {});
        return client.penalize(message.guild.id, memberId, "Chat-Mute", true, client.user.id, "Metin Kanallarında kurallara uymamak.", true, Date.now() + duration);
    } else {
        getLimit.set(`${memberId}`, (Number(getLimit.get(`${memberId}`) || 0)) + 1)
        message.delete().catch(err => {})
        let embed = new EmbedBuilder().setColor("Random")
        message.channel.send({content: `${message.member}`, embeds: [embed.setColor("Random").setDescription(`**Merhaba!** ${memberTag}
${content}, aksi taktirde yaptırım uygulanacaktır.
    `)]}).then(x => {
            setTimeout(() => {
                x.delete().catch(err => {})
            }, 6000);
        }).catch(err => {})
        setTimeout(() => {
            if(memberId && getLimit.get(`${memberId}`)) {
                getLimit.set(`${memberId}`, (Number(getLimit.get(`${memberId}`) || 0)) - 1)
            }
          },10000)
    }
} 

async function sonMesajlar(message, count = 25) {
    let messages = await message.channel.messages.fetch({ limit: 100 });
    let filtered = [...messages.filter((x) => x.author.id === message.author.id).values()].splice(0, count);
    message.channel.bulkDelete(filtered).catch(err => {});
} 

const guvenli = global.guvenli = async function(member,type){
    // MongoDB bağlantısının hazır olmasını bekle
    if (mongoose.connection.readyState !== 1) {
      if (mongoose.connection.readyState === 0) {
        await new Promise((resolve) => {
          if (mongoose.connection.readyState === 1) {
            resolve();
          } else {
            mongoose.connection.once('connected', resolve);
          }
        });
      } else {
        return false; // Bağlantı hazır değilse false dön
      }
    }

    const guardData = await guard.findOne({guildID:system.ServerID});
    const whitelistFull = guardData ? guardData.SafedMembers : system.BotsOwners;
    const whitelistServer = guardData ? guardData.serverSafedMembers : system.BotsOwners;
    const whitelistRole = guardData ? guardData.roleSafedMembers : system.BotsOwners;
    const whitelistChannel = guardData ? guardData.channelSafedMembers : system.BotsOwners;
    const whitelistBanKick = guardData ? guardData.banKickSafedMembers : system.BotsOwners;
    const whitelistEmojiSticker = guardData ? guardData.banKickSafedMembers : system.BotsOwners;
    const chatguard = guardData ? guardData.chatGuard : system.BotsOwners;
    
    // Not: Limitli whitelist'teki kullanıcılar chat guard'dan muaf değil
    // Sadece ban/kick/role gibi işlemlerden muaf olacaklar
    if(type == "full"){
      if(whitelistFull.some(id=> member.id === id) || system.BotsOwners.some(x=> member.id === x)){ return true}else return false
    }
    if(type == "server"){
    if(whitelistFull.some(id=> member.id === id) || whitelistServer.some(id=> member.id === id) || System.BotsOwners.some(x=> member.id === x)) {return true}else return false
    }
    if(type == "role"){
      if(whitelistFull.some(id=> member.id === id) || whitelistRole.some(id=> member.id === id) || system.BotsOwners.some(x=> member.id === x)) {return true}else return false
    }
    if(type == "channel"){
      if(whitelistFull.some(id=> member.id === id) || whitelistChannel.some(id=> member.id === id) || system.BotsOwners.some(x=> member.id === x)) {return true}else return false
    }
    if(type == "bankick"){
      if(whitelistFull.some(id=> member.id === id) || whitelistBanKick.some(id=> member.id === id) || system.BotsOwners.some(x=> member.id === x)) {return true}else return false
    }
    if(type == "emojisticker"){
      if(whitelistFull.some(id=> member.id === id) || whitelistEmojiSticker.some(id=> member.id === id) || system.BotsOwners.some(x=> member.id === x)) {return true}else return false
    }
    if(type == "chatguard"){
      if(whitelistFull.some(id=> member.id === id) || chatguard.some(id=> member.id === id) || system.BotsOwners.some(x=> member.id === x)) {return true}else return false
    }
  }