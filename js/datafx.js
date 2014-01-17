define("datafx", ["./utils"], function(utils){
  var lerper, lerp, randint, birandint, zwrap, rand, mmod, zclamp, scanlines, leak, bitbang, sliceoffset, sliceglitch, noise, toYcbcrMatrix, fromYcbcrMatrix, matrixXform, toYCbCr, fromYCbCr, tvscan, displacementMapper, slicerep;
  lerper = utils.lerper, lerp = utils.lerp, randint = utils.randint, birandint = utils.birandint, zwrap = utils.zwrap, rand = utils.rand, mmod = utils.mmod, zclamp = utils.zclamp;
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
  bitbang = function(outputData, inputData, offScale, minStrideIn, maxStrideIn, minStrideOut, maxStrideOut, minFeedback, maxFeedback, minYDrift, maxYDrift){
    var strideIn, strideOut, offIn, offOut, yDrift, feedback, fblerp, x0$, inp, inl, x1$, outp, outl, width, last, i, to$, ii, io, to1$;
    strideIn = randint(minStrideIn, maxStrideIn);
    strideOut = randint(minStrideOut, maxStrideOut);
    offIn = randint(-offScale, offScale);
    offOut = randint(-offScale, offScale);
    yDrift = randint(minYDrift, maxYDrift);
    feedback = randint(minFeedback, maxFeedback) / 20.0;
    fblerp = lerper(feedback);
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
        last = outp[io] = 0 | fblerp(last, inp[ii]);
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
  noise = function(arg$, y0, y1, noisiness, minBrightness, maxBrightness, replace){
    var data, width, y, yoff, x, offset, brightness;
    data = arg$.data, width = arg$.width;
    noisiness /= 100;
    if (replace) {
      minBrightness <= 0 || (minBrightness = 0);
      maxBrightness >= 255 || (maxBrightness = 255);
    }
    for (y = y0; y < y1; ++y) {
      yoff = y * width * 4;
      for (x = 0; x < width; ++x) {
        if (Math.random() < noisiness) {
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
  toYCbCr = function(imageData){
    matrixXform(imageData, toYcbcrMatrix);
  };
  fromYCbCr = function(imageData){
    matrixXform(imageData, fromYcbcrMatrix);
  };
  tvscan = function(arg$, clock, speed, strength, heightPerc){
    var data, width, height, mh, y1, y0, y, b, off, x;
    data = arg$.data, width = arg$.width, height = arg$.height;
    mh = 0 | height * heightPerc;
    y1 = mmod(clock * speed, height + mh);
    y0 = y1 - mh;
    for (y = 0; y < height; ++y) {
      if (y0 < y && y < y1) {
        b = Math.pow((y - y0) / mh, 2) * 255 * strength;
        if (b > 0) {
          off = y * width * 4;
          for (x = 0; x < width; ++x) {
            data[off++] += b;
            data[off++] += b;
            data[off++] += b;
            data[off++] += b;
          }
        }
      }
    }
  };
  displacementMapper = function(data, displacementMap, scaleX, scaleY){
    var width, height, x0$, x1$, displacementData, sourceBuf, destBuf, y, yoff, x, offset, disZ, disX, disY, sourceX, sourceY, sourceOffset;
    width = data.width, height = data.height;
    x0$ = document.createElement("canvas");
    x0$.width = width;
    x0$.height = height;
    x1$ = x0$.getContext("2d");
    x1$.drawImage(displacementMap, 0, 0, width, height);
    displacementData = x1$.getImageData(0, 0, width, height).data;
    sourceBuf = data.data;
    destBuf = new Uint8ClampedArray(data.data);
    if (scaleX != 0 || scaleY != 0) {
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
          destBuf[offset++] = sourceBuf[sourceOffset++];
          destBuf[offset++] = sourceBuf[sourceOffset++];
          destBuf[offset++] = sourceBuf[sourceOffset++];
        }
      }
    }
    sourceBuf.set(destBuf);
  };
  slicerep = function(data, startY, sliceHeight, repeats){
    var width, height, offsetStart, sliceLength, sourceSlice, writeOffset, rep;
    width = data.width, height = data.height;
    offsetStart = startY * width * 4;
    sliceLength = sliceHeight * width * 4;
    sourceSlice = new Uint8ClampedArray(data.data.buffer, offsetStart, sliceLength);
    writeOffset = offsetStart;
    for (rep = 1; rep < repeats; ++rep) {
      writeOffset = offsetStart + sliceLength * rep;
      if (writeOffset + sliceLength < data.data.length) {
        data.data.set(sourceSlice, writeOffset);
      }
    }
  };
  return {
    scanlines: scanlines,
    leak: leak,
    bitbang: bitbang,
    sliceoffset: sliceoffset,
    sliceglitch: sliceglitch,
    noise: noise,
    matrixXform: matrixXform,
    fromYCbCr: fromYCbCr,
    toYCbCr: toYCbCr,
    tvscan: tvscan,
    displacementMapper: displacementMapper,
    slicerep: slicerep
  };
});