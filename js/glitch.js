define("glitch", ["module_base", "fx_modules"], function(mb, modules){
  var width, height, scale, sizeChange, x0$, canvas, context, gui, moduleOrder, perf, draw, wrapDraw, testDraw;
  width = height = 0;
  scale = 2;
  sizeChange = function(){
    var ref$;
    width = canvas.width = 320;
    height = canvas.height = 240;
    ref$ = canvas.style;
    ref$.width = width * scale;
    ref$.height = height * scale;
  };
  x0$ = canvas = document.createElement("canvas");
  document.body.appendChild(x0$);
  context = x0$.getContext("2d");
  sizeChange();
  gui = new dat.GUI();
  mb.addModulesToGUI(gui);
  moduleOrder = ['ycbcrPre', 'leaks', 'sliceglitch', 'noise', 'bitbang', 'bloom', 'ycbcrPost', 'tvsim'];
  perf = window.performance || {};
  perf.now = perf.now || perf.mozNow || perf.msNow || perf.oNow || perf.webkitNow || function(){
    return new Date().getTime();
  };
  draw = function(){
    var t, x, data, times, i$, ref$, len$, name, module, t0, settings, out, t1, y, len1$;
    context.fillStyle = '#346434';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#FFAA00';
    t = +new Date() / 1000.0;
    x = (t * 150) % canvas.width;
    context.fillRect(x, 64, 115, 223);
    data = context.getImageData(0, 0, canvas.width, canvas.height);
    times = [];
    for (i$ = 0, len$ = (ref$ = moduleOrder).length; i$ < len$; ++i$) {
      name = ref$[i$];
      if (module = mb.modules[name]) {
        t0 = perf.now();
        settings = mb.settings[name] || {};
        out = module.action(settings, context, data);
        data = (out != null ? out.data : void 8) || data;
        t1 = perf.now();
        times.push(name + ": " + Math.round(1 * (t1 - t0)));
      }
    }
    context.putImageData(data, 0, 0);
    context.font = "7pt arial";
    context.fillStyle = "white";
    context.beginPath();
    for (y = 0, len1$ = times.length; y < len1$; ++y) {
      t = times[y];
      context.fillText(t, 5, 15 + y * 10);
    }
  };
  wrapDraw = function(){
    requestAnimationFrame(wrapDraw);
    draw();
  };
  window.testDraw = testDraw = function(){
    var x;
    console.time("draw");
    for (x = 0; x < 100; ++x) {
      draw();
    }
    console.timeEnd("draw");
  };
  wrapDraw();
});