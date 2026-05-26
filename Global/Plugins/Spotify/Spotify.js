const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const Util = require("./Util");
const path = require('path');
/**
 * @typedef {object} Spotify
 * @see {Spotify}
 * @example 
 * @type {Class}
 */
module.exports = class serverSpotify {
  constructor(options) {
    this.font = { name: options?.font?.name ?? "Manrope", path: options?.font?.path };
    this.album = null;
    this.artist = null;
    this.border = null;
    this._bar_width = 540;
    this.end = null;
    this.overlay_opacity = null;
    this.image = null;
    this.blur = 3;
    this.title = null;
    this.start = null;
    this.spotifyLogo = true;
    this.randomColors = ["#0c0c0c","#121212","#282828","#1c1c1c","#244c66"];
  }

  /**
   * .setAlbum
   * @param {string} name Album Name
   * @returns {Spotify}
   * @example setAlbum("Alan Walker Album")
   */
  setAlbum(name) {
    if (!name || typeof name !== "string") throw new Error("The argument of the setAlbum method must be a string.");
    this.album = name;
    return this;
  }

  /**
   * .setAuthor
   * @param {string} name Artist Name
   * @returns {Spotify}
   * @example setAuthor("Alan Walker, Ava Max")
   */
  setAuthor(name) {
    if (!name || typeof name !== "string") throw new Error("The argument of the setAuthor method must be a string.");
    this.artist = name;
    return this;
  }


  /**
     * .setBorder
     * @param {string} color "hexcolor"
     * @returns {Spotify}
     * @example setBorder("#fff")
     */
  setBorder(color) {
    if (color) {
      if (/^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(color)) {
        this.border = color;
        return this;
      } else {
        throw new Error("Invalid color for the argument in the setBorder method. You must give a hexadecimal color.")
      }
    } else {
      throw new Error("You must give a hexadecimal color as the argument of setBorder method.");
    }
  }


   /**
     * .setOverlayOpacity
     * @param {number} opacity must be between 0 and 1
     * @returns {Spotify}
     * @example setOverlayOpacity(0.7)
     */
   setOverlayOpacity(opacity = 0) {
    if (opacity) {
      if (opacity >= 0 && opacity <= 1) {
        this.overlay_opacity = opacity;
        return this;
      } else {
        throw new Error("The value of the opacity of setOverlayOpacity method must be between 0 and 1 (0 and 1 included).");
      }
    }
  }

  /**
     * .setBlur
     * @param {number} blur setImage blur effect px
     * @default blur 3
     * @returns {Spotify}
     * @example setBlur(5) - Max 15px
     */
  setBlur(blur = 3) {
    if (blur) {
      if (blur >= 0 && blur <= 15) {
        this.blur = blur;
        return this;
      } else {
        throw new Error("The value of the opacity of setBlur method must be between 0 and 15 (0 and 15 included).");
      }
    }
  }

  /**
   * .setImage
   * @param {string|Buffer|Image} image Album Or Song Image
   * @returns {Spotify}
   * @example setImage("https://someone-image.png")
   */
  setImage(image) {
    if (!image) throw new Error("The argument of the setImage method must be a string or a Buffer or a Canvas.Image.");
    this.image = image;
    return this;
  }

  /**
   * .setTitle
   * @param {string} title Title To Set
   * @returns {Spotify}
   * @example setTitle("Alone, Pt II")
   */
  setTitle(title) {
    if (!title || typeof title !== "string") throw new Error("The argument of the setTitle method must be a string.");
    this.title = title;
    return this;
  }


  /**
     * .setSpotifyLogo
     * @param {boolean} bool must be "true" or "false"
     * @returns {Spotify}
     * @default bool true
     * @example setSpotifyLogo(true)
     */
 setSpotifyLogo(bool){
  if(typeof bool !== "boolean") {
      throw new Error("You must give a abbreviate number true or false argument.");
    }
 this.spotifyLogo = bool;
 return this;
}

  /**
   * .setTimestamp
   * @param {number} start Start Timestamp
   * @param {number} end End Timestamp
   * @returns {Spotify}
   * @example setTimestamp(40000,179000)
   */
  setTimestamp(start, end) {
    if (!start || typeof start !== "number") throw new Error("The first argument of the setTimestamp method must be a number.");
    if (!end || typeof end !== "number") throw new Error("The first argument of the setTimestamp method must be a number.");
    this.start = start;
    this.end = end;
    return this;
  }

  /**
   * @private
   */
  _calcule_progress(current, total) {
    const progress = (current / total) * this._bar_width;
    if (isNaN(progress) || current < 0) {
      return 0;
    } else if (progress > this._bar_width) {
      return this._bar_width;
    } else {
      return progress;
    }
  }

  async build() {
    if (!this.title) throw new Error("Missing 'title' parameter.");
    if (!this.artist) throw new Error("Missing 'artist' parameter.");
    if (!this.start) throw new Error("Missing 'start' parameter.");
    if (!this.end) throw new Error("Missing 'end' parameter.");

    if (this.font.path) GlobalFonts.registerFromPath(this.font.path, this.font.name);

    const start_format = Util.format_time(this.start > this.end ? this.end : this.start);
    const end_format = Util.format_time(this.end);

    const canvas = createCanvas(980, 320);
    const ctx = canvas.getContext("2d");


   
    // Spotify benzeri koyu kart arka planı
    const outerGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    outerGradient.addColorStop(0, "#171717");
    outerGradient.addColorStop(1, "#0f0f0f");
    ctx.fillStyle = outerGradient;
    roundRect(ctx, 0, 0, canvas.width, canvas.height, 18, true, false);

    if (this.border) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = this.border;
      roundRect(ctx, 1, 1, canvas.width - 2, canvas.height - 2, 18, false, true);
    }

    ctx.fillStyle = "#121212";
    roundRect(ctx, 16, 16, canvas.width - 32, canvas.height - 32, 16, true, false);

    // Sol taraftaki albüm kapağı
    const coverX = 38;
    const coverY = 44;
    const coverSize = 232;

    try {
      if (this.image) {
        const image = await loadImage(this.image);
        drawRoundImage(ctx, image, coverX, coverY, coverSize, 14);
      } else {
        ctx.fillStyle = "#1f1f1f";
        roundRect(ctx, coverX, coverY, coverSize, coverSize, 14, true, false);
      }
    } catch (err) {
      console.error('Spotify image yüklenemedi:', err.message);
      ctx.fillStyle = "#1f1f1f";
      roundRect(ctx, coverX, coverY, coverSize, coverSize, 14, true, false);
    }

    // Metin ve oynatma alanı
    const contentX = 300;
    const contentY = 54;
    const contentWidth = 640;

    ctx.textAlign = "left";
    ctx.fillStyle = "#1db954";
    ctx.font = `bold 22px ${this.font.name}`;
    ctx.fillText("Spotify'da su an caliyor", contentX, contentY);

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 52px ${this.font.name}`;
    ctx.fillText(truncate(this.title, 26), contentX, contentY + 64);

    ctx.fillStyle = "#b3b3b3";
    ctx.font = `bold 25px ${this.font.name}`;
    ctx.fillText(truncate(this.artist, 36), contentX, contentY + 106);

    if (this.album && typeof this.album === "string") {
      ctx.fillStyle = "#909090";
      ctx.font = `22px ${this.font.name}`;
      ctx.fillText(truncate(this.album, 42), contentX, contentY + 142);
    }

    // İlerleme çubuğu
    const barX = contentX;
    const barY = 238;
    const barHeight = 8;

    ctx.fillStyle = "#4d4d4d";
    roundRect(ctx, barX, barY, this._bar_width, barHeight, 8, true, false);
    const currentProgress = this._calcule_progress(this.start, this.end);
    ctx.fillStyle = "#1db954";
    roundRect(ctx, barX, barY, currentProgress, barHeight, 8, true, false);

    ctx.beginPath();
    ctx.arc(barX + currentProgress, barY + barHeight / 2, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = "#b3b3b3";
    ctx.font = `20px ${this.font.name}`;
    ctx.fillText(start_format, barX, barY + 30);
    ctx.textAlign = "right";
    ctx.fillText(end_format, barX + this._bar_width, barY + 30);

    // Sağ üst Spotify logosu
    if (this.spotifyLogo) {
      try {
        ctx.drawImage(await loadImage(`${__dirname}/../../Images/Spotify.png`), contentX + contentWidth - 80, 30, 56, 56);
      } catch (err) {
        console.error('Spotify logo yüklenemedi:', err.message);
      }
    }

    return canvas.toBuffer('image/png');
  }
}

function roundRect(ctx, x, y, width, height, radius = 5, fill = true, stroke = false) {
  if (typeof radius === "number") {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  }
  else {
    let defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
    for (let side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }
};

function drawRoundImage(ctx, image, x, y, width, radius = 12) {
  ctx.save();
  roundRect(ctx, x, y, width, width, radius, false, false);
  ctx.clip();
  ctx.drawImage(image, x, y, width, width);
  ctx.restore();
}

function truncate(value, limit) {
  if (!value || typeof value !== "string") return "";
  return value.length > limit ? `${value.slice(0, limit - 3)}...` : value;
}