const { EmbedBuilder } = require("discord.js");
const bannedTag = require("../../../../../../Global/Schemas/bannedTag");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const j2poncik = require("../../../../../../Global/Settings/System");
const regstats = require("../../../../../../Global/Schemas/registerStats");
const GuildTagService = require("../../../../../../Global/Services/GuildTagService");
const { checkMemberBannedTag, sendBannedTagLog } = require("../../../../../../Global/Helpers/BannedTagHelper");
const { green, red } = require("../../../../../../Global/Settings/Emojis.json");
const client = global.client;


client.on("userUpdate", async (oldMember, newMember) => {
  
  const guild = client.guilds.cache.get(j2poncik.ServerID);
  if (!guild) return;
  
  const member = guild.members.cache.get(newMember.id);
  if (!member) return;
  
  const ChatChannel = guild.channels.cache.get(j2ponm.ChatChannel);

  if (oldMember.displayName == newMember.displayName || oldMember.bot || newMember.bot || member.roles.cache.has(j2ponm.JailedRoles[0])) return;

  // Yasaklı tag vb. için aşağıda devam; guild tag sadece Supervisor event'lerinde (GuildTag.js) kontrol edilir.

  /////////////// YASAKLI TAG (Guild tag + İsim tag) //////////////////////////////////////////////
  const yasaklitag = await bannedTag.findOne({ guildID: j2poncik.ServerID });
  if (!yasaklitag || !yasaklitag.taglar || yasaklitag.taglar.length === 0) return;

  const config = j2ponm.ForbiddenTagConfig || {};
  const forbiddenTagRoleId = Array.isArray(j2ponm.ForbiddenTagRoles) ? j2ponm.ForbiddenTagRoles[0] : j2ponm.ForbiddenTagRoles;

  const oldFakeMember = { user: oldMember, nickname: member?.nickname ?? null };
  const oldCheck = await checkMemberBannedTag(client, oldFakeMember, yasaklitag.taglar, config);
  const newCheck = await checkMemberBannedTag(client, member, yasaklitag.taglar, config);
  const oldCheckHas = oldCheck.has;
  const newCheckHas = newCheck.has;
  const newCheckTag = newCheck.found ? newCheck.found.value : null;
  
  // Yasaklı tag eklendi mi kontrol et
  if (!oldCheckHas && newCheckHas) {
    // Booster rolü yoksa yasaklı tag işlemini uygula
    if (!member.roles.cache.has(j2ponm.BoosterRole)) {
      // Tüm rolleri kaldır (@everyone ve yasaklı tag rolü hariç)
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
      await member.setNickname('Yasaklı Tag');
      sendBannedTagLog(member.client, member, newCheck.found || null, "userUpdate");
      
      member.send({ content:`
   **Merhaba** ${member}

   Bu yazı, sunucumuz içerisindeki kurallarımıza uymadığı tespit edilen bir sembolün, sizin hesabınızda tespit edildiğini bildirmek amacıyla yazılmıştır. Üzerinizde bulunan (${newCheckTag}) sunucumuz kurallarına aykırı olduğu için hesabınız yasaklı kategorisine eklenmiştir.

   Bu durumun düzeltilmesi için, yasaklı sembolü kaldırmanız gerekmektedir. Söz konusu yasaklı sembol hesabınızdan çıkarıldığında, eğer daha önce kayıtlıysanız otomatik olarak kayıtlı duruma geçeceksiniz. Ancak, eğer kayıtlı değilseniz, tekrar kayıtsıza düşeceksiniz.
   
   Herhangi bir sorunuz veya açıklamanız için moderatör ekibimizle iletişime geçebilirsiniz.
   
   Saygılarımla,
   **${guild.name}** Moderasyon Ekibi `}).catch(() => {});
    }
  } 
  // Yasaklı tag kaldırıldı mı kontrol et
  else if (oldCheckHas && !newCheckHas) {
    // Booster rolü yoksa yasaklı tag işlemini kaldır
    if (!member.roles.cache.has(j2ponm.BoosterRole)) {
      // Yasaklı tag rolünü kaldır
      if (member.roles.cache.has(forbiddenTagRoleId)) {
        await member.roles.remove(forbiddenTagRoleId).catch();
      }
      
      // Yasaklı tag rolünü kaldırdıktan sonra UnRegisteredRoles'u ekle
      const unRegisteredRoles = Array.isArray(j2ponm.UnRegisteredRoles) ? j2ponm.UnRegisteredRoles : [j2ponm.UnRegisteredRoles];
      
      // Tüm rolleri kaldır (@everyone hariç, booster varsa koru)
      const mevcutRoller = member.roles.cache.filter(r => r.id !== member.guild.id);
      const kaldirilacakRoller = [];
      
      for (const role of mevcutRoller.values()) {
          // Booster rolünü koru
          if (role.id === j2ponm.BoosterRole) continue;
          // UnRegisteredRoles'u koru (eklenecek zaten)
          if (unRegisteredRoles.includes(role.id)) continue;
          // Diğer tüm rolleri kaldır
          if (role.editable) {
              kaldirilacakRoller.push(role);
          }
      }
      
      if (kaldirilacakRoller.length > 0) {
          await member.roles.remove(kaldirilacakRoller).catch();
      }
      
      // UnRegisteredRoles'u ekle (yoksa)
      for (const roleId of unRegisteredRoles) {
          if (!member.roles.cache.has(roleId)) {
              await member.roles.add(roleId).catch();
          }
      }
      
      const serverTag = Array.isArray(j2ponm.ServerTag) ? j2ponm.ServerTag[0] : j2ponm.ServerTag;
      const hasGuildTag = await GuildTagService.hasOurGuildTag(client, member, j2poncik.ServerID);
      const nicknamePrefix = hasGuildTag ? serverTag : (j2ponm.ServerUntagged || serverTag || "");
      await member.setNickname(`${nicknamePrefix} Kayıtsız`);
      member.send({ content:`${guild.name} adlı sunucumuza olan erişim engeliniz kalktı. İsminizden (${oldCheck.tag}) sembolünü kaldırarak sunucumuza erişim hakkı kazandınız. Keyifli Sohbetler`}).catch(() => {});
    }
  }
});

module.exports.config = {
    Event: "userUpdate"
};
