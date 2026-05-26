const client = global.client;
const inviterSchema = require("../../../../../../Global/Schemas/inviter");
const inviteMemberSchema = require("../../../../../../Global/Schemas/inviteMember");
const { red } = require("../../../../../../Global/Settings/Emojis.json");
const isimler = require("../../../../../../Global/Schemas/names");
const userRoles = require("../../../../../../Global/Schemas/userRoles");
const j2ponm = require("../../../../../../Global/Settings/Setup.json")

client.on("guildMemberRemove", async (member) => {
    const j2poncikk = member.guild.channels.cache.get(j2ponm.InviteChannel);
    if (!j2poncikk) return;
    if (member.user.bot) return;
    
    // Kullanıcı rolleri kaydet (@everyone hariç)
    const roller = member.roles.cache
        .filter(role => role.id !== member.guild.id)
        .map(role => role.id);
    
    if (roller.length > 0) {
        await userRoles.findOneAndUpdate(
            { guildID: member.guild.id, userID: member.user.id },
            { 
                $set: { 
                    roles: roller,
                    kayitTarihi: Date.now()
                } 
            },
            { upsert: true }
        );
        console.log(`💾 ${member.user.id} kullanıcısının rolleri kaydedildi (${roller.length} rol)`);
    }
    
    const data = await isimler.findOne({ guildID: member.guild.id, userID: member.user.id });

    if (data && data.names.length) {
      await isimler.findOneAndUpdate({ guildID: member.guild.id, userID: member.user.id }, { $push: { names: { name: data.names.splice(-1).map((x, i) => `${x.name}`), sebep: "Sunucudan Ayrılma", date: Date.now() } } }, { upsert: true });
      }
  
    const inviteMemberData = await inviteMemberSchema.findOne({ guildID: member.guild.id, userID: member.user.id });
    if (!inviteMemberData) {
      j2poncikk.send({ content: `**${member.user.tag}** üyesi sunucumuzdan <t:${Math.floor(Date.now() / 1000)}:R> ayrıldı! Sunucumuza **Sunucu Özel Url** ile davet edilmiş.`});
    } else {
      const inviter = await client.users.fetch(inviteMemberData.inviter);
      await inviterSchema.findOneAndUpdate({ guildID: member.guild.id, userID: inviter.id }, { $inc: { leave: 1, total: -1 } }, { upsert: true });
      const inviterData = await inviterSchema.findOne({ guildID: member.guild.id, userID: inviter.id, });
      const total = inviterData ? inviterData.total : 0;
      j2poncikk.send({ content:`**${member.user.tag}** üyesi sunucumuzdan <t:${Math.floor(Date.now() / 1000)}:R> ayrıldı! Sunucumuza ${inviter} tarafından davet edilmiş. (Toplam Davet: \`${total}\`)`});
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
