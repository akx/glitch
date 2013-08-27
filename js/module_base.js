define("module_base", [], function(){
  var modules, settings, Module, addModulesToGUI, Num, Int, Bool;
  modules = {};
  settings = {};
  Module = function(name, params, action){
    modules[name] = {
      name: name,
      params: params,
      action: action
    };
  };
  addModulesToGUI = function(gui){
    var name, ref$, module, folder, ms, i$, ref1$, len$, param, x0$, that;
    for (name in ref$ = modules) {
      module = ref$[name];
      folder = gui.addFolder(name);
      ms = settings[name] || (settings[name] = {});
      for (i$ = 0, len$ = (ref1$ = module.params).length; i$ < len$; ++i$) {
        param = ref1$[i$];
        if (param.type == "num" || param.type == "int") {
          ms[param.name] = param.value || 0;
          x0$ = folder.add(ms, param.name, param.min, param.max);
          if (that = param.step) {
            x0$.step(that);
          }
          continue;
        }
        if (param.type == "bool") {
          ms[param.name] = !!(param.value || false);
          folder.add(ms, param.name);
          continue;
        }
      }
    }
  };
  Num = function(name, options){
    return import$({
      type: "num",
      name: name,
      min: 0,
      max: 1,
      step: null,
      value: 0
    }, options || {});
  };
  Int = function(name, options){
    return import$({
      type: "int",
      name: name,
      min: 0,
      max: 1,
      step: 1,
      value: 0
    }, options || {});
  };
  Bool = function(name, options){
    return {
      type: "bool",
      name: name,
      value: !!(options != null && options.value)
    };
  };
  return {
    modules: modules,
    settings: settings,
    Module: Module,
    Num: Num,
    Bool: Bool,
    Int: Int,
    addModulesToGUI: addModulesToGUI
  };
});
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}