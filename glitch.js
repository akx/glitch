(function(){
  var lerp, lerperCache, lerper, zwrap, zclamp, randint, birandint, rand, mmod, makeScangrad, scanlines, leak, bitbang, sliceoffset, sliceglitch, addScangrad, bloom, noise, displacementMapper, toYcbcrMatrix, fromYcbcrMatrix, matrixXform, toYcbcr, fromYcbcr;
  lerp = function(a, b, alpha){
    alpha == null && (alpha = 0.5);
    return b * alpha + a * (1 - alpha);
  };
  lerperCache = {
    _a: function(a, b){
      return a;
    },
    _b: function(a, b){
      return b;
    }
  };
  lerper = function(alpha){
    var key, that, beta;
    if (alpha <= 0) {
      return lerperCache._a;
    }
    if (alpha >= 1) {
      return lerperCache._b;
    }
    key = 0 | alpha * 100;
    if (that = lerperCache[key]) {
      return that;
    }
    beta = 1 - alpha;
    return lerperCache[key] = new Function("a", "b", "return b * " + alpha + " + a * " + beta);
  };
  zwrap = function(num, max){
    while (num < 0) {
      num += max;
    }
    return num % max;
  };
  zclamp = function(num, max){
    if (num < 0) {
      return 0;
    }
    if (num >= max) {
      return max;
    }
    return num;
  };
  randint = function(min, max){
    return 0 | Math.random() * (max - min) + min;
  };
  birandint = function(min, max){
    return 0 | (Math.random() * (max - min) + min) * (Math.random() <= 0.5
      ? -1
      : +1);
  };
  rand = function(min, max){
    return Math.random() * (max - min) + min;
  };
  mmod = function(a, b){
    if (a < 0) {
      a += (1 + 0 | a / -b) * b;
    }
    return 0 | a % b;
  };
  makeScangrad = function(context, height, brightness){
    var x0$, grad;
    brightness == null && (brightness = 0.1);
    x0$ = grad = context.createLinearGradient(0, 0, 0, height);
    x0$.height = height;
    x0$.addColorStop(0, "rgba(255, 255, 255, 0)");
    x0$.addColorStop(0.5, "rgba(255, 255, 255, " + brightness + ")");
    x0$.addColorStop(1, "rgba(255, 255, 255, 0)");
    return grad;
  };
  scanlines = function(arg$, multiplier){
    var data, width, height, y, x, offset;
    data = arg$.data, width = arg$.width, height = arg$.height;
    multiplier == null && (multiplier = 0.7);
    if (multiplier >= 1) {
      return;
    }
    for (y = 0; y < height; y += 2) {
      for (x = 0; x < width; ++x) {
        offset = y * width * 4 + x * 4;
        data[offset++] *= multiplier;
        data[offset++] *= multiplier;
        data[offset++] *= multiplier;
      }
    }
  };
  leak = function(arg$, multiplier, magic1, magic2){
    var data, width, height, lerp, dwidth, len, y, yoffset, offset, to$, src;
    data = arg$.data, width = arg$.width, height = arg$.height;
    multiplier == null && (multiplier = 0.5);
    magic1 == null && (magic1 = 0);
    magic2 == null && (magic2 = 0);
    if (multiplier <= 0) {
      return;
    }
    lerp = lerper(multiplier);
    dwidth = width * 4;
    len = data.length;
    for (y = 0; y < height; ++y) {
      yoffset = y * dwidth + magic1;
      for (offset = yoffset, to$ = yoffset + dwidth; offset < to$; offset += 4) {
        src = offset + 4 + magic2;
        if (src >= 0 && src < len && offset >= 0 && offset < len) {
          data[offset] = lerp(data[offset], data[src]);
        }
      }
    }
  };
  bitbang = function(outputData, inputData, offScale, maxStrideIn, maxStrideOut, maxFeedback){
    var strideIn, strideOut, offIn, offOut, yDrift, feedback, x0$, inp, inl, x1$, outp, outl, width, last, i, to$, ii, io, to1$;
    strideIn = randint(1, maxStrideIn);
    strideOut = randint(1, maxStrideOut);
    offIn = randint(-offScale, offScale);
    offOut = randint(-offScale, offScale);
    yDrift = randint(-1, 3);
    feedback = randint(0, maxFeedback) / 20.0;
    x0$ = inp = inputData.data;
    inl = x0$.length;
    x1$ = outp = outputData.data;
    outl = x1$.length;
    width = outputData.width;
    last = 0;
    for (i = 0, to$ = outp.length; i < to$; ++i) {
      ii = offIn + i * strideIn;
      ii += (0 | ii / width) * yDrift;
      ii = mmod(ii, inl);
      io = mmod(offOut + i * strideOut, outl);
      if (feedback > 0) {
        last = outp[io] = 0 | lerp(last, inp[ii], feedback);
      } else {
        outp[io] = inp[ii];
      }
    }
    for (i = 0, to1$ = outp.length; i < to1$; i += 4) {
      outp[i + 3] = 255;
    }
  };
  sliceoffset = function(arg$, y0, y1, offset, chanmask, blend, drift){
    var data, width, height, lerp, x0, x1, dir, y, yoff, x, dstOffset, srcOffset;
    data = arg$.data, width = arg$.width, height = arg$.height;
    chanmask == null && (chanmask = 2);
    blend == null && (blend = 0.2);
    drift == null && (drift = 0);
    if (!chanmask) {
      return;
    }
    lerp = lerper(blend);
    if (offset > 0) {
      x0 = 0;
      x1 = width;
      dir = +1;
    } else {
      x0 = width - 1;
      x1 = 0;
      dir = -1;
    }
    for (y = y0; y < y1; ++y) {
      yoff = y * width * 4;
      offset += drift;
      for (x = x0; dir < 0 ? x > x1 : x < x1; x += dir) {
        dstOffset = yoff + x * 4;
        srcOffset = yoff + zwrap(0 | x + offset, width) * 4;
        if (chanmask & 1) {
          data[dstOffset] = lerp(data[dstOffset], data[srcOffset]);
        }
        if (chanmask & 2) {
          data[dstOffset + 1] = lerp(data[dstOffset + 1], data[srcOffset + 1]);
        }
        if (chanmask & 4) {
          data[dstOffset + 2] = lerp(data[dstOffset + 2], data[srcOffset + 2]);
        }
      }
    }
  };
  sliceglitch = function(data, shmin, shmax, offmin, offmax, chanmask, blend){
    var sh, y0;
    sh = randint(shmin, shmax);
    y0 = randint(0, data.height - sh);
    sliceoffset(data, y0, y0 + sh, birandint(offmin, offmax), chanmask, blend);
  };
  addScangrad = function(context, scangrad, time){
    var ref$, width, height;
    ref$ = context.canvas, width = ref$.width, height = ref$.height;
    context.save();
    context.translate(0, -scangrad.height + time % (height + scangrad.height * 2));
    context.fillStyle = scangrad;
    context.fillRect(0, 0, width, scangrad.height);
    context.restore();
  };
  bloom = function(context, radius, strength, counter){
    var ref$, width, height, data, blurData;
    if (strength <= 0 || radius <= 0) {
      return;
    }
    ref$ = context.canvas, width = ref$.width, height = ref$.height;
    data = context.getImageData(0, 0, width, height);
    blurData = context.getImageData(0, 0, width, height);
    stackBlurImageData(blurData, 0, 0, width, height, radius);
    dataBlend(blurData, data, strength, counter, "screen");
    context.putImageData(data, 0, 0);
  };
  noise = function(arg$, y0, y1, noisiness, minBrightness, maxBrightness, replace){
    var data, width, height, y, yoff, x, offset, brightness;
    data = arg$.data, width = arg$.width, height = arg$.height;
    for (y = y0; y < y1; ++y) {
      yoff = y * width * 4;
      for (x = 0; x < width; ++x) {
        if (rand(0, 100) < noisiness) {
          offset = yoff + x * 4;
          brightness = randint(minBrightness, maxBrightness);
          if (replace) {
            data[offset++] = brightness;
            data[offset++] = brightness;
            data[offset++] = brightness;
          } else {
            data[offset++] += brightness;
            data[offset++] += brightness;
            data[offset++] += brightness;
          }
        }
      }
    }
  };
  displacementMapper = function(context, displacementMap, scaleX, scaleY){
    var ref$, width, height, x0$, x1$, displacementData, sourceData, destData, d, y, yoff, x, offset, disZ, disX, disY, sourceX, sourceY, sourceOffset;
    ref$ = context.canvas, width = ref$.width, height = ref$.height;
    x0$ = document.createElement("canvas");
    x0$.width = width;
    x0$.height = height;
    x1$ = x0$.getContext("2d");
    x1$.drawImage(displacementMap, 0, 0, width, height);
    displacementData = x1$.getImageData(0, 0, width, height).data;
    sourceData = context.getImageData(0, 0, width, height).data;
    d = (destData = context.getImageData(0, 0, width, height)).data;
    for (y = 0; y < height; ++y) {
      yoff = y * width * 4;
      for (x = 0; x < width; ++x) {
        offset = yoff + x * 4;
        disZ = displacementData[offset + 2] / 127.0;
        disX = (displacementData[offset] - 127) / 128.0 * scaleX * disZ;
        disY = (displacementData[offset + 1] - 127) / 128.0 * scaleY * disZ;
        sourceX = 0 | Math.round(x + disX);
        sourceY = 0 | Math.round(y + disY);
        sourceOffset = zclamp(sourceY, height) * width * 4 + zclamp(sourceX, width) * 4;
        d[offset++] = sourceData[sourceOffset++];
        d[offset++] = sourceData[sourceOffset++];
        d[offset++] = sourceData[sourceOffset++];
      }
    }
    context.putImageData(destData, 0, 0);
  };
  toYcbcrMatrix = [0, 0, 0.299, 0.587, 0.114, 0, 128, -0.169, -0.331, 0.500, 0, 128, 0.500, -0.419, 0.081];
  fromYcbcrMatrix = [0, 0, 1, 0, 1.4, -128, 0, 1, -0.343, -0.711, -128, 0, 1, 1.765, 0];
  matrixXform = function(arg$, matrix){
    var data, width, height, offset, rPre, rPost, r0, r1, r2, gPre, gPost, g0, g1, g2, bPre, bPost, b0, b1, b2, to$, r, g, b;
    data = arg$.data, width = arg$.width, height = arg$.height;
    offset = 0;
    rPre = matrix[0], rPost = matrix[1], r0 = matrix[2], r1 = matrix[3], r2 = matrix[4], gPre = matrix[5], gPost = matrix[6], g0 = matrix[7], g1 = matrix[8], g2 = matrix[9], bPre = matrix[10], bPost = matrix[11], b0 = matrix[12], b1 = matrix[13], b2 = matrix[14];
    for (offset = 0, to$ = data.length; offset < to$; offset += 4) {
      r = data[offset] + rPre;
      g = data[offset + 1] + gPre;
      b = data[offset + 2] + bPre;
      data[offset] = (r0 * r + r1 * g + r2 * b) + rPost;
      data[offset + 1] = (g0 * r + g1 * g + g2 * b) + gPost;
      data[offset + 2] = (b0 * r + b1 * g + b2 * b) + bPost;
    }
  };
  toYcbcr = function(imageData){
    matrixXform(imageData, toYcbcrMatrix);
  };
  fromYcbcr = function(imageData){
    matrixXform(imageData, fromYcbcrMatrix);
  };
  (function(){
    var MARIO_IMAGE, PONG_IMAGE, C64_IMAGE, width, height, settings, afterimageData, createDisplacement, dismapImage, drawDebugGrid, draw, start, sizeChange, x0$, canvas, context, x1$, marioImage, x2$, pongImage, x3$, c64Image, x4$, gui, x5$, x6$, x7$, x8$, x9$, x10$, x11$, x12$, x13$, x14$, x15$, x16$;
    MARIO_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAADgBAMAAAAeb6VjAAAAMFBMVEUEAgQEqgRclvz82qzcKgT8mjz8vrQ8vvz8/vyE0hTMTgwAAHdANCgM7uRNEgABAABV4TC4AAAFZ0lEQVR42u2cTW+jOBjHDYcqwwm+geVWkdUrHWn2uDtUmjnuqhz2FvXAoV8gPUZopHqPe5xb1EMOfMrxC06AGHASzNNRbIU+NLHxj7//jzH0BRHggjyAB/AAHwqAEVoSxl+M7zFW8s36QKKtqC/blvx7fhxd6mOV4hPW/OAIoOQVeTV5CMEiD2UPoDcJQBrw4g15bgJiSAFNeQ4A7QI02moAZg3ATgdotB0E6AwrOjoLWalucA6AYjcDSJVGTCg3yk4HKNm+ba8HiC0AUa49Kwvqti2zC0vZZAH8RCTg5PireUAapglchYd61KCOHjHDyNF6bum2awFQIaQYOym9GkXaGMv7aruvR0zDo2FZaRwiYmhn9IC0ikqblhEFAFWY5bGdhhUgdWp32/WZsCatJ6WmAqV2sxmA6jw8zlO5dduZAfREYAKgdT1m0HkAgMrqI1nAhZWbGn89HJR0FdB1ThkCVjZ8MJoFhGnXtgyFq0h6QNcxOL1sxu5MSWtznz8PoHe/IvIAHsADfDgAjEJYgE9JDAqA/0+S8LoBkmsHIAGwCeHTkPy8EMwVwIJtQAEQXwKGgACYCYAQGGCzgQV4tRsENwALtmZvgABY9M7gANCCqbIhIQQAZrps8AYCYLEHYAsQANYoGzw/AGoCsEU4NwBm7XJ9AE0PykycHQCLSVhNxTZzkYs0fBOdv4EpwCVY8yvB+lUxhBAAvPv1K38xNv6029G14I2f/1r0jyAAZCqKZNiM9+9oPYD4HMyXpaHF0V0tSkPbhbmrZTn4jYkH8AAewAN4AA/gATyAB/AAHsADXBcAk7/ZQsEAKClVgRsCaAAtARhACQxACTSA/HXSkkECwKahnwk9gAfwAB7AAwAC3KYpKADv/zMoQJqmOTRAmv4BCJA9PuX/ACpwlz8+Peb/QgJkOS9QAJRlHOAJDoBwgPwpy75bVF0Wz/xrwUs7Pl8EQH885mIQLKreV6Krl6rqxPfLPMB+5JmdCR0B0K8PWZb/Bwdwl2ZZ9jckABfgzwQY4IHBAny1A8BIpN4KoU4ML70YZenDNzsFqioybBcD8AIM8Dn9AghwKxT4YucBc5kN4N54/tGlWfAxAAg0wF8ZnAdEGvLJ0DILRIf63PX+pQC30ACc4MFqReQMgK/MrQBceUAS/LTMgq08a6WB3n+fAOAOGoD8FgAuPWCpgLMs8AC/jQeuPQ2vdx44PBd44edris9uAQ63ZKJDU7weAHE/aIozKmDePIBjgL7nAs3oWIGq557osHkAxx6wKG4ViEY1GAMYRXQLgFGSJMN/ruMUAAeJKHEI5QHVfxLE02UB79E+C7DqP0ZD/2biNAB5ztYAwR4gnghgKwEiS4BaAAEwIIFDD9QCIAEQT5MFdZ92WaAFQEkw9M9G3AEEewA5DlMAbGuAyAZAC1AD9ErgzANaAF3iCbIA7RUYzwKcdEs4L0BwBBDPCnAsQJ8EjjwQGADiGbPAJECPBG4AAiNAPBuAWQCzBE48oNcBjb4DkwT3hSrhxFlwWAcc1EcmCZY72f9qaoCgF6AjwfJFAqCJAXDSC9CRYFns9j8DntADzXVA0tmPOwDiDnc7oMA5WdBeB3T3Q/cA7XVAdz92DoCTQYCWBGMAZ3kgSIZLfJICp2cBTsZK6BYgGAWInQKMC9CUwIEHAguAuAEgz2fCLLARoCHBciWPt50OILAC2EuwrI83GYCdAAcJ9Bi/X+KBIioK+egeKKLqphKvCip6AA4Q1W/ARFRFCO3EG0CRK1AUiggmehPCA2z5FVVcoKGiBLhZRRVUREKGm90KLKqdaldARQGwVd/ARLQTTy75BhX9esAD+PWAXw/8AimevooIJ41nAAAAAElFTkSuQmCC';
    PONG_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAADgAQMAAADWjyoTAAAABlBMVEUAAAD///+l2Z/dAAABBklEQVR4Xu3WQYrCQBAF0N9k4bKO4E30ZoNH61l5DY9Q2bkIlMaBQBjsTyzbprH++pH0p6pDsCmRiJH4ARSrpIxVdgtY0haIiaVsauoBgAuIAFBVF0jZCWwGVgJAbSCspqTsAOQVZFgOQDeKXpwObpa/hZxJiwaAHLKjFlGz3xbf93344WBJO0Bb9DyL/lcuWsSwokWsXAxrvL4ZAO1B+xbRAmKGZFOasMtilxIQAsgTUBOccD1g0Dv4VeyfgvEfUGwDSoHlGSQGUACXMhjrA52OfiCvArO/WRztKcADoAy0KTgBy0YNVgJSBPPKfQRgT1rUAvwMq+tfD6QNoKf/ByP5BPimRG5Sg0pghTsM4gAAAABJRU5ErkJggg==';
    C64_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAADIAQMAAACjyqroAAAABlBMVEVAQOCgoPznx/VsAAABO0lEQVR4Xu3SsYpcMQyF4VO5ClurCPMMKbcQeRaB4W/GRbpxYXQffbM4lymGFLdYkkZfq4OE4OiLFffeffpKedMydxf+kgEQPB4MCPEmHEMgAD35JwXHARCKmyAsRNsjPX18UnC/A2tqoZVuIb7t0etGegdmiEPQLMSPl40Agt4ZjH0RMOQhgL9/zZ+vcXdZ6v8p3tCyLscz+66S2VnIRaYrV6Yk3obwhwCLhwSYPQtpgYIISXGbgkNBWBxSg/f3s5BgEWdQi19aed8n51367j/NzkIut+maa05JHFOTrmbNokuNZnYWErNoirk30oYGXRg7COwgxg6iGBHn19Dl5nZ+nXkWcpmlK8jUv1ZW2kQXED4uBgFdsGbiumAGmC4YwbArSZJppi/0oUsqWEoppZRSSimllFJKKaWU3x+6lxF1jMiHAAAAAElFTkSuQmCC';
    width = height = 0;
    settings = {
      fps: 30,
      width: 256,
      height: 224,
      scale: 2.0,
      image: "mario",
      ycbcrPre: false,
      ycbcrPost: false,
      leaks: {
        nMin: 3,
        nMax: 7,
        strength: 0,
        magic1: 0,
        magic2: 0
      },
      sliceglitch: {
        probability: 0,
        nMin: 5,
        nMax: 5,
        randChan: true,
        chanR: true,
        chanG: true,
        chanB: true,
        hMin: 5,
        hMax: 23,
        offMin: 1,
        offMax: 25,
        driftProb: 20,
        driftMag: 2
      },
      noise: {
        probability: 0,
        nMin: 5,
        nMax: 5,
        hMin: 5,
        hMax: 5,
        noisiness: 35,
        brightnessMin: 10,
        brightnessMax: 50,
        replace: false
      },
      bitbang: {
        probability: 0,
        offScale: 0,
        maxStrideIn: 16,
        maxStrideOut: 6,
        maxFeedback: 0
      },
      bloom: {
        radius: 0,
        strength: 0.5,
        counter: 0.5
      },
      scanlines: {
        enabled: false,
        brightness: 0.8
      },
      tvscan: {
        height: 300,
        brightness: 0.0,
        speed: 0.3
      },
      afterimage: {
        enabled: false,
        strengthOut: 0.2,
        counterOut: 0.2,
        strengthIn: 0.2
      },
      displacement: {
        enabled: false,
        strength: 15
      }
    };
    afterimageData = null;
    createDisplacement = function(){
      var width, height, x0$, canvas, x1$, context, data, y, x, ix, iy, cdis, an, xd, yd, offset;
      width = 256;
      height = 224;
      x0$ = canvas = document.createElement("canvas");
      x0$.width = width;
      x0$.height = height;
      x1$ = context = x0$.getContext("2d");
      x1$.fillStyle = "black";
      x1$.fillRect(0, 0, width, height);
      data = x1$.getImageData(0, 0, width, height);
      for (y = 0; y < height; ++y) {
        for (x = 0; x < width; ++x) {
          ix = (x / width - 0.5) * 2;
          iy = (y / height - 0.5) * 2;
          cdis = 1.0 - (ix * ix + iy * iy);
          cdis = Math.cos(cdis * 3.141 / 2.0);
          an = Math.atan2(iy, ix);
          xd = -Math.cos(an) * 125 * cdis;
          yd = -Math.sin(an) * 125 * cdis;
          offset = y * width * 4 + x * 4;
          data.data[offset] = 127 + xd;
          data.data[offset + 1] = 127 + yd;
          data.data[offset + 2] = 127;
        }
      }
      x1$.putImageData(data, 0, 0);
      return canvas;
    };
    dismapImage = createDisplacement();
    drawDebugGrid = function(context){
      var x, to$, y, to1$;
      context.beginPath();
      context.fillStyle = "white";
      context.fillRect(0, 0, width, height);
      context.strokeStyle = "black";
      for (x = 0, to$ = width; x < to$; x += 8) {
        context.moveTo(x, 0);
        context.lineTo(x, height);
      }
      for (y = 0, to1$ = height; y < to1$; y += 8) {
        context.moveTo(0, y);
        context.lineTo(width, y);
      }
      context.stroke();
    };
    draw = function(){
      var t0, data, x, to$, chanmask, drift, to1$, y0, h, y1, bitbangSourceData, to2$, scangrad, t1, speed;
      t0 = +new Date;
      switch (settings.image) {
      case "mario":
        context.drawImage(marioImage, 0, 0, width, height);
        break;
      case "pong":
        context.drawImage(pongImage, 0, 0, width, height);
        break;
      case "c64":
        context.drawImage(c64Image, 0, 0, width, height);
        break;
      case "grid":
        drawDebugGrid(context);
      }
      data = context.getImageData(0, 0, width, height);
      if (settings.ycbcrPre) {
        toYcbcr(data);
      }
      if (randint(0, 100) < settings.sliceglitch.probability) {
        for (x = 0, to$ = randint(settings.sliceglitch.nMin, settings.sliceglitch.nMax); x < to$; ++x) {
          chanmask = 0;
          if (!settings.sliceglitch.randChan || randint(0, 100) < 33) {
            chanmask |= +settings.sliceglitch.chanR;
          }
          if (!settings.sliceglitch.randChan || randint(0, 100) < 33) {
            chanmask |= +settings.sliceglitch.chanG << 1;
          }
          if (!settings.sliceglitch.randChan || randint(0, 100) < 33) {
            chanmask |= +settings.sliceglitch.chanB << 2;
          }
          drift = randint(0, 100) < settings.sliceglitch.driftProb ? settings.sliceglitch.driftMag : 0;
          sliceglitch(data, settings.sliceglitch.hMin, settings.sliceglitch.hMax, settings.sliceglitch.offMin, settings.sliceglitch.offMax, chanmask, 1, drift);
        }
      }
      if (randint(0, 100) < settings.noise.probability) {
        for (x = 0, to1$ = randint(settings.noise.nMin, settings.noise.nMax); x < to1$; ++x) {
          y0 = randint(0, height);
          h = randint(settings.noise.hMin, settings.noise.hMax);
          y1 = y0 + h;
          noise(data, y0, y1, settings.noise.noisiness, settings.noise.brightnessMin, settings.noise.brightnessMax, settings.noise.replace);
        }
      }
      if (randint(0, 100) < settings.bitbang.probability) {
        context.putImageData(data, 0, 0);
        bitbangSourceData = context.getImageData(0, 0, width, height);
        bitbang(data, bitbangSourceData, settings.bitbang.offScale, settings.bitbang.maxStrideIn, settings.bitbang.maxStrideOut, settings.bitbang.maxFeedback);
      }
      for (x = 0, to2$ = randint(settings.leaks.nMin, settings.leaks.nMax); x < to2$; ++x) {
        leak(data, settings.leaks.strength, settings.leaks.magic1, settings.leaks.magic2);
      }
      if (settings.bloom.strength) {
        context.putImageData(data, 0, 0);
        bloom(context, settings.bloom.radius, settings.bloom.strength, settings.bloom.counter);
        data = context.getImageData(0, 0, width, height);
      }
      if (settings.afterimage.enabled) {
        if (afterimageData) {
          dataBlend(afterimageData, data, settings.afterimage.strengthOut, settings.afterimage.counterOut, "screen");
        }
        if (afterimageData && settings.afterimage.strengthIn < 1) {
          dataBlend(data, afterimageData, settings.afterimage.strengthIn, 1.0 - settings.afterimage.strengthIn, "normal");
        } else {
          afterimageData = context.getImageData(0, 0, width, height);
        }
      }
      if (settings.scanlines.enabled) {
        scanlines(data, settings.scanlines.brightness);
      }
      if (settings.ycbcrPost) {
        fromYcbcr(data);
      }
      context.putImageData(data, 0, 0);
      data = null;
      if (settings.tvscan.height && settings.tvscan.brightness) {
        scangrad = makeScangrad(context, settings.tvscan.height, settings.tvscan.brightness);
        addScangrad(context, scangrad, t0 * settings.tvscan.speed);
      }
      if (settings.displacement.enabled) {
        context.beginPath();
        context.strokeStyle = "black";
        context.rect(0, 0, width - 1, height - 1);
        context.stroke();
        displacementMapper(context, dismapImage, settings.displacement.strength, settings.displacement.strength);
      }
      t1 = +new Date;
      speed = t1 - t0;
      setTimeout(draw, 1000 / settings.fps);
    };
    start = function(){
      draw();
    };
    window.benchmarkDraws = function(){
      var t0, n, x, t1, dur;
      t0 = +new Date;
      n = 50;
      for (x = 0; x < n; ++x) {
        draw();
      }
      t1 = +new Date;
      dur = (t1 - t0) / 1000;
      console.log("draws", n);
      console.log("duration", dur);
      console.log("fps", n / dur);
    };
    sizeChange = function(){
      var ref$;
      width = canvas.width = settings.width;
      height = canvas.height = settings.height;
      ref$ = canvas.style;
      ref$.width = width * settings.scale;
      ref$.height = height * settings.scale;
      return afterimageData = null;
    };
    x0$ = canvas = document.createElement("canvas");
    document.body.appendChild(x0$);
    context = x0$.getContext("2d");
    sizeChange();
    x1$ = marioImage = new Image;
    x1$.src = MARIO_IMAGE;
    x1$.onload = function(){
      return start();
    };
    x2$ = pongImage = new Image;
    x2$.src = PONG_IMAGE;
    x3$ = c64Image = new Image;
    x3$.src = C64_IMAGE;
    x4$ = gui = new dat.GUI;
    x4$.add(settings, "fps", 1, 100).step(1);
    x5$ = x4$.add(settings, "scale", 1, 5).step(0.1);
    x5$.onChange(function(){
      return sizeChange();
    });
    x6$ = x4$.add(settings, "width", 64, 640).step(1);
    x6$.onChange(function(){
      return sizeChange();
    });
    x7$ = x4$.add(settings, "height", 64, 480).step(1);
    x7$.onChange(function(){
      return sizeChange();
    });
    x4$.add(settings, "image", ["mario", "pong", "grid", "c64"]);
    x4$.add(settings, "ycbcrPre");
    x4$.add(settings, "ycbcrPost");
    x8$ = x4$.addFolder("leaks");
    x8$.add(settings.leaks, "strength", 0, 1);
    x8$.add(settings.leaks, "nMin", 0, 20).step(1);
    x8$.add(settings.leaks, "nMax", 0, 20).step(1);
    x8$.add(settings.leaks, "magic1", -10, 10).step(1);
    x8$.add(settings.leaks, "magic2", -10, 10).step(1);
    x9$ = x4$.addFolder("sliceglitch");
    x9$.add(settings.sliceglitch, "probability", 0, 100).step(1);
    x9$.add(settings.sliceglitch, "nMin", 0, 100).step(1);
    x9$.add(settings.sliceglitch, "nMax", 0, 100).step(1);
    x9$.add(settings.sliceglitch, "randChan");
    x9$.add(settings.sliceglitch, "chanR");
    x9$.add(settings.sliceglitch, "chanG");
    x9$.add(settings.sliceglitch, "chanB");
    x9$.add(settings.sliceglitch, "hMin", 1, 300).step(1);
    x9$.add(settings.sliceglitch, "hMax", 1, 300).step(1);
    x9$.add(settings.sliceglitch, "offMin", 0, 100).step(1);
    x9$.add(settings.sliceglitch, "offMax", 0, 100).step(1);
    x9$.add(settings.sliceglitch, "driftProb", 0, 100).step(1);
    x9$.add(settings.sliceglitch, "driftMag", -10, 10).step(1);
    x10$ = x4$.addFolder("bitbang");
    x10$.add(settings.bitbang, "probability", 0, 100).step(1);
    x10$.add(settings.bitbang, "maxStrideIn", 0, 32).step(1);
    x10$.add(settings.bitbang, "maxStrideOut", 0, 32).step(1);
    x10$.add(settings.bitbang, "maxFeedback", 0, 10).step(1);
    x10$.add(settings.bitbang, "offScale", 0, 100).step(1);
    x11$ = x4$.addFolder("noise");
    x11$.add(settings.noise, "probability", 0, 100).step(1);
    x11$.add(settings.noise, "noisiness", 0, 100).step(1);
    x11$.add(settings.noise, "nMin", 0, 100).step(1);
    x11$.add(settings.noise, "nMax", 0, 100).step(1);
    x11$.add(settings.noise, "hMin", 1, 300).step(1);
    x11$.add(settings.noise, "hMax", 1, 300).step(1);
    x11$.add(settings.noise, "brightnessMin", -255, 255).step(1);
    x11$.add(settings.noise, "brightnessMax", -255, 255).step(1);
    x11$.add(settings.noise, "replace");
    x12$ = x4$.addFolder("bloom");
    x12$.add(settings.bloom, "strength", 0, 1);
    x12$.add(settings.bloom, "radius", 0, 10).step(1);
    x12$.add(settings.bloom, "counter", 0, 1);
    x13$ = x4$.addFolder("scanlines");
    x13$.add(settings.scanlines, "enabled");
    x13$.add(settings.scanlines, "brightness", 0, 1);
    x14$ = x4$.addFolder("tvscan");
    x14$.add(settings.tvscan, "brightness", 0, 1);
    x14$.add(settings.tvscan, "height", 0, 500).step(1);
    x14$.add(settings.tvscan, "speed", 0, 1);
    x15$ = x4$.addFolder("afterimage");
    x15$.add(settings.afterimage, "enabled");
    x15$.add(settings.afterimage, "strengthOut", 0, 1);
    x15$.add(settings.afterimage, "counterOut", 0, 1);
    x15$.add(settings.afterimage, "strengthIn", 0, 1);
    x16$ = x4$.addFolder("displacement");
    x16$.add(settings.displacement, "enabled");
    x16$.add(settings.displacement, "strength", -50, 50).step(1);
  }.call(this));
}).call(this);
