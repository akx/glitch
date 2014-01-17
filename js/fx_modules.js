define("fx_modules", ["module_base", "utils", "contextfx", "datafx", "displace"], function(mb, utils, cfx, dfx, dsp){
  var rand, randint, mmod;
  rand = utils.rand, randint = utils.randint, mmod = utils.mmod;
  mb.Module("ycbcrPre", [mb.Bool("enable")], function(settings, context, data){
    if (settings.enable) {
      dfx.toYCbCr(data);
    }
  });
  mb.Module("ycbcrPost", [mb.Bool("enable")], function(settings, context, data){
    if (settings.enable) {
      dfx.fromYCbCr(data);
    }
  });
  mb.Module("leaks", [
    mb.Num("probability"), mb.Num("strength"), mb.Int("nMin", {
      min: 0,
      max: 20
    }), mb.Int("nMax", {
      min: 0,
      max: 20
    }), mb.Int("magic1", {
      min: -10,
      max: 10
    }), mb.Int("magic2", {
      min: -10,
      max: 10
    })
  ], function(settings, context, data){
    var x, to$;
    if (rand() > settings.probability) {
      return;
    }
    for (x = 0, to$ = randint(settings.nMin, settings.nMax); x < to$; ++x) {
      dfx.leak(data, settings.strength, settings.magic1, settings.magic2);
    }
  });
  mb.Module("sliceglitch", [
    mb.Num("probability"), mb.Int("nMin", {
      min: 0,
      max: 100,
      value: 5
    }), mb.Int("nMax", {
      min: 0,
      max: 100,
      value: 5
    }), mb.Bool("randChan", {
      value: true
    }), mb.Bool("chanR", {
      value: true
    }), mb.Bool("chanG", {
      value: true
    }), mb.Bool("chanB", {
      value: true
    }), mb.Int("hMin", {
      min: 1,
      max: 300,
      value: 5
    }), mb.Int("hMax", {
      min: 1,
      max: 300,
      value: 23
    }), mb.Int("offMin", {
      min: 0,
      max: 100,
      value: 5
    }), mb.Int("offMax", {
      min: 0,
      max: 100,
      value: 25
    }), mb.Int("driftProb", {
      min: 0,
      max: 100,
      value: 20
    }), mb.Int("driftMag", {
      min: -10,
      max: 10,
      value: 2
    })
  ], function(settings, context, data){
    var x, to$, chanmask, drift;
    if (rand() > settings.probability) {
      return;
    }
    for (x = 0, to$ = randint(settings.nMin, settings.nMax); x < to$; ++x) {
      chanmask = 0;
      if (!settings.randChan || randint(0, 100) < 33) {
        chanmask |= +settings.chanR;
      }
      if (!settings.randChan || randint(0, 100) < 33) {
        chanmask |= +settings.chanG << 1;
      }
      if (!settings.randChan || randint(0, 100) < 33) {
        chanmask |= +settings.chanB << 2;
      }
      drift = randint(0, 100) < settings.driftProb ? settings.driftMag : 0;
      dfx.sliceglitch(data, settings.hMin, settings.hMax, settings.offMin, settings.offMax, chanmask, 1, drift);
    }
  });
  mb.Module("noise", [
    mb.Num("probability"), mb.Int("nMin", {
      min: 0,
      max: 100,
      value: 5
    }), mb.Int("nMax", {
      min: 0,
      max: 100,
      value: 5
    }), mb.Int("hMin", {
      min: 0,
      max: 100,
      value: 5
    }), mb.Int("hMax", {
      min: 0,
      max: 100,
      value: 5
    }), mb.Int("noisiness", {
      min: 0,
      max: 100,
      value: 35
    }), mb.Int("brightnessMin", {
      min: -100,
      max: 100,
      value: 10
    }), mb.Int("brightnessMax", {
      min: -100,
      max: 100,
      value: 50
    }), mb.Bool("replace")
  ], function(settings, context, data){
    var x, to$, h, y0, y1;
    if (rand() > settings.probability) {
      return;
    }
    for (x = 0, to$ = randint(settings.nMin, settings.nMax); x < to$; ++x) {
      h = randint(settings.hMin, settings.hMax);
      y0 = randint(0, data.height - h);
      y1 = y0 + h;
      dfx.noise(data, y0, y1, settings.noisiness, settings.brightnessMin, settings.brightnessMax, settings.replace);
    }
  });
  mb.Module("bitbang", [
    mb.Num("probability"), mb.Int("minStrideIn", {
      min: 0,
      max: 32
    }), mb.Int("maxStrideIn", {
      min: 0,
      max: 32
    }), mb.Int("minStrideOut", {
      min: 0,
      max: 32
    }), mb.Int("maxStrideOut", {
      min: 0,
      max: 32
    }), mb.Int("minFeedback", {
      min: 0,
      max: 10
    }), mb.Int("maxFeedback", {
      min: 0,
      max: 10
    }), mb.Int("minYDrift", {
      min: -2,
      max: 10
    }), mb.Int("maxYDrift", {
      min: -2,
      max: 10
    }), mb.Int("offScale", {
      min: 0,
      max: 100
    })
  ], function(settings, context, data){
    var bitbangSourceData;
    if (rand() > settings.probability) {
      return;
    }
    bitbangSourceData = {
      width: data.width,
      height: data.height,
      data: new Uint8ClampedArray(data.data)
    };
    dfx.bitbang(data, bitbangSourceData, settings.offScale, settings.minStrideIn, settings.maxStrideIn, settings.minStrideOut, settings.maxStrideOut, settings.minFeedback, settings.maxFeedback, settings.minYDrift, settings.maxYDrift);
  });
  mb.Module("slicerep", [
    mb.Num("probability", {
      value: 1
    }), mb.Int("nMin", {
      min: 0,
      max: 32,
      value: 0
    }), mb.Int("nMax", {
      min: 0,
      max: 32,
      value: 5
    }), mb.Int("hMin", {
      min: 1,
      max: 128,
      value: 5
    }), mb.Int("hMax", {
      min: 1,
      max: 128,
      value: 8
    }), mb.Int("minRepeats", {
      min: 1,
      max: 128,
      value: 3
    }), mb.Int("maxRepeats", {
      min: 1,
      max: 128,
      value: 9
    })
  ], function(settings, context, data){
    var x, to$, h, r, y0;
    for (x = 0, to$ = randint(settings.nMin, settings.nMax); x < to$; ++x) {
      h = randint(settings.hMin, settings.hMax);
      r = randint(settings.minRepeats, settings.maxRepeats);
      y0 = randint(0, data.height - h);
      dfx.slicerep(data, y0, h, r);
    }
  });
  mb.Module("bloom", [
    mb.Num("strength"), mb.Int("radius", {
      min: 0,
      max: 10
    }), mb.Num("counter")
  ], function(settings, context, data){
    if (settings.radius > 0 && settings.strength > 0) {
      context.putImageData(data, 0, 0);
      cfx.bloom(context, settings.radius, settings.strength, settings.counter);
      data = context.getImageData(0, 0, data.width, data.height);
      return {
        data: data
      };
    }
  });
  mb.Module("tvsim", [
    mb.Bool("afterimageEnabled"), mb.Num("afterimageStrengthOut"), mb.Num("afterimageCounterOut"), mb.Num("afterimageStrengthIn"), mb.Num("scanlineStrength"), mb.Num("tvscanStrength"), mb.Num("tvscanSpeed"), mb.Num("tvscanHeight"), mb.Bool("displacementEnabled"), mb.Num("displacementStrength", {
      min: -50,
      max: 50
    })
  ], function(settings, context, data){
    var clock;
    if (settings.afterimageEnabled) {
      cfx.afterImage(context, data, settings.afterimageStrengthOut, settings.afterimageCounterOut, settings.afterimageStrengthIn);
    }
    if (settings.tvscanStrength) {
      clock = +new Date();
      dfx.tvscan(data, clock, settings.tvscanSpeed, settings.tvscanStrength, settings.tvscanHeight);
    }
    if (settings.scanlineStrength) {
      dfx.scanlines(data, 1.0 - settings.scanlineStrength);
    }
    if (settings.displacementEnabled) {
      if (!context.dismap) {
        context.dismap = dsp.createTVDisplacement();
      }
      data = dfx.displacementMapper(data, context.dismap, settings.displacementStrength, settings.displacementStrength);
    }
  });
  return {};
});