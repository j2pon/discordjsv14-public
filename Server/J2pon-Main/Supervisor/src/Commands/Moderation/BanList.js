const { ApplicationCommandOptionType, PermissionsBitField, codeBlock } = require("discord.js");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const kanal = require("../../../../../../Global/Settings/AyarName");

module.exports = {
    name: "banliste",
    description: "Sunucudaki banlıları listeler",
    category: "STAFF",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["banlist","yargıliste","yargılist","ban-liste"],
      usage: ".banlist",
    },
  
    onLoad: function (client) { },

    onCommand: async function (client, message, args) {

      let kanallar = kanal.KomutKullanımKanalİsim;
      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && !kanallar.includes(message.channel.name)) return message.reply({ content: `${kanallar.map(x => `${client.channels.cache.find(chan => chan.name == x)}`)} kanallarında kullanabilirsiniz.`}).then((e) => setTimeout(() => { e.delete(); }, 10000)); 
      
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers) && !j2ponm.BanHammer.some(x => message.member.roles.cache.has(x))) { message.channel.send({ content:"Yeterli yetkin bulunmuyor!"}).then((e) => setTimeout(() => { e.delete(); }, 5000));
        return }
        const ban = await message.guild.bans.fetch();
        if (!ban || ban.size === 0) { 
            message.channel.send({ content: "Sunucuda Banlı üye bulunmamaktır."}).then((e) => setTimeout(() => { e.delete(); }, 5000));
            return;
        }
        
        message.guild.bans.fetch().then(async j2poncik => {
            const MAX_LENGTH = 4000; // Discord mesaj limiti (code block syntax dahil)
            const CODE_BLOCK_OVERHEAD = 7; // ```js\n``` = 7 karakter
            const MAX_CONTENT_LENGTH = MAX_LENGTH - CODE_BLOCK_OVERHEAD;
            
            const listItems = j2poncik.map(user => `${user.user.id} | ${user.user.tag}`);
            const header = `Kullanıcı ID:       | Kullanıcı Adı:\n`;
            const footer = `\n\nSunucuda toplamda ${j2poncik.size} yasaklı kullanıcı bulunmakta.`;
            
            let currentMessage = header;
            let partNumber = 1;
            const messages = [];
            
            // Liste öğelerini ekle
            for (let i = 0; i < listItems.length; i++) {
                const item = listItems[i];
                const lineToAdd = `${item}\n`;
                const testContent = currentMessage + lineToAdd;
                const isLastItem = i === listItems.length - 1;
                const testMessage = isLastItem ? testContent + footer : testContent;
                
                // Code block ile toplam uzunluk kontrolü
                if (testMessage.length + CODE_BLOCK_OVERHEAD > MAX_LENGTH && currentMessage !== header) {
                    // Mevcut mesajı kaydet
                    messages.push(currentMessage);
                    currentMessage = header + lineToAdd;
                } else {
                    currentMessage = testContent;
                }
            }
            
            // Son mesajı ekle
            if (currentMessage.trim() !== header.trim()) {
                messages.push(currentMessage + footer);
            }
            
            // Tüm mesajları gönder
            const totalParts = messages.length;
            for (let i = 0; i < messages.length; i++) {
                const pageInfo = totalParts > 1 ? `\n\n[Sayfa ${i + 1}/${totalParts}]` : '';
                await message.channel.send({ 
                    content: codeBlock("js", messages[i] + pageInfo)
                });
            }
        }).catch(err => {
            console.error('BanList hatası:', err);
            message.channel.send({ content: "Ban listesi alınırken bir hata oluştu." }).then((e) => setTimeout(() => { e.delete(); }, 5000));
        });
  },
  
     

  };

