var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        var y = cwd || '.';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = Object_keys(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

require.define = function (filename, fn) {
    var dirname = require._core[filename]
        ? ''
        : require.modules.path().dirname(filename)
    ;
    
    var require_ = function (file) {
        return require(file, dirname)
    };
    require_.resolve = function (name) {
        return require.resolve(name, dirname);
    };
    require_.modules = require.modules;
    require_.define = require.define;
    var module_ = { exports : {} };
    
    require.modules[filename] = function () {
        require.modules[filename]._cached = module_.exports;
        fn.call(
            module_.exports,
            require_,
            module_,
            module_.exports,
            dirname,
            filename
        );
        require.modules[filename]._cached = module_.exports;
        return module_.exports;
    };
};

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key)
    return res;
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = function (fn) {
    setTimeout(fn, 0);
};

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

require.define("path", function (require, module, exports, __dirname, __filename) {
    function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("/libs/bean.js", function (require, module, exports, __dirname, __filename) {
    /*!
  * bean.js - copyright Jacob Thornton 2011
  * https://github.com/fat/bean
  * MIT License
  * special thanks to:
  * dean edwards: http://dean.edwards.name/
  * dperini: https://github.com/dperini/nwevents
  * the entire mootools team: github.com/mootools/mootools-core
  */
!function (name, defon_addion) {
  if (typeof module != 'undefined') module.exports = defon_addion();
  else if (typeof define == 'function' && typeof define.amd  == 'object') define(defon_addion);
  else this[name] = defon_addion();
}('bean', function () {
  var win = window,
      __uid = 1,
      registry = {},
      collected = {},
      overOut = /over|out/,
      namespace = /[^\.]*(?=\..*)\.|.*/,
      stripName = /\..*/,
      addEvent = 'addEventListener',
      attachEvent = 'attachEvent',
      removeEvent = 'removeEventListener',
      detachEvent = 'detachEvent',
      doc = document || {},
      root = doc.documentElement || {},
      W3C_MODEL = root[addEvent],
      eventSupport = W3C_MODEL ? addEvent : attachEvent,

  isDescendant = function (parent, child) {
    var node = child.parentNode;
    while (node !== null) {
      if (node == parent) {
        return true;
      }
      node = node.parentNode;
    }
  },

  retrieveUid = function (obj, uid) {
    return (obj.__uid = uid && (uid + '::' + __uid++) || obj.__uid || __uid++);
  },

  retrieveEvents = function (element) {
    var uid = retrieveUid(element);
    return (registry[uid] = registry[uid] || {});
  },

  listener = W3C_MODEL ? function (element, type, fn, add) {
    element[add ? addEvent : removeEvent](type, fn, false);
  } : function (element, type, fn, add, custom) {
    if (custom && add && element['_on' + custom] === null) {
      element['_on' + custom] = 0;
    }
    element[add ? attachEvent : detachEvent]('on' + type, fn);
  },

  nativeHandler = function (element, fn, args) {
    return function (event) {
      event = fixEvent(event || ((this.ownerDocument || this.document || this).parentWindow || win).event);
      return fn.apply(element, [event].concat(args));
    };
  },

  customHandler = function (element, fn, type, condition, args) {
    return function (event) {
      if (condition ? condition.apply(this, arguments) : W3C_MODEL ? true : event && event.propertyName == '_on' + type || !event) {
        event = event ? fixEvent(event || ((this.ownerDocument || this.document || this).parentWindow || win).event) : null;
        fn.apply(element, Array.prototype.slice.call(arguments, event ? 0 : 1).concat(args));
      }
    };
  },

  addListener = function (element, orgType, fn, args) {
    var type = orgType.replace(stripName, ''),
        events = retrieveEvents(element),
        handlers = events[type] || (events[type] = {}),
        originalFn = fn,
        uid = retrieveUid(fn, orgType.replace(namespace, ''));
    if (handlers[uid]) {
      return element;
    }
    var custom = customEvents[type];
    if (custom) {
      fn = custom.condition ? customHandler(element, fn, type, custom.condition) : fn;
      type = custom.base || type;
    }
    var isNative = nativeEvents[type];
    fn = isNative ? nativeHandler(element, fn, args) : customHandler(element, fn, type, false, args);
    isNative = W3C_MODEL || isNative;
    if (type == 'unload') {
      var org = fn;
      fn = function () {
        removeListener(element, type, fn) && org();
      };
    }
    element[eventSupport] && listener(element, isNative ? type : 'propertychange', fn, true, !isNative && type);
    handlers[uid] = fn;
    fn.__uid = uid;
    fn.__originalFn = originalFn;
    return type == 'unload' ? element : (collected[retrieveUid(element)] = element);
  },

  removeListener = function (element, orgType, handler) {
    var uid, names, uids, i, events = retrieveEvents(element), type = orgType.replace(stripName, '');
    if (!events || !events[type]) {
      return element;
    }
    names = orgType.replace(namespace, '');
    uids = names ? names.split('.') : [handler.__uid];

    function destroyHandler(uid) {
      handler = events[type][uid];
      if (!handler) {
        return;
      }
      delete events[type][uid];
      if (element[eventSupport]) {
        type = customEvents[type] ? customEvents[type].base : type;
        var isNative = W3C_MODEL || nativeEvents[type];
        listener(element, isNative ? type : 'propertychange', handler, false, !isNative && type);
      }
    }

    destroyHandler(names); //get combos
    for (i = uids.length; i--; destroyHandler(uids[i])) {} //get singles

    return element;
  },

  del = function (selector, fn, $) {
    return function (e) {
      var array = typeof selector == 'string' ? $(selector, this) : selector;
      for (var target = e.target; target && target != this; target = target.parentNode) {
        for (var i = array.length; i--;) {
          if (array[i] == target) {
            return fn.apply(target, arguments);
          }
        }
      }
    };
  },

  add = function (element, events, fn, delfn, $) {
    if (typeof events == 'object' && !fn) {
      for (var type in events) {
        events.hasOwnProperty(type) && add(element, type, events[type]);
      }
    } else {
      var isDel = typeof fn == 'string', types = (isDel ? fn : events).split(' ');
      fn = isDel ? del(events, delfn, $) : fn;
      for (var i = types.length; i--;) {
        addListener(element, types[i], fn, Array.prototype.slice.call(arguments, isDel ? 4 : 3));
      }
    }
    return element;
  },

  remove = function (element, orgEvents, fn) {
    var k, m, type, events, i,
        isString = typeof(orgEvents) == 'string',
        names = isString && orgEvents.replace(namespace, ''),
        rm = removeListener,
        attached = retrieveEvents(element);
    names = names && names.split('.');
    if (isString && /\s/.test(orgEvents)) {
      orgEvents = orgEvents.split(' ');
      i = orgEvents.length - 1;
      while (remove(element, orgEvents[i]) && i--) {}
      return element;
    }
    events = isString ? orgEvents.replace(stripName, '') : orgEvents;
    if (!attached || names || (isString && !attached[events])) {
      for (k in attached) {
        if (attached.hasOwnProperty(k)) {
          for (i in attached[k]) {
            for (m = names.length; m--;) {
              attached[k].hasOwnProperty(i) && new RegExp('^' + names[m] + '::\\d*(\\..*)?$').test(i) && rm(element, [k, i].join('.'));
            }
          }
        }
      }
      return element;
    }
    if (typeof fn == 'function') {
      rm(element, events, fn);
    } else if (names) {
      rm(element, orgEvents);
    } else {
      rm = events ? rm : remove;
      type = isString && events;
      events = events ? (fn || attached[events] || events) : attached;
      for (k in events) {
        if (events.hasOwnProperty(k)) {
          rm(element, type || k, events[k]);
          delete events[k]; // remove unused leaf keys
        }
      }
    }
    return element;
  },

  fire = function (element, type, args) {
    var evt, k, i, m, types = type.split(' ');
    for (i = types.length; i--;) {
      type = types[i].replace(stripName, '');
      var isNative = nativeEvents[type],
          isNamespace = types[i].replace(namespace, ''),
          handlers = retrieveEvents(element)[type];
      if (isNamespace) {
        isNamespace = isNamespace.split('.');
        for (k = isNamespace.length; k--;) {
          for (m in handlers) {
            handlers.hasOwnProperty(m) && new RegExp('^' + isNamespace[k] + '::\\d*(\\..*)?$').test(m) && handlers[m].apply(element, [false].concat(args));
          }
        }
      } else if (!args && element[eventSupport]) {
        fireListener(isNative, type, element);
      } else {
        for (k in handlers) {
          handlers.hasOwnProperty(k) && handlers[k].apply(element, [false].concat(args));
        }
      }
    }
    return element;
  },

  fireListener = W3C_MODEL ? function (isNative, type, element) {
    evt = document.createEvent(isNative ? "HTMLEvents" : "UIEvents");
    evt[isNative ? 'on_addEvent' : 'on_addUIEvent'](type, true, true, win, 1);
    element.dispatchEvent(evt);
  } : function (isNative, type, element) {
    isNative ? element.fireEvent('on' + type, document.createEventObject()) : element['_on' + type]++;
  },

  clone = function (element, from, type) {
    var events = retrieveEvents(from), obj, k;
    var uid = retrieveUid(element);
    obj = type ? events[type] : events;
    for (k in obj) {
      obj.hasOwnProperty(k) && (type ? add : clone)(element, type || from, type ? obj[k].__originalFn : k);
    }
    return element;
  },

  fixEvent = function (e) {
    var result = {};
    if (!e) {
      return result;
    }
    var type = e.type, target = e.target || e.srcElement;
    result.preventDefault = fixEvent.preventDefault(e);
    result.stopPropagation = fixEvent.stopPropagation(e);
    result.target = target && target.nodeType == 3 ? target.parentNode : target;
    if (~type.indexOf('key')) {
      result.keyCode = e.which || e.keyCode;
    } else if ((/click|mouse|menu/i).test(type)) {
      result.rightClick = e.which == 3 || e.button == 2;
      result.pos = { x: 0, y: 0 };
      if (e.pageX || e.pageY) {
        result.clientX = e.pageX;
        result.clientY = e.pageY;
      } else if (e.clientX || e.clientY) {
        result.clientX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        result.clientY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
      }
      overOut.test(type) && (result.relatedTarget = e.relatedTarget || e[(type == 'mouseover' ? 'from' : 'to') + 'Element']);
    }
    for (var k in e) {
      if (!(k in result)) {
        result[k] = e[k];
      }
    }
    return result;
  };

  fixEvent.preventDefault = function (e) {
    return function () {
      if (e.preventDefault) {
        e.preventDefault();
      }
      else {
        e.returnValue = false;
      }
    };
  };

  fixEvent.stopPropagation = function (e) {
    return function () {
      if (e.stopPropagation) {
        e.stopPropagation();
      } else {
        e.cancelBubble = true;
      }
    };
  };

  var nativeEvents = { click: 1, dblclick: 1, mouseup: 1, mousedown: 1, contextmenu: 1, //mouse buttons
    mousewheel: 1, DOMMouseScroll: 1, //mouse wheel
    mouseover: 1, mouseout: 1, mousemove: 1, selectstart: 1, selectend: 1, //mouse movement
    keydown: 1, keypress: 1, keyup: 1, //keyboard
    orientationchange: 1, // mobile
    touchstart: 1, touchmove: 1, touchend: 1, touchcancel: 1, // touch
    gesturestart: 1, gesturechange: 1, gestureend: 1, // gesture
    focus: 1, blur: 1, change: 1, reset: 1, select: 1, submit: 1, //form elements
    load: 1, unload: 1, beforeunload: 1, resize: 1, move: 1, DOMContentLoaded: 1, readystatechange: 1, //window
    error: 1, abort: 1, scroll: 1 }; //misc

  function check(event) {
    var related = event.relatedTarget;
    if (!related) {
      return related === null;
    }
    return (related != this && related.prefix != 'xul' && !/document/.test(this.toString()) && !isDescendant(this, related));
  }

  var customEvents = {
    mouseenter: { base: 'mouseover', condition: check },
    mouseleave: { base: 'mouseout', condition: check },
    mousewheel: { base: /Firefox/.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel' }
  };

  var bean = { add: add, remove: remove, clone: clone, fire: fire };

  var clean = function (el) {
    var uid = remove(el).__uid;
    if (uid) {
      delete collected[uid];
      delete registry[uid];
    }
  };

  if (win[attachEvent]) {
    add(win, 'unload', function () {
      for (var k in collected) {
        collected.hasOwnProperty(k) && clean(collected[k]);
      }
      win.CollectGarbage && CollectGarbage();
    });
  }

  bean.noConflict = function () {
    context.bean = old;
    return this;
  };

  return bean;
});

});

require.define("/libs/flywheel.js", function (require, module, exports, __dirname, __filename) {
    // polyfill for requestAnimationFrame
var frame = function () {
    return window.requestAnimationFrame  ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      window.oRequestAnimationFrame      ||
      window.msRequestAnimationFrame     ||
      function ($callback) {
        window.setTimeout(function () {
          $callback(+new Date())
        }, 10)
      }
  }()

, flywheel = function($callback, $framerate_cap){
    
    // 'private attr'
    var _max_frame_duration,
        _last_spin_timestamp = +new Date(),
        _continue_spinning_flywheel = false,
        _step_by = 1000/60,
        _return_obj,
        
    // 'private methods'
        _set_max_frame_duration_by_framerate_cap = function(framerate_cap){
             _max_frame_duration = 1000/framerate_cap
        },
        _spin_flywheel = function spin(timestamp){
            var time_delta = timestamp - _last_spin_timestamp,
                capped_time_delta


            // cap the framerate
            ;( time_delta < _max_frame_duration )? capped_time_delta = time_delta
            : capped_time_delta = _max_frame_duration

            // call the callback
            $callback(capped_time_delta, _last_spin_timestamp + capped_time_delta, _return_obj)

            _last_spin_timestamp += capped_time_delta
            
            // set up the next spin
            if ( _continue_spinning_flywheel ) frame(function(timestamp){
                spin(timestamp)
            })

        }

    // convert the given framerate cap to a duration
    if ( $framerate_cap !== undefined ) _set_max_frame_duration_by_framerate_cap($framerate_cap)
    else _max_frame_duration = 1000/30


    // return an API object, to let users manipulate the loop
    return _return_obj = {
        
        start: function(){
            _continue_spinning_flywheel = true
            _spin_flywheel()
            return this
        },
        
        stop: function(){
            _continue_spinning_flywheel = false
            return this
        },
        
        step: function(fake_time_delta){
            // step abuses the fact that _spin_flywheel(undefined) means $callback's time_delta = _max_frame_duration
            var cache_max_frame_duration = _max_frame_duration
                            
            if ( fake_time_delta !== undefined ) _max_frame_duration = fake_time_delta
            else _max_frame_duration = _step_by
            
            _continue_spinning_flywheel = false
            _spin_flywheel()
            
            // re-instate intial _step_by value
             _max_frame_duration = cache_max_frame_duration
            
            return this                     
        },
        
        set_callback: function(callback){
            $callback = callback
            return this
        },

        set_framerate_cap: function(framerate_cap){
            _set_max_frame_duration_by_framerate_cap(framerate_cap)
            return this
        }
    
    }
}

module.exports = flywheel

});

require.define("/libs/load_images.js", function (require, module, exports, __dirname, __filename) {
    function load_images(image_object, callback){
    var to_load = 0,
        images

    if ( image_object instanceof Array ) images = []
    else images = {}
    
    function on_load(){
        to_load -= 1
        if ( to_load == 0 && callback ) callback(images)
    }
    
    function on_error(){
    
    }

    function load(key, val){
        var image = new Image()
        to_load += 1
        image.src = val
        image.onload = on_load
        images[key] = image
    }

    for ( var prop in image_object ){
        load(prop, image_object[prop])   
    }

}

module.exports = load_images

});

require.define("/libs/anew.js", function (require, module, exports, __dirname, __filename) {
    void function(root){

    var get_proto = Object.getPrototypeOf,
        has_own_prop = Function.prototype.call.bind(Object.prototype.hasOwnProperty)
    

    function anew(proto, object){
        
        // defaults 
        if ( proto === undefined ) proto = {}
        if ( object === undefined ) object = {}

        // logic
        var return_object = Object.create(proto)
        
        mixin_object(return_object, object)
        if ( proto instanceof Object ) call_proto_constructors(return_object)
        if ( has_own_prop(return_object, "constructor") ) return_object["constructor"]()
        
        return return_object

        // helpers 
        function mixin_object(to, from){
            
            Object.keys(from).forEach(copy_key_val)
            
            function copy_key_val(key){
                to[key] = from[key] 
            }
        
        }
        

        function call_proto_constructors(object, proto){
            
            if ( !proto ) proto = get_proto(object)
            
            if ( proto === Object.prototype ) return
            else call_proto_constructors(object, get_proto(proto)) 
            
            // apply while falling from stack 
            if ( proto["constructor"] ) proto["constructor"].call(object)
        }
    }
    
    // export
    if ( typeof module !== "undefined" && module.exports ) 
        module.exports = anew
    else 
        root["anew"] = anew

}(this)

});

require.define("/game.js", function (require, module, exports, __dirname, __filename) {
    var entity_md = require("./libs/entity_md"),
    anew = require("./libs/anew")

var game = anew(entity_md, {

    // add game objects to all added objects
    // and call their on_add handler
    add: function(object){
        entity_md.add.apply(this, arguments)
        object.game = this
        if ( object.on_add ) object.on_add()
    },
    
    check_entity_collision: function(){
    },

    update_entities: function(time_delta){
        this._entities.forEach(function(e){
            if ( e.update ) e.update(time_delta)
        })
    },
    
    draw_entities: function(){
        var context = this.context,
            canvas = context.canvas,
            images = this.images

        context.clearRect(0, 0, canvas.width, canvas.height)

        this._entities.forEach(function(e){
            if ( e.image ) context.drawImage(images[e.image], ~~e.x, ~~e.y, ~~e.width, ~~e.height)
            if ( e.draw ) e.draw(context)
        })
    },

    move_entities: function(time_delta){
        
        this._entities.forEach(move_entity)
        
        function move_entity(entity){
            
            if ( !entity.vel ) return
            if ( entity.apply_physics == false ) return 
            
            if ( !entity.momentum ) 
                entity.momentum = { x: 0, y: 0 }
    
            var old_x = entity.x,
                old_y = entity.y
 
            console.log(entity.momentum.x, entity.momentum.y)
            // apply 
            entity.x += entity.momentum.x * time_delta
            entity.y += entity.momentum.y * time_delta

            // apply vel
            entity.x += time_delta * Math.sin(entity.vel.direction) * entity.vel.speed
            entity.y += time_delta * Math.cos(entity.vel.direction) * entity.vel.speed
            
            // store momentum
            entity.momentum.x = (((entity.x - old_x)) * entity.slipperiness) / time_delta
            entity.momentum.y = (((entity.y - old_y)) * entity.slipperiness) / time_delta 
            // wipe vel
            entity.vel.direction = 0
            entity.vel.speed = 0
        }
    }
})

module.exports = game

});

require.define("/libs/entity_md.js", function (require, module, exports, __dirname, __filename) {
    void function(root){

   // main controlling object
    var entity_md = {
        
        // ctor and attrs
        constructor: function(){
            this._entities = []
        },
        _entities_modified: false,
    
//----------------------------------------------------------//
//              OBJECT TRACKING METHODS
//----------------------------------------------------------//
    
        add: function(object){
            // store
            this._entities.push(object)
            this._entities_modified = true
            return object
        },
                
        remove: function(object){
            var index = this._entities.indexOf(object)
            if ( index >= 0 ){
                this._entities.splice(index, 1)      
                this._entities_modified = true                      
            }
        },
        
        remove_all: function(){
            this._entities = []
        },
        
        find_instances: function(ctor, obj_set){
            var objs = obj_set || this._entities

            return objs.filter(function(o){
                return o instanceof ctor        
            })
        },
        
        find_nearest: function(reference_object, obj_set){
            var objs = obj_set || this._entities,
                nearest_obj, nearest_distance
            
            objs.forEach(function(o){
                var diffx = Math.abs(reference_object.x - o.x),
                    diffy = Math.abs(reference_object.y - o.y),
                    distance = diffy*diffy + diffx*diffx
                    
                if ( nearest_distance === undefined ){    
                    nearest_distance = distance
                    nearest_obj = o
                } else if ( nearest_distance > distance ){
                    nearest_distance = distance
                    nearest_obj = o
                }
            })

            return nearest_obj
        },

        find_by_attr: function(attr_object, object_set){
            var search_in = object_set || this._entities,
                objects

            function check_attrs(attr_object, object){
                var success = false
                Object.keys(attr_object).forEach(function(key){
                    if ( object[key] == attr_object[key] ) success = true
                })
                return success
            }

            objects = search_in.filter(function(object){
                return check_attrs(attr_object, object)
            })
            
            return objects
        }
    };

    entity_md.constructor()

    if (typeof module !== 'undefined' && module.exports) 
        module["exports"] = entity_md
    else 
        root["entity_md"] = entity_md

}(this)

});

require.define("/entities/player.js", function (require, module, exports, __dirname, __filename) {
    var anew = require("../libs/anew"),
    weapons = require("./player_weapons")

var player = anew({
    
    constructor: function(){
        this.vel = {
            direction: 0,
            speed: 0
        }
    },
    game: undefined,
    x: 150,
    y: 500,
    width: 50,
    height: 60,

    speed: 0.3,
    max_speed: 0.3,

    slipperiness: 0.8,
    weapon: weapons.standard, 

    draw: function(context){
        context.fillStyle = "#eee"
        context.fillRect(this.x, this.y, this.width, this.height)
    },

    // --- UPDATE STUFF --- //
    update: function(td){
       
        // actions
        this._firing()
        this._flying()
    },

    // --- UPDATE HELPERS --- //
    
    _firing: function(){
        
        if ( !this.game.input.fire ) return 

        var bullet = anew(this.weapon)
        bullet.x = this.x + (bullet.offset.x * this.width ) - (bullet.width / 2)
        bullet.y = this.y + (bullet.offset.y * this.height ) - (bullet.height / 2)
        
        this.game.add(bullet)
    },
    
    _flying: function(){
        var input = this.game.input,
            pi = Math.PI,
            updown_p    = input.up || input.down
            leftright_p = input.left || input.right
        
        // single button
        if ( input.up && !leftright_p ) this._set_vel(pi, this.speed)
        if ( input.down && !leftright_p ) this._set_vel(0, this.speed)
        if ( input.right && !updown_p ) this._set_vel(pi/2, this.speed)
        if ( input.left && !updown_p ) this._set_vel(pi * 1.5, this.speed)
        

        // diagonal 
        if ( input.up && input.right ) this._set_vel(pi * 0.75, this.speed)
        if ( input.up && input.left ) this._set_vel(pi * 1.25, this.speed)
    
        if ( input.down && input.left ) this._set_vel(pi * 1.75, this.speed)
        if ( input.down && input.right ) this._set_vel(pi * 0.25, this.speed)
    }, 

    _set_vel: function(direction, speed){
        this.vel.direction = direction
        this.vel.speed = speed
    }
    

})


module.exports = player

});

require.define("/entities/player_weapons.js", function (require, module, exports, __dirname, __filename) {
    var anew = require("../libs/anew")

var standard = anew({}, {

    constructor: function(){
        this.offset = {x: 0.5, y: 0}
    },

    image: "weapon_standard",
    x: 0,
    y: 0,
    width: 10,
    height: 20,
    speed: 0.2,
    
    update: function(td){
        this.y -= this.speed * td

        if ( this.y < -100 ) this.game.remove(this)
    }

})



//exports

module.exports = {
    standard: standard
}

});

require.define("/main.js", function (require, module, exports, __dirname, __filename) {
    var bean = require('./libs/bean'),
    flywheel = require('./libs/flywheel'),
    load_images = require('./libs/load_images'),
    anew = require("./libs/anew")

var game = require('./game')

/* GAME SETUP */

void function setup_canvas(){
    game.canvas = document.getElementById("main_canvas"),
    game.context = game.canvas.getContext("2d")
}()

void function setup_input(){
    var input = {
        
        left: false,
        right: false,
        up: false,
        down: false,
        fire: false,
    }

 
    // get controls
    bean.add(document, 'keydown', function(e){
        var k = e.which
        
        if (  k == 37) 
            input.left = true
        else if ( k == 39) 
            input.right = true
        else if ( k == 38)
            input.up = true
        else if ( k == 40)
            input.down = true
        else if ( k == 88 )
            input.fire = true

        // disable up, down and space for scrolling
        if ( k == 38 || k == 40 || k == 32 ) e.preventDefault()
    })

    bean.add(document, 'keyup', function(e){
        var k = e.which
       
        if (  k == 37) 
            input.left = false
        else if ( k == 39) 
            input.right = false
        else if ( k == 38)
            input.up = false
        else if ( k == 40)
            input.down = false
        else if ( k == 88 )
            input.fire = false

    })

    game.input = input

}()

void function get_image(){

    var images = {
    
        weapon_standard: "images/weapon_standard_v2.png"
    
    }
    
    load_images(images, function(images){
        game.images = images
        start_game()
    })
}()


function start_game(){
    
    // add first entities
    var player = require("./entities/player")

    game.add(anew(player))
   
    // spin
    flywheel(function(time_delta, time_stamp){
        
        game.move_entities(time_delta)
        game.check_entity_collision()
        game.update_entities(time_delta, time_stamp)
        game.draw_entities()
    
    }).start()

}

});
require("/main.js");
