var lerp, lerperCache, lerper, zwrap, randint, birandint, rand, makeScangrad, scanlines, leak, sliceoffset, sliceglitch, addScangrad, bloom;
lerp = function(a, b, alpha){
  alpha == null && (alpha = 0.5);
  return b * alpha + a * (1 - alpha);
};
lerperCache = {};
lerper = function(alpha){
  var key, that, beta;
  if (alpha >= 1) {
    return function(a, b){
      return b;
    };
  }
  if (alpha <= 0) {
    return function(a, b){
      return a;
    };
  } else {
    key = 0 | alpha * 100;
    if (that = lerperCache[key]) {
      return that;
    }
    beta = 1 - alpha;
    return lerperCache[key] = new Function("a", "b", "return b * " + alpha + " + a * " + beta);
  }
};
zwrap = function(num, max){
  while (num < 0) {
    num += max;
  }
  return num % max;
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
makeScangrad = function(context, height, brightness){
  var x$, grad;
  brightness == null && (brightness = 0.1);
  x$ = grad = context.createLinearGradient(0, 0, 0, height);
  x$.height = height;
  x$.addColorStop(0, "rgba(255, 255, 255, 0)");
  x$.addColorStop(0.5, "rgba(255, 255, 255, " + brightness + ")");
  x$.addColorStop(1, "rgba(255, 255, 255, 0)");
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
  var data, width, height, lerp, m, len, y, yy, offset, to$, src;
  data = arg$.data, width = arg$.width, height = arg$.height;
  multiplier == null && (multiplier = 0.5);
  magic1 == null && (magic1 = 0);
  magic2 == null && (magic2 = 0);
  if (multiplier <= 0) {
    return;
  }
  lerp = lerper(multiplier);
  m = width * 4;
  len = data.length;
  for (y = 0; y < height; ++y) {
    yy = y * m + magic1;
    for (offset = yy, to$ = yy + m; offset < to$; offset += 4) {
      src = offset + 4 + magic2;
      if (src >= 0 && offset < data.length) {
        data[offset] = lerp(data[offset], data[offset + 4 + magic2]);
      }
    }
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
      srcOffset = yoff + zwrap(x + offset, width) * 4;
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
(function(){
  var settings, draw, start, x$, canvas, context, width, height, y$, image, z$, gui, z1$, z2$, z3$, z4$, z5$;
  settings = {
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
    }
  };
  draw = function(){
    var t0, data, x, to$, chanmask, drift, scangrad, t1, speed;
    t0 = +new Date;
    context.drawImage(image, 0, 0, width, height);
    data = context.getImageData(0, 0, width, height);
    for (x = 0, to$ = randint(settings.leaks.nMin, settings.leaks.nMax); x < to$; ++x) {
      leak(data, settings.leaks.strength, settings.leaks.magic1, settings.leaks.magic2);
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
    context.putImageData(data, 0, 0);
    bloom(context, settings.bloom.radius, settings.bloom.strength, settings.bloom.counter);
    data = context.getImageData(0, 0, width, height);
    if (settings.scanlines.enabled) {
      scanlines(data, settings.scanlines.brightness);
    }
    context.putImageData(data, 0, 0);
    if (settings.tvscan.height && settings.tvscan.brightness) {
      scangrad = makeScangrad(context, settings.tvscan.height, settings.tvscan.brightness);
      addScangrad(context, scangrad, t0 * settings.tvscan.speed);
    }
    t1 = +new Date;
    speed = t1 - t0;
  };
  start = function(){
    setInterval(draw, 1000 / 30.0);
  };
  x$ = canvas = document.createElement("canvas");
  x$.width = 256;
  x$.height = 224;
  x$.style.height = 800;
  document.body.appendChild(x$);
  context = x$.getContext("2d");
  width = canvas.width, height = canvas.height;
  y$ = image = new Image;
  y$.src = "mario.png";
  y$.onload = function(){
    return start();
  };
  z$ = gui = new dat.GUI;
  z1$ = z$.addFolder("leaks");
  z1$.add(settings.leaks, "nMin", 0, 20).step(1);
  z1$.add(settings.leaks, "nMax", 0, 20).step(1);
  z1$.add(settings.leaks, "strength", 0, 1);
  z1$.add(settings.leaks, "magic1", -10, 10).step(1);
  z1$.add(settings.leaks, "magic2", -10, 10).step(1);
  z2$ = z$.addFolder("sliceglitch");
  z2$.add(settings.sliceglitch, "probability", 0, 100).step(1);
  z2$.add(settings.sliceglitch, "nMin", 0, 100).step(1);
  z2$.add(settings.sliceglitch, "nMax", 0, 100).step(1);
  z2$.add(settings.sliceglitch, "randChan");
  z2$.add(settings.sliceglitch, "chanR");
  z2$.add(settings.sliceglitch, "chanG");
  z2$.add(settings.sliceglitch, "chanB");
  z2$.add(settings.sliceglitch, "hMin", 0, 100).step(1);
  z2$.add(settings.sliceglitch, "hMax", 0, 100).step(1);
  z2$.add(settings.sliceglitch, "offMin", 0, 100).step(1);
  z2$.add(settings.sliceglitch, "offMax", 0, 100).step(1);
  z2$.add(settings.sliceglitch, "driftProb", 0, 100).step(1);
  z2$.add(settings.sliceglitch, "driftMag", -10, 10).step(1);
  z3$ = z$.addFolder("bloom");
  z3$.add(settings.bloom, "radius", 0, 10).step(1);
  z3$.add(settings.bloom, "strength", 0, 1);
  z3$.add(settings.bloom, "counter", 0, 1);
  z4$ = z$.addFolder("scanlines");
  z4$.add(settings.scanlines, "enabled");
  z4$.add(settings.scanlines, "brightness", 0, 1);
  z5$ = z$.addFolder("tvscan");
  z5$.add(settings.tvscan, "height", 0, 500).step(1);
  z5$.add(settings.tvscan, "brightness", 0, 1);
  z5$.add(settings.tvscan, "speed", 0, 1);
}.call(this));