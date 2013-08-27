define("glitch", ["module_base", "fx_modules"], function(mb, modules){
  var settings, sizeChange, x0$, canvas, context, gui, x1$, fileInputDiv, x2$, fileInput, moduleOrder, perf, draw, wrapDraw, testDraw;
  settings = {
    width: 320,
    height: 240,
    scale: 2,
    mode: "block",
    image: null,
    fps: 30,
    stats: false,
    pause: false
  };
  sizeChange = function(){
    var width, height, ref$;
    width = canvas.width = 0 | settings.width;
    height = canvas.height = 0 | settings.height;
    ref$ = canvas.style;
    ref$.width = width * settings.scale;
    ref$.height = height * settings.scale;
  };
  x0$ = canvas = document.createElement("canvas");
  document.body.appendChild(x0$);
  context = x0$.getContext("2d");
  sizeChange();
  gui = new dat.GUI();
  gui.add(settings, "width", 32, 1024).onFinishChange(function(){
    sizeChange();
  });
  gui.add(settings, "height", 32, 1024).onFinishChange(function(){
    sizeChange();
  });
  gui.add(settings, "scale", 0, 3).onFinishChange(function(){
    sizeChange();
  });
  gui.add(settings, "mode", ['block', 'image']);
  gui.add(settings, "fps", 0, 60).step(1);
  gui.add(settings, "stats");
  gui.add(settings, "pause");
  mb.addModulesToGUI(gui);
  x1$ = fileInputDiv = document.createElement("div");
  x1$.innerHTML = "<h2>Choose custom image</h2>";
  document.body.appendChild(x1$);
  x2$ = fileInput = document.createElement("input");
  x2$.type = "file";
  x2$.addEventListener("change", function(e){
    var fileReader;
    fileReader = new FileReader();
    fileReader.onload = function(event){
      var src, ref$, x3$, image;
      if (src = (ref$ = event.target) != null ? ref$.result : void 8) {
        x3$ = image = document.createElement("img");
        x3$.src = src;
        x3$.onload = function(){
          settings.image = image;
          settings.mode = "image";
        };
      }
    };
    fileReader.readAsDataURL(e.target.files[0]);
  }, false);
  fileInputDiv.appendChild(x2$);
  moduleOrder = ['ycbcrPre', 'leaks', 'sliceglitch', 'noise', 'bitbang', 'bloom', 'ycbcrPost', 'tvsim'];
  perf = window.performance || {};
  perf.now = perf.now || perf.mozNow || perf.msNow || perf.oNow || perf.webkitNow || function(){
    return new Date().getTime();
  };
  draw = function(){
    var t, x, data, times, i$, ref$, len$, name, module, t0, moduleSettings, out, t1, y, len1$;
    if (settings.mode == "image" && settings.image) {
      context.drawImage(settings.image, 0, 0, canvas.width, canvas.height);
    } else {
      context.fillStyle = '#346434';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#FFAA00';
      t = +new Date() / 1000.0;
      x = (t * 150) % canvas.width;
      context.fillRect(x, 64, 115, 223);
    }
    data = context.getImageData(0, 0, canvas.width, canvas.height);
    times = [];
    for (i$ = 0, len$ = (ref$ = moduleOrder).length; i$ < len$; ++i$) {
      name = ref$[i$];
      if (module = mb.modules[name]) {
        t0 = perf.now();
        moduleSettings = mb.settings[name] || {};
        out = module.action(moduleSettings, context, data);
        data = (out != null ? out.data : void 8) || data;
        t1 = perf.now();
        times.push(name + ": " + Math.round(1 * (t1 - t0)));
      }
    }
    context.putImageData(data, 0, 0);
    if (settings.stats) {
      context.font = "7pt arial";
      context.fillStyle = "white";
      context.beginPath();
      for (y = 0, len1$ = times.length; y < len1$; ++y) {
        t = times[y];
        context.fillText(t, 5, 15 + y * 10);
      }
    }
  };
  wrapDraw = function(){
    if (settings.fps <= 0) {
      requestAnimationFrame(wrapDraw);
    } else {
      setTimeout(function(){
        wrapDraw();
      }, 1000 / settings.fps);
    }
    if (!settings.pause) {
      draw();
    }
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