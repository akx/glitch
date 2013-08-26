define("utils", [], function(){
  var lerp, lerperCache, lerper, zwrap, zclamp, randint, birandint, rand, mmod;
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
    min == null && (min = 0);
    max == null && (max = 1);
    return Math.random() * (max - min) + min;
  };
  mmod = function(a, b){
    if (a < 0) {
      a += (1 + 0 | a / -b) * b;
    }
    return 0 | a % b;
  };
  return {
    lerper: lerper,
    lerp: lerp,
    zwrap: zwrap,
    zclamp: zclamp,
    birandint: birandint,
    randint: randint,
    rand: rand,
    mmod: mmod
  };
});