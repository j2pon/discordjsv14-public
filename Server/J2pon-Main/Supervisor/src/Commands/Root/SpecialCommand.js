const { ApplicationCommandOptionType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, codeBlock, RoleSelectMenuBuilder, UserSelectMenuBuilder } = require("discord.js");
const { YamlDatabase } = require("../../../../../../Global/Helpers/YamlDB");
const db = new YamlDatabase();
const j2poncik = require("../../../../../../Global/Settings/System");
const özelPerms  = require("../../../../../../Global/Schemas/specialcommand");

module.exports = {
    name: "özel-komut",
    description: "Özel komut oluşturursunuz",
    category: "OWNER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["özelkomut"],
      usage: ".özelkomut [ekle/çıkar/liste]", 
    },

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator) && !message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply({ embeds: [new EmbedBuilder().setDescription(`> **Komutu Kullanmak İçin Yetkin Bulunmamakta!**`)] })
        if(!["ekle","çıkar","liste"].some(x=> args[0] == x))return message.reply({ embeds: [new EmbedBuilder().setDescription(`Bir Argüman Belirtin!\n\n> \`${j2poncik.Mainframe.Prefixs[0]}özel-komut ekle <komut adı> [verilecek RolID] [verebilecek RolID]\`\n> \`${j2poncik.Mainframe.Prefixs[0]}özel-komut çıkar\`\n> \`${j2poncik.Mainframe.Prefixs[0]}özel-komut liste\``)] })
        if (args[0] === "oluştur" || args[0] === "ekle") {
            const data = await özelPerms.findOne({guildID:message.guild.id})
            const permsData = data ? data.perms : [];
            let mesaj = await message.channel.send(`Eklemek istedin komutun adını yazman için **15 Saniyen** var!`);
            let komutPushlancak = {}
            var isimfilter = m => m.author.id == message.author.id
            await message.channel.awaitMessages({ isimfilter, max: 1, time: 15000, errors: ["time"] })
                .then(async isim => {
                    if (isim.first().content == ("iptal" || "i")) {
                        isim.first().delete();
                        mesaj.delete();
                        return;
                    };
                    if (isim.first().content.includes(" ")) {
                        mesaj.delete();
                        isim.first().content;
                        return message.channel.send(`Boşluk Kullanamazsın!`);
                    }
                    if (permsData.some(veri => veri == (isim.first().content))) return message.reply({ content: `Bu komut daha önce zaten eklenmiş` })
                    if (isim.first().content.length > 20) return message.channel.send(`Eklemek istediğiniz komut 20 karakterden fazla isime sahip.`);
                    komutPushlancak.permName = isim.first().content
                    komutPushlancak.staffRoleID = []
                    komutPushlancak.staffUserID = []
                    isim.first().delete();
                    await mesaj.edit({ content: null, embeds: [byj2ponembed.setDescription(`Komutu kullanma izni verilecek rolleri aşağıdaki menüden seçiniz (İsteğe bağlı - atlayabilirsiniz)`).setFooter({text: "Rol seçmek istemiyorsanız 'Atla' butonuna tıklayın"})], components: [
                        new ActionRowBuilder().setComponents(new RoleSelectMenuBuilder().setCustomId("permRoleSelectMenu").setMaxValues(5).setPlaceholder("Rol seçiniz (İsteğe bağlı)")),
                        new ActionRowBuilder().setComponents(new StringSelectMenuBuilder().setCustomId("skipRole").setOptions([{label: "Rol Seçmeyi Atla", value: "skip"}]).setPlaceholder("Rol seçmeyi atla"))
                    ] });
                })
            const filter = i => i.user.id == message.member.id
            const collector = mesaj.createMessageComponentCollector({ filter, errors: ["time"], max: 5, time: 60000 })
            let roleSelected = false;
            let userSelected = false;
            let roleSelectionStarted = false;
            
            async function proceedToRoleSelection() {
                if (roleSelectionStarted) return;
                roleSelectionStarted = true;
                let mesajx = await mesaj.channel.send({ embeds: [ byj2ponembed.setDescription(`Komutun vericeği rolü aşağıdan seçiniz`)],components: [new ActionRowBuilder().setComponents(new RoleSelectMenuBuilder().setCustomId("permRolesSelectMenu").setMaxValues(5))]})
                const collectorx = mesajx.createMessageComponentCollector({ filter,  errors: ["time"], max: 3, time: 50000 })
                collectorx.on('collect', async t => { 
                    await t.deferUpdate();
                    if(t.customId == "permRolesSelectMenu") {
                        var role1 = []
                        for (let index = 0; index < t.values.length; index++) {
                          let ids = t.values[index]
                          role1.push(ids)
                        }
                        komutPushlancak.permID = role1
                        await özelPerms.findOneAndUpdate({guildID:message.guild.id},{$push:{perms:komutPushlancak}},{upsert:true})
                        let roleText = komutPushlancak.staffRoleID.length > 0 ? komutPushlancak.staffRoleID.map(x => message.guild.roles.cache.get(x)).join(", ") : "Yok";
                        let userText = komutPushlancak.staffUserID.length > 0 ? komutPushlancak.staffUserID.map(x => `<@${x}>`).join(", ") : "Yok";
                        await mesajx.edit({components: [], embeds: [ byj2ponembed.setDescription(`**${komutPushlancak.permName}** isimli alt komut başarıyla oluşturuldu.`).addFields({name:`Kullanacak rol(ler)`,value: roleText,inline: true}).addFields({name:`Kullanacak kullanıcı(lar)`,value: userText,inline: true}).addFields({name:`Verilecek rol(ler)`,value:`${role1.map(x => message.guild.roles.cache.get(x)).join(", ")}`,inline:true})]});
                        await mesaj.edit({components: []});
                        collector.stop();
                    }
                })
            }
            
            collector.on('collect', async i => { 
                await i.deferUpdate();
              if(i.customId == "permRoleSelectMenu") {
                  var role = []
                  for (let index = 0; index < i.values.length; index++) {
                    let ids = i.values[index]
                    role.push(ids)
                  }
                  komutPushlancak.staffRoleID = role
                  roleSelected = true;
                  message.react(`${client.emoji("server_onay")}`)
                  if (!userSelected) {
                    await mesaj.edit({ embeds: [byj2ponembed.setDescription(`Komutu kullanma izni verilecek kullanıcıları aşağıdaki menüden seçiniz (İsteğe bağlı - atlayabilirsiniz)`).setFooter({text: "Kullanıcı seçmek istemiyorsanız 'Atla' butonuna tıklayın"})], components: [
                        new ActionRowBuilder().setComponents(new UserSelectMenuBuilder().setCustomId("permUserSelectMenu").setMaxValues(5).setPlaceholder("Kullanıcı seçiniz (İsteğe bağlı)")),
                        new ActionRowBuilder().setComponents(new StringSelectMenuBuilder().setCustomId("skipUser").setOptions([{label: "Kullanıcı Seçmeyi Atla", value: "skip"}]).setPlaceholder("Kullanıcı seçmeyi atla"))
                    ] });
                  } else {
                    await proceedToRoleSelection();
                  }
              }
              if(i.customId == "skipRole") {
                  roleSelected = true;
                  if (!userSelected) {
                    await mesaj.edit({ embeds: [byj2ponembed.setDescription(`Komutu kullanma izni verilecek kullanıcıları aşağıdaki menüden seçiniz (İsteğe bağlı - atlayabilirsiniz)`).setFooter({text: "Kullanıcı seçmek istemiyorsanız 'Atla' butonuna tıklayın"})], components: [
                        new ActionRowBuilder().setComponents(new UserSelectMenuBuilder().setCustomId("permUserSelectMenu").setMaxValues(5).setPlaceholder("Kullanıcı seçiniz (İsteğe bağlı)")),
                        new ActionRowBuilder().setComponents(new StringSelectMenuBuilder().setCustomId("skipUser").setOptions([{label: "Kullanıcı Seçmeyi Atla", value: "skip"}]).setPlaceholder("Kullanıcı seçmeyi atla"))
                    ] });
                  } else {
                    await proceedToRoleSelection();
                  }
              }
              if(i.customId == "permUserSelectMenu") {
                  var users = []
                  for (let index = 0; index < i.values.length; index++) {
                    let ids = i.values[index]
                    users.push(ids)
                  }
                  komutPushlancak.staffUserID = users
                  userSelected = true;
                  message.react(`${client.emoji("server_onay")}`)
                  if (roleSelected) {
                    await proceedToRoleSelection();
                  }
              }
              if(i.customId == "skipUser") {
                  userSelected = true;
                  if (roleSelected) {
                    await proceedToRoleSelection();
                  }
              }
        })
        }
        if(args[0] == "çıkar"){
            const data = await özelPerms.findOne({guildID:message.guild.id})
            const permsData = data ? data.perms : [];
            var liste = [{label:"İşlemi iptal et!",description:"Menüyü Kapatır.",value:`iptal`}];
            for (let i = 0; i < permsData.length; i++) {
                const veri = permsData[i];
                let roleText = Array.isArray(veri.permID) && veri.permID.length > 0
                    ? veri.permID.map(r => message.guild.roles.cache.get(r) ? message.guild.roles.cache.get(r).name : "Rol Silinmiş").join(", ")
                    : (veri.permID && !Array.isArray(veri.permID) ? (message.guild.roles.cache.get(veri.permID) ? message.guild.roles.cache.get(veri.permID).name : "Rol Silinmiş") : "Rol Silinmiş");
                liste.push({label:`Komut: ${veri.permName}`,description:`Verilecek Rol: ${roleText}`,value:`${veri.permName}`})
            }
        const menu = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
            .setCustomId("permler")
            .setOptions(liste)
            .setPlaceholder("Silmek istediğin komutu seç")
        )
        message.channel.send({components:[menu],embeds:[byj2ponembed.setDescription(`Listesen silmek istediğiniz komutu seçiniz.`)]}).then(async msg =>{
            var filter = (button) => button.user.id === message.author.id;
            const collector = msg.createMessageComponentCollector({ filter, time: 30000*2 })
            collector.on("collect",async(i)=>{
            await i.deferUpdate();
            for (let index = 0; index < liste.length; index++) {
            if(i.values[0] == `${liste[index].value}`){
            await özelPerms.findOneAndUpdate({guildID:message.guild.id},{$pull:{perms:{permName:liste[index].value}}},{upsert:true})
            message.channel.send({content:"`Komut başarıyla silindi!`"}).then(x=>{setTimeout(() => {if(x) x.delete();}, 5000);})
            collector.stop();
            }
            }   
            if(i.values[0] == "iptal") {
                if(msg) await msg.delete();
                if(message) await message.delete();
                } 
            })
        })
        }
        if(args[0] == "liste"){
         if (!message.guild) return message.reply({ embeds: [new EmbedBuilder().setDescription(`Bu komut sadece sunucularda kullanılabilir.`)] });
         const data = await özelPerms.findOne({guildID:message.guild.id})
         const permsData = data ? data.perms : [];
         message.channel.send({
                embeds: [byj2ponembed.setDescription(`Toplam **${permsData.length}** ek komut aşağıda listelenmiştir. \n\n ${permsData.length == 0 ? " " : `${codeBlock("md",
`${permsData.map(x => {
                    let roleText = Array.isArray(x.staffRoleID) && x.staffRoleID.length > 0 
                        ? x.staffRoleID.map(r => message.guild.roles.cache.get(r) ? message.guild.roles.cache.get(r).name : "Rol Silinmiş").join(", ")
                        : (x.staffRoleID && !Array.isArray(x.staffRoleID) ? (message.guild.roles.cache.get(x.staffRoleID) ? message.guild.roles.cache.get(x.staffRoleID).name : "Rol Silinmiş") : "Yok");
                    let userText = Array.isArray(x.staffUserID) && x.staffUserID.length > 0 
                        ? x.staffUserID.map(u => {
                            try {
                                const member = message.guild.members.cache.get(u);
                                return member ? member.user.tag : "Kullanıcı Bulunamadı";
                            } catch (e) {
                                return "Kullanıcı Bulunamadı";
                            }
                        }).join(", ")
                        : (x.staffUserID && !Array.isArray(x.staffUserID) ? (() => {
                            try {
                                const member = message.guild.members.cache.get(x.staffUserID);
                                return member ? member.user.tag : "Kullanıcı Bulunamadı";
                            } catch (e) {
                                return "Kullanıcı Bulunamadı";
                            }
                        })() : "Yok");
                    let permRoleText = Array.isArray(x.permID) && x.permID.length > 0
                        ? x.permID.map(r => message.guild.roles.cache.get(r) ? message.guild.roles.cache.get(r).name : "Rol Silinmiş").join(", ")
                        : (x.permID && !Array.isArray(x.permID) ? (message.guild.roles.cache.get(x.permID) ? message.guild.roles.cache.get(x.permID).name : "Rol Silinmiş") : "Rol Silinmiş");
                    return `# ${x.permName.toUpperCase()}
> Kullanım: .${x.permName} @Member/ID
< Verilecek Rol: ${permRoleText}
< Kullanacak Rol(ler): ${roleText}
< Kullanacak Kullanıcı(lar): ${userText}`;
                }).join("\n\n")}`
                )}`}`)]
            })
        }


     },

  };