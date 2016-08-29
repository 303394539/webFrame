DEBUG && console.time('core');;
(function(global, factory) {

  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = global.document ?
      factory(global, true) :
      function(w) {
        if (!w.document) {
          throw new Error("Baic requires a window with a document");
        }
        return factory(w);
      };
  } else {
    factory(global);
  }

}(typeof window !== "undefined" ? window : this, function(window, noGlobal) {
  'use strict';
  var document = window.document,
    OBJECT_PROTOTYPE = Object.prototype,
    ARRAY_PROTOTYPE = Array.prototype,
    FUNCTION_PROTOTYPE = Function.prototype,
    STRING_PROTOTYPE = String.prototype,
    NUMBER_PROTOTYPE = Number.prototype,
    EXP_TYPE = /\s([a-z|A-Z]+)/,
    Baic = function(selector, children) {
      return _init(selector, children);
    };

  function _init(selector, children) {
    if (!selector) {
      return B();
    } else if (selector.isB && Baic.isUndefined(children)) {
      return selector;
    } else if (Baic.isFunction(selector)) {
      Baic.ready(selector);
    } else {
      return B(Baic.getDOMObject(selector, children), selector);
    }
  }

  var B = function(dom, selector) {
    dom = dom || [];
    dom.__proto__ = B.prototype;
    dom.selector = selector || "";
    return dom;
  };

  Baic.fn = B.prototype = {
    isB: true,
    version: "1.0.0",
    constructor: Baic,
    selector: "",
    length: 0,
    indexOf: ARRAY_PROTOTYPE.indexOf,
    forEach: ARRAY_PROTOTYPE.forEach,
    map: ARRAY_PROTOTYPE.map,
    filter: ARRAY_PROTOTYPE.filter
  };

  Baic.extend = function() {
    var options, name, src, copy, copyIsArray, clone,
      target = arguments[0] || {},
      i = 1,
      length = arguments.length,
      deep = false;

    if (typeof target === "boolean") {
      deep = target;

      target = arguments[i] || {};
      i++;
    }

    if (typeof target !== "object" && !Baic.isFunction(target)) {
      target = {};
    }

    if (i === length) {
      target = this;
      i--;
    }

    for (; i < length; i++) {
      if ((options = arguments[i]) != null) {
        for (name in options) {
          src = target[name];
          copy = options[name];

          if (target === copy) {
            continue;
          }

          if (deep && copy && (Baic.isPlainObject(copy) || (copyIsArray = Baic.isArray(copy)))) {
            if (copyIsArray) {
              copyIsArray = false;
              clone = src && Baic.isArray(src) ? src : [];

            } else {
              clone = src && Baic.isPlainObject(src) ? src : {};
            }

            target[name] = Baic.extend(deep, clone, copy);

          } else if (copy !== undefined) {
            target[name] = copy;
          }
        }
      }
    }

    return target;
  }

  Baic.extend(OBJECT_PROTOTYPE, {
    forEach: function(fn, scope) {
      if (Baic.isArray(this)) {
        ARRAY_PROTOTYPE.forEach.apply(this, arguments);
      } else {
        for (var key in this)
          if (Baic.hasOwn(this, key)) {
            fn.call(scope, this[key], key, this);
          }
      }
    },
    map: function(fn, scope) {
      if (Baic.isArray(this)) {
        return ARRAY_PROTOTYPE.map.apply(this, arguments);
      } else {
        var result = {};
        this.forEach(function(value, key, object) {
          result[key] = fn.call(scope, value, key, object);
        });
        return result;
      }
    },
    toArray: function(begin, end) {
      return ARRAY_PROTOTYPE.slice.call(this, begin, end);
    },
    toStr: function(type) {
      try {
        return Baic.isString(this) ? this : this === true ? "yes" : this === false ? "no" : JSON.stringify(this);
      } catch (e) {
        return this;
      }
    },
    flatten: function() {
      return this.length ? [].concat.apply([], this) : this;
    },
    getGlobalVariable: function(){
      var self = this;
      var iframe = document.createElement('iframe');
      iframe.style.display = "none";
      iframe.onload = function() {
        var iframeKeys = Object.keys(iframe.contentWindow);
        var keys = [];
        Object.keys(self).forEach(function(key) {
          if(!(key in iframeKeys)) {
            keys.push(key)
          }
        });
        iframe.remove();
        self.__globalVariable__ = keys;
      };
      iframe.src = 'about:blank';
      document.body.appendChild(iframe);
      return self.__globalVariable__;
    }
  });

  Baic.extend({
    nop: function() {},
    hasOwn: function(object, property) {
      return OBJECT_PROTOTYPE.hasOwnProperty.call(object, property);
    },
    type: function(obj) {
      return OBJECT_PROTOTYPE.toString.call(obj).match(EXP_TYPE)[1].toLowerCase();
    },
    isFunction: _checktype("function"),
    isString: _checktype("string"),
    isBoolean: _checktype("boolean"),
    isArray: Array.isArray,
    isNumber: _checktype("number", function(obj) {
      return !isNaN(obj);
    }),
    isNull: _checktype("null"),
    isWindow: function(obj) {
      return obj != null && obj === obj.window;
    },
    isUndefined: _checktype("undefined"),
    isObject: _checktype("object"),
    isPlainObject: function(obj) {
      if (Baic.type(obj) !== "object" || obj.nodeType || Baic.isWindow(obj)) {
        return false;
      }

      if (obj.constructor &&
        !Baic.hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
        return false;
      }

      return true;
    },
    isJSON: function(obj) {
      return Baic.isObject(obj) && !obj.length;
    },
    parseJSON: function(obj) {
      return JSON.parse(obj + "");
    },
    getWindow: function(obj) {
      return Baic.isWindow(obj) ? obj : obj.nodeType === 9 && obj.defaultView;
    },
    ready: function(callback) {
      if (!Baic.isFunction(callback)) return;
      if (/complete|loaded|interactive/.test(document.readyState) && document.body) callback(Baic);
      else document.addEventListener('DOMContentLoaded', function() {
        callback($)
      }, false);
    },
    random: function(min, max) {
      var rand = Math.floor(min + Math.random() * (max - min));
      rand = isNaN(rand) ? (function(a, b) {
        !$.isUndefined(b) || (b = a, a = 0);
        var c = b - a,
          e = Math.random();
        return a + e * c | 0
      })(min || 9999999) : rand;
      return rand;
    }
  });

  function _checktype(type) {
    var args = arguments.toArray(1);
    return function(obj) {
      var bool = true;
      if (args.length) args.forEach(function(item) {
        if (!bool) return;
        if (Baic.isFunction(item)) {
          bool = item(obj);
        } else {
          bool = item;
        }
      });
      return Baic.type(obj) === type && bool;
    }
  }

  Baic.extend(FUNCTION_PROTOTYPE, {
    bind: function(scope) {
      var method = this;
      var args = arguments.toArray(1);
      return function() {
        return method.apply(scope, args.concat(arguments.toArray()));
      };
    },
    defer: function() {
      return this._job = setTimeout.apply(null, [this].concat(arguments.toArray()));
    },
    cycle: function() {
      return this._cycle = setInterval.apply(null, [this].concat(arguments.toArray()));
    },
    cancel: function(type) {
      type = type || 1;
      if (this._job && type === 1) {
        clearTimeout(this._job);
      } else if (this._cycle && type === 2) {
        clearInterval(this._cycle);
      }
    }
  });

  Baic.extend(STRING_PROTOTYPE, {
    parseJSON: function() {
      return Baic.parseJSON(this);
    },
    firstUpperCase: function() {
      return this.replace(/\b(\w)|\s(\w)/g, function(m) {
        return m.toUpperCase();
      });
    },
    firstLowerCase: function() {
      return this.replace(/\b(\w)|\s(\w)/g, function(m) {
        return m.toLowerCase();
      });
    },
    trim: function() {
      return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
    }
  });

  Baic.extend(Number, {
    add: function(arg1, arg2) {
      arg1 = arg1 || 0;
      arg2 = arg2 || 0;
      var r1, r2, m, c;
      try {
        r1 = arg1.toString().split(".")[1].length;
      } catch (e) {
        r1 = 0;
      }
      try {
        r2 = arg2.toString().split(".")[1].length;
      } catch (e) {
        r2 = 0;
      }
      c = Math.abs(r1 - r2);
      m = Math.pow(10, Math.max(r1, r2));
      if (c > 0) {
        var cm = Math.pow(10, c);
        if (r1 > r2) {
          arg1 = Number(arg1.toString().replace(".", ""));
          arg2 = Number(arg2.toString().replace(".", "")) * cm;
        } else {
          arg1 = Number(arg1.toString().replace(".", "")) * cm;
          arg2 = Number(arg2.toString().replace(".", ""));
        }
      } else {
        arg1 = Number(arg1.toString().replace(".", ""));
        arg2 = Number(arg2.toString().replace(".", ""));
      }
      return (arg1 + arg2) / m;
    },
    sub: function(arg1, arg2) {
      arg1 = arg1 || 0;
      arg2 = arg2 || 0;
      var r1, r2, m, n;
      try {
        r1 = arg1.toString().split(".")[1].length;
      } catch (e) {
        r1 = 0;
      }
      try {
        r2 = arg2.toString().split(".")[1].length;
      } catch (e) {
        r2 = 0;
      }
      m = Math.pow(10, Math.max(r1, r2)); //last modify by deeka //动态控制精度长度
      n = (r1 >= r2) ? r1 : r2;
      return ((arg1 * m - arg2 * m) / m).toFixed(n);
    },
    mul: function(arg1, arg2) {
      arg1 = arg1 || 0;
      arg2 = arg2 || 0;
      var m = 0,
        s1 = arg1.toString(),
        s2 = arg2.toString();
      try {
        m += s1.split(".")[1].length;
      } catch (e) {}
      try {
        m += s2.split(".")[1].length;
      } catch (e) {}
      return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m);
    },
    div: function(arg1, arg2) {
      arg1 = arg1 || 0;
      arg2 = arg2 || 0;
      var t1 = 0,
        t2 = 0,
        r1, r2;
      try {
        t1 = arg1.toString().split(".")[1].length;
      } catch (e) {}
      try {
        t2 = arg2.toString().split(".")[1].length;
      } catch (e) {}
      r1 = Number(arg1.toString().replace(".", ""));
      r2 = Number(arg2.toString().replace(".", ""));
      return (r1 / r2) * Math.pow(10, t2 - t1);
    }
  });

  Baic.extend(NUMBER_PROTOTYPE, {
    cancel: function(type) {
      type = type || 1;
      if (this) {
        if (type === 1) {
          clearTimeout(this);
        } else if (type === 2) {
          clearInterval(this);
        }
      }
    },
    add: function(num) {
      return Number.add.call(this, this, num);
    },
    sub: function(num) {
      return Number.sub.call(this, this, num);
    },
    mul: function(num) {
      return Number.mul.call(this, this, num);
    },
    div: function(num) {
      return Number.div.call(this, this, num);
    }
  });

  if (typeof define === "function" && define.amd) {
    define("Baic", [], function() {
      return Baic;
    });
  }

  if (typeof noGlobal === "undefined") {
    window.Baic = window.$ = Baic;
  }

  return Baic;

}));
DEBUG && console.timeEnd('core');