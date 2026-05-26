const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
  ComponentType,
  PermissionsBitField,
} = require("discord.js");
const setup = require("../../../../../../Global/Settings/Setup.json");
const emojisJson = require("../../../../../../Global/Settings/Emojis.json");
const GuildTagService = require("../../../../../../Global/Services/GuildTagService");

/** Emojis.json satırından select menü için PartialEmoji */
function menuEmoji(key) {
  const str = emojisJson[key];
  if (!str || typeof str !== "string") return undefined;
  const m = str.match(/^<(a)?:(\w+):(\d+)>$/);
  if (!m) return undefined;
  return { id: m[3], name: m[2], animated: Boolean(m[1]) };
}

function collectAuthorityRoleIds() {
  const ids = new Set();
  const levels = setup.Sorumluluk?.YetkiSeviyeleri || {};
  for (const key of ["AltYetki", "OrtaYetki", "UstYetki"]) {
    const arr = levels[key]?.Roller;
    if (Array.isArray(arr)) arr.forEach((id) => ids.add(id));
  }
  const mgmt = setup.ManagmentRoles;
  if (Array.isArray(mgmt)) mgmt.forEach((id) => ids.add(id));
  const staffMgmt = setup.StaffManagmentRoles;
  if (Array.isArray(staffMgmt)) staffMgmt.forEach((id) => ids.add(id));
  const staffRoles = setup.Sorumluluk?.StaffRoles;
  if (staffRoles && typeof staffRoles === "object") {
    for (const k of Object.keys(staffRoles)) {
      const r = staffRoles[k]?.responsible;
      if (r) ids.add(r);
    }
  }
  return ids;
}

function truncateLabel(text, max = 100) {
  const s = String(text);
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

/** OwnerRoles ile üye rollerini güvenilir şekilde karşılaştır (string normalize + partial fetch) */
async function memberHasOwnerRoleOrAdmin(message) {
  const isAdmin = message.member?.permissions?.has(PermissionsBitField.Flags.Administrator);
  if (isAdmin) return true;

  let member = message.member;
  if (!member) return false;
  if (member.partial) {
    member = await member.fetch().catch(() => member);
  }

  const raw = setup.OwnerRoles;
  const ownerIds = Array.isArray(raw) ? raw : raw ? [raw] : [];
  if (ownerIds.length === 0) return false;

  const ownerSet = new Set(ownerIds.map((id) => String(id)));
  return member.roles.cache.some((role) => ownerSet.has(String(role.id)));
}

/** Tüm yetki çekilirken kaldırılmayacak rol ID'leri */
async function getProtectedRoleIds(client, member) {
  const protectedIds = new Set();
  if (Array.isArray(setup.ManRoles)) {
    setup.ManRoles.forEach((id) => protectedIds.add(String(id)));
  }
  if (Array.isArray(setup.GirlRoles)) {
    setup.GirlRoles.forEach((id) => protectedIds.add(String(id)));
  }
  if (setup.TaggedRole && (await GuildTagService.memberHasGuildTag(client, member))) {
    protectedIds.add(String(setup.TaggedRole));
  }
  if (setup.BoosterRole && member.premiumSince) {
    protectedIds.add(String(setup.BoosterRole));
  }
  return protectedIds;
}

module.exports = {
  name: "yetkicek",
  description: "Üyenin tanımlı yetki rollerinden birini veya (toplu) korunanlar hariç tüm rollerini çeker.",
  category: "ADMIN",
  cooldown: 0,
  command: {
    enabled: true,
    aliases: ["yetkiçek", "yetki-çek", "yetki_cek"],
    usage: ".yetkiçek <@User/ID>",
  },

  onLoad: function () {},

  onCommand: async function (client, message, args) {
    const staffRoles = setup.Sorumluluk?.StaffRoles?.yetkili || {};
    const yetkiliAlimLideri = staffRoles.leader;
    
    const isOwnerOrAdmin = await memberHasOwnerRoleOrAdmin(message);
    const isYetkiliAlimLideri = yetkiliAlimLideri && message.member.roles.cache.has(yetkiliAlimLideri);

    if (!isOwnerOrAdmin && !isYetkiliAlimLideri) {
      message.react(client.emoji("server_carpi") || "❌").catch(() => {});
      return message
        .reply({
          content: `${client.emoji("server_carpi")} Bu komutu yalnızca **OwnerRoles**, **Yönetici** yetkisi olanlar veya **Yetkili Alım Lideri** kullanabilir.`,
        })
        .then((e) => setTimeout(() => e.delete().catch(() => {}), 7000));
    }

    let member =
      message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!member && args[0]) {
      member = await message.guild.members.fetch(args[0]).catch(() => null);
    }

    if (!member) {
      return message
        .reply({
          content: `${client.emoji("server_info")} Bir kullanıcı etiketleyin veya ID girin.\nÖrn: \`.yetkiçek @Üye\` veya \`.yetkiçek 123...\``,
        })
        .then((e) => setTimeout(() => e.delete().catch(() => {}), 8000));
    }

    if (member.user.bot) {
      return message
        .reply({ content: `${client.emoji("server_carpi")} Botlardan yetki çekilemez.` })
        .then((e) => setTimeout(() => e.delete().catch(() => {}), 5000));
    }

    if (member.id === message.author.id) {
      return message
        .reply({ content: `${client.emoji("server_carpi")} Kendi yetkinizi bu komutla çekemezsiniz.` })
        .then((e) => setTimeout(() => e.delete().catch(() => {}), 5000));
    }

    if (message.member.roles.highest.position <= member.roles.highest.position) {
      return message
        .reply({
          content: `${client.emoji("server_carpi")} Bu kullanıcının rol hiyerarşisi sizinle eşit veya üstte.`,
        })
        .then((e) => setTimeout(() => e.delete().catch(() => {}), 8000));
    }

    const authorityIds = collectAuthorityRoleIds();

    const botMember = message.guild.members.me;
    const botHighPreview = botMember?.roles?.highest?.position ?? 0;

    const protectedPreview = await getProtectedRoleIds(client, member);
    /** Toplu çekte silinecek rol önizlemesi (korunan + @everyone + bot üstü + managed hariç) */
    const allStrippablePreview = [...member.roles.cache.values()].filter(
      (r) =>
        r.id !== message.guild.id &&
        !protectedPreview.has(String(r.id)) &&
        r.position < botHighPreview &&
        !r.managed
    );

    const onMember = [...member.roles.cache.values()].filter(
      (r) => r.id !== message.guild.id && authorityIds.has(r.id)
    );

    if (allStrippablePreview.length === 0 && onMember.length === 0) {
      return message
        .reply({
          content: `${client.emoji("server_nokta")} ${member} üzerinde çekilebilecek rol yok (yalnızca korunan erkek/kız/taglı/booster veya botun yetkisinin yetmediği roller kaldı).`,
        })
        .then((e) => setTimeout(() => e.delete().catch(() => {}), 9000));
    }

    onMember.sort((a, b) => b.position - a.position);

    const MAX_ROLE_OPTIONS = 24;
    const rolesForMenu = onMember.slice(0, MAX_ROLE_OPTIONS);
    const omitted = onMember.length - rolesForMenu.length;

    const customId = `yetki_cek_${message.id}_${member.id}`;

    const allOpt = new StringSelectMenuOptionBuilder()
      .setLabel(truncateLabel("Tüm rolleri çek (yetki dışı roller dahil)"))
      .setValue("__ALL_AUTH__")
      .setDescription(
        truncateLabel(
          `~${allStrippablePreview.length} rol; erkek/kız, taglıysa taglı, boostta booster kalır`,
          100
        )
      );
    const allEm = menuEmoji("appEmoji_cop");
    if (allEm) allOpt.setEmoji(allEm);

    const singleEm = menuEmoji("appEmoji_cikar");

    const options = [allOpt];
    for (const role of rolesForMenu) {
      const opt = new StringSelectMenuOptionBuilder()
        .setLabel(truncateLabel(`Çek: ${role.name}`))
        .setValue(`role_${role.id}`)
        .setDescription(truncateLabel(`Yalnızca ${role.name}`, 100));
      if (singleEm) opt.setEmoji(singleEm);
      options.push(opt);
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder("Çekilecek yetkiyi veya 'tüm yetkiyi çek' seçeneğini seçin")
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(menu);

    const embed = new EmbedBuilder()
      .setColor(0x2f3136)
      .setAuthor({
        name: message.guild.name,
        iconURL: message.guild.iconURL({ dynamic: true }) || undefined,
      })
      .setDescription(
        `${client.emoji("server_info")} **Hedef:** ${member} (\`${member.id}\`)\n` +
          `${client.emoji("server_nokta")} **Tek rol:** yalnızca listedeki tanımlı yetki rollerinden birini çeker.\n` +
          `${client.emoji("server_star2")} **Tüm rolleri çek:** Üzerindeki **tüm rolleri** çeker; **erkek/kız**, taglıysa **taglı**, boost basıyorsa **booster** ve **yönetilen (managed) roller** ile botun üstündeki roller **tutulur/kaldırılamaz**.\n` +
          `${client.emoji("server_members")} Toplu çekilecek (yaklaşık): **${allStrippablePreview.length}** • Menüdeki tanımlı yetki rolü: **${onMember.length}**` +
          (omitted > 0
            ? `\n${client.emoji("server_loading")} Tek çekim listesinde ilk **${MAX_ROLE_OPTIONS}** yetki rolü; **Tüm rolleri çek** yine de hepsini (korunanlar hariç) siler.`
            : "")
      )
      .setFooter({ text: "• Yetki çek • OwnerRoles / Yönetici •", iconURL: message.author.displayAvatarURL({ dynamic: true }) });

    const msg = await message.channel.send({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 120000,
      filter: (i) => i.user.id === message.author.id && i.customId === customId,
    });

    collector.on("collect", async (interaction) => {
      const choice = interaction.values[0];
      const fresh = await message.guild.members.fetch(member.id).catch(() => null);
      if (!fresh) {
        await interaction.reply({
          content: `${client.emoji("server_carpi")} Üye sunucuda bulunamadı.`,
          ephemeral: true,
        });
        return;
      }

      const me = message.guild.members.me;
      const botHigh = me?.roles?.highest?.position ?? 0;

      try {
        if (choice === "__ALL_AUTH__") {
          const protectedIds = await getProtectedRoleIds(client, fresh);
          const removableAll = [...fresh.roles.cache.values()].filter(
            (r) =>
              r.id !== fresh.guild.id &&
              !protectedIds.has(String(r.id)) &&
              r.position < botHigh &&
              !r.managed
          );
          if (removableAll.length === 0) {
            await interaction.reply({
              content: `${client.emoji("server_carpi")} Çekilecek rol kalmadı (korunan erkek/kız/taglı/booster, botun üstündeki veya yönetilen roller).`,
              ephemeral: true,
            });
            return;
          }
          await fresh.roles.remove(removableAll);
          await interaction.reply({
            content: `${client.emoji("server_onay")} ${fresh} kullanıcısından **${removableAll.length}** rol çekildi. Erkek/kız, taglıysa taglı ve boosttaysa booster korundu; yönetilen roller silinmedi.`,
            ephemeral: true,
          });
        } else {
          const roleId = choice.replace(/^role_/, "");
          const role = message.guild.roles.cache.get(roleId);
          if (!role || !fresh.roles.cache.has(roleId)) {
            await interaction.reply({
              content: `${client.emoji("server_carpi")} Rol artık üzerinde yok veya bulunamadı.`,
              ephemeral: true,
            });
            return;
          }
          if (!authorityIds.has(roleId)) {
            await interaction.reply({
              content: `${client.emoji("server_carpi")} Bu rol tanımlı yetki listesinde değil.`,
              ephemeral: true,
            });
            return;
          }
          if (role.managed || role.position >= botHigh) {
            await interaction.reply({
              content: `${client.emoji("server_carpi")} Bu rol bot tarafından kaldırılamıyor (hiyerarşi / yönetilen rol).`,
              ephemeral: true,
            });
            return;
          }
          await fresh.roles.remove(role);
          await interaction.reply({
            content: `${client.emoji("server_onay")} ${fresh} kullanıcısından ${role} çekildi.`,
            ephemeral: true,
          });
        }
        collector.stop("done");
      } catch (err) {
        console.error("Yetki çek hatası:", err);
        await interaction.reply({
          content: `${client.emoji("server_carpi")} Roller güncellenirken hata oluştu.`,
          ephemeral: true,
        });
      }
    });

    collector.on("end", async () => {
      try {
        await msg.edit({ components: [] }).catch(() => {});
      } catch {
        // ignore
      }
    });
  },
};
