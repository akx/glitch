define("contextfx", ["./utils", "./blend", "./StackBlur"], function(arg$, arg1$, arg2$){
  var zclamp, dataBlend, stackBlurImageData, bloom, afterImage;
  zclamp = arg$.zclamp;
  dataBlend = arg1$.dataBlend;
  stackBlurImageData = arg2$.stackBlurImageData;
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
  afterImage = function(context, data, strengthOut, counterOut, strengthIn){
    if (context.afterimageData) {
      dataBlend(context.afterimageData, data, strengthOut, counterOut, "screen");
    }
    if (context.afterimageData && strengthIn < 1) {
      dataBlend(data, context.afterimageData, strengthIn, 1.0 - strengthIn, "normal");
    } else {
      context.putImageData(data, 0, 0);
      context.afterimageData = context.getImageData(0, 0, data.width, data.height);
    }
  };
  return {
    bloom: bloom,
    afterImage: afterImage
  };
});