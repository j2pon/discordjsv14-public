const { ApplicationCommandOptionType } = require("discord.js");
const GUILD_ROLES = require("../../../../../J2pon-Guard/Schemas/Backup/Guild.Roles");

module.exports = {
    name: "rolkur",
    description: "Silinen rolleri kurmak için.",
    category: "OWNER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["rolkur","rk","rolKur"],
      usage: ".rolKur @Rol/ID",
    },
  

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {
        try {
            const dagitilicakRol = args[0];
            if (!dagitilicakRol) return message.reply({embeds:[byj2ponembed.setDescription(`Bir Rol **\`ID\`**'sini yazın.`)]}).then((e) => setTimeout(() => { e.delete(); }, 5000)); 
            
            GUILD_ROLES.findOne({ roleID: dagitilicakRol }, async (err, data) => {
                if (err) {
                    console.error("GUILD_ROLES findOne error:", err);
                    return message.reply({embeds:[byj2ponembed.setDescription(`Veri tabanında hata oluştu.`)]}).then((e) => setTimeout(() => { e.delete(); }, 5000));
                }
                
                if (!data || data == null) return message.reply({embeds:[byj2ponembed.setDescription(`Veri bulunamadı.`)]}).then((e) => setTimeout(() => { e.delete(); }, 5000));
                
                const newRole = await message.guild.roles.create({
                    name: data.name,
                    color: data.color,
                    hoist: data.hoist,
                    permissions: data.permissions,
                    position: data.position,
                    mentionable: data.mentionable,
                    reason: "Rol Silindiği İçin Tekrar Oluşturuldu!"
                });
                
                let length = (data.members.length + 5);
                var verildi = 0;
                
                // Distributors kontrolü
                const Distributors = global.Distributors || [];
                if (Distributors.length === 0) {
                    message.channel.send({content:`**${data.members.length}** kişiye "${newRole.name}" adlı rol dağıtılıyor. (Distributor botları bulunamadı, tek bot ile dağıtım yapılıyor.)`});
                    
                    // Tek bot ile dağıtım
                    var members = data.members.filter(e => message.guild.members.cache.get(e) && !message.guild.members.cache.get(e).roles.cache.has(newRole));
                    for (const user of members) {
                        try {
                            const member = message.guild.members.cache.get(user);
                            if (member) {
                                await member.roles.add(newRole.id);
                                verildi++;
                            }
                        } catch (error) {
                            console.error(`Rol ekleme hatası (${user}):`, error);
                        }
                    }
                    message.reply({content:`Herkese \`${newRole.name}\` rolü dağıtıldı (${verildi}/${members.length})`});
                } else {
                    const sayı = Math.floor(length / Distributors.length);
                    if (sayı < 1) sayı = 1;
                    
                    const channelPerm = data.channelOverwrites.filter(e => newRole.guild.channels.cache.get(e.id));
                    for await (const perm of channelPerm) {
                        try {
                            const bott = Distributors[1] || Distributors[0];
                            if (bott) {
                                const guild2 = bott.guilds.cache.first();
                                let kanal = guild2.channels.cache.get(perm.id);
                                if (kanal) {
                                    let newPerm = {};
                                    perm.allow.forEach(p => {
                                        newPerm[p] = true;
                                    });
                                    perm.deny.forEach(p => {
                                        newPerm[p] = false;
                                    });
                                    kanal.permissionOverwrites.create(newRole, newPerm).catch(error => console.log(error));
                                }
                            }
                        } catch (error) {
                            console.error("Permission overwrite hatası:", error);
                        }
                    }
                    
                    var members = data.members.filter(e => message.guild.members.cache.get(e) && !message.guild.members.cache.get(e).roles.cache.has(newRole));
                    message.channel.send({content:`**${members.length}** kişiye "${newRole.name}" adlı rol dağıtılıyor.`});
                    
                    for (let index = 0; index < Distributors.length; index++) {
                        const bot = Distributors[index];
                        const guild = bot.guilds.cache.get(message.guild.id);
                        if (!guild) continue;
                        
                        members = data.members.filter(e => guild.members.cache.get(e) && !guild.members.cache.get(e).roles.cache.has(newRole)).slice((index * sayı), ((index + 1) * sayı));
                        
                        if (newRole.deleted) {
                            message.reply({content:`[${dagitilicakRol}] - ${bot.user.tag} - Rol Silindi Dağıtım İptal`});
                            break;
                        }
                        
                        if (members.length <= 0) {
                            message.reply({content:`[${dagitilicakRol}] Olayında kayıtlı üye olmadığından veya rol üyelerine dağıtıldığından dolayı rol dağıtımı gerçekleştirmedim.`});
                            break;
                        }
                        
                        if (verildi == members.length) return message.reply({content:`Herkese \`${newRole.name}\` rolü dağıtıldı`});
                        
                        for await (const user of members) {
                            try {
                                const member = guild.members.cache.get(user);
                                if (member) {
                                    await member.roles.add(newRole.id);
                                    verildi++;
                                }
                            } catch (error) {
                                console.error(`Rol ekleme hatası (${user}):`, error);
                            }
                        }
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
                
                // dataCheck fonksiyonu varsa çağır
                if (typeof global.dataCheck === 'function') {
                    await global.dataCheck(dagitilicakRol, newRole.id, "role");
                }
            });
        } catch (error) {
            console.error("RolKur command error:", error);
            message.reply({embeds:[byj2ponembed.setDescription(`Rol kurulurken bir hata oluştu: ${error.message}`)]}).then((e) => setTimeout(() => { e.delete(); }, 5000));
        }
     },

  };