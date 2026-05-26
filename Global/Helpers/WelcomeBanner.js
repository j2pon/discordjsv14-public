/**
 * Rovenia hoş geldin banner'ı oluşturur (görsel, embed yerine).
 * Görseldeki gibi: koyu arka plan, altın ışık, ortada avatar, HOŞGELDİN, kullanıcı adı, X. Üyemiz Oldun!, Katılım tarihi.
 */
const { createCanvas, loadImage } = require("@napi-rs/canvas");

const W = 900;
const H = 380;
const TURKISH_MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

function formatJoinDate(joinedAt) {
    const d = new Date(joinedAt);
    const day = d.getDate();
    const month = TURKISH_MONTHS[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
}

async function generateWelcomeBanner(member, memberCount) {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // Koyu arka plan + üst merkezden altın ışıma
    const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
    bgGradient.addColorStop(0, "#0f0f14");
    bgGradient.addColorStop(0.4, "#1a1a24");
    bgGradient.addColorStop(1, "#0d0d12");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);

    const radial = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, W * 0.8);
    radial.addColorStop(0, "rgba(212, 175, 55, 0.35)");
    radial.addColorStop(0.4, "rgba(212, 175, 55, 0.12)");
    radial.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, W, H);

    // Avatar (ortada, yuvarlak)
    const avatarSize = 140;
    const avatarY = 72;
    try {
        const avatarURL = member.user.displayAvatarURL({ extension: "png", size: 256 });
        const avatar = await loadImage(avatarURL);
        ctx.save();
        ctx.beginPath();
        ctx.arc(W / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, W / 2 - avatarSize / 2, avatarY, avatarSize, avatarSize);
        ctx.restore();
        ctx.strokeStyle = "rgba(212, 175, 55, 0.6)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(W / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.stroke();
    } catch (e) {
        console.error("[WelcomeBanner] Avatar yüklenemedi:", e?.message);
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 42px Arial";
    ctx.textAlign = "center";
    ctx.fillText("HOŞGELDİN", W / 2, avatarY + avatarSize + 42);

    const username = (member.user.username || member.user.tag || "Üye").slice(0, 32);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "24px Arial";
    ctx.fillText(username, W / 2, avatarY + avatarSize + 78);

    ctx.fillStyle = "#d4af37";
    ctx.font = "bold 36px Arial";
    ctx.fillText(`${memberCount}. Üyemiz Oldun!`, W / 2, avatarY + avatarSize + 128);

    const joinStr = `Katılım: ${formatJoinDate(member.joinedAt || Date.now())}`;
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "18px Arial";
    ctx.textAlign = "right";
    ctx.fillText(joinStr, W - 24, H - 20);

    return canvas.encode("png");
}

module.exports = { generateWelcomeBanner, formatJoinDate };
