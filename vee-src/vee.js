typeof DEBUG === 'undefined' && (DEBUG = 1);

DEBUG && console.time('core');
(function(global) {
  'use strict';
  
  var EMPTY_ARRAY = [];
  var EMPTY_FUNCTION = function(){};
  var OBJECT_PROTOTYPE = Object.prototype;
  var ARRAY_PROTOTYPE = Array.prototype;
  var EXP_TYPE = /\s([a-z|A-Z]+)/;
  
  // Constructor
  var v = function(selector, children) {
    if (!selector) {
      return Q();
    } else if (selector.isQ && !_defined(children)) {
      return selector;
    } else if (v.isFunction(selector)) {
      return v.require(selector);
    } else {
      return Q(v.getDOMObject(selector, children), selector);
    }
  };
  
  // DOM Wrapper
  var Q = function(dom, selector) {
    dom = dom || EMPTY_ARRAY;
    dom.__proto__ = Q.prototype;
    dom.selector = selector || '';
    return dom;
  };
  
  Q.prototype = v.fn = {
    isQ: 1,
    indexOf: ARRAY_PROTOTYPE.indexOf,
    forEach: ARRAY_PROTOTYPE.forEach,
    map: ARRAY_PROTOTYPE.map,
    filter: ARRAY_PROTOTYPE.filter
  };
  
  // Extend Object Object
  _mixin(Object.prototype, {
    forEach: function(fn, scope) {
      if (Array.isArray(this)) {
        ARRAY_PROTOTYPE.forEach.apply(this, arguments);
      } else {
        for (var key in this) if (_hasOwnProperty(this, key)) {
          fn.call(scope, this[key], key, this);
        }
      }
    },
    map: function(fn, scope) {
      if (Array.isArray(this)) {
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
    }
  });
  
  // Extend Function Object
  _mixin(Function.prototype, {
    bind: function(scope) {
      var method = this;
      var args = arguments.toArray(1);
      return function() {
        return method.apply(scope, args.concat(arguments.toArray()));
      };
    },

    defer: function(millis) {
      return this._job = setTimeout.apply(null, 
                                          [this].concat(arguments.toArray()));
    },
    
    cancel: function() {
      if (this._job) {
        clearTimeout(this._job);
      }
    },

    buffer: function(millis) {
      this.cancel();
      return this.defer.apply(this, arguments);
    }
  });
  
  // Globle Methons
  _mixin(v, {
    G: global,
    
    nop: EMPTY_FUNCTION,
    mixin: _mixin,
    
    defined: _defined,
    own: _hasOwnProperty,
    type: _type,
    isString: _checkType('string'),
    isFunction: _checkType('function'),
    isObject: _checkType('object'),
    isNumber: function(obj) {
      return _type(obj) === 'number' && !isNaN(obj);
    },
    
    // namespace: function(name, context) {
    //   var parts = name.split(".");
    //   var obj = context || global;
    //   var i = 0;
    //   var p;
    //   while (obj && (p = parts[i++])) {
    //     obj = p in obj ? obj[p] : (obj[p] = {});
    //   }
    //   return obj;
    // },
  });
  
  // OOP
  Array.extend = Object.extend = _extendClass;
  
  
  window.vee = window.v = v;
  '$' in window || (window.$ = v);
  
  
  function _type(obj) {
    return OBJECT_PROTOTYPE.toString.call(obj).match(EXP_TYPE)[1].toLowerCase();
  }
  
  function _checkType(type) {
    return function(obj) {
      return _type(obj) === type;
    };
  }
  
  function _defined(obj) {
    return typeof obj !== 'undefined';
  }
  
  function _hasOwnProperty(object, property) {
    return OBJECT_PROTOTYPE.hasOwnProperty.call(object, property);
  }
  
  function _mixin(target) {
    var args = arguments;
    var len = args.length;
    var i = 1;
    var overwrite, source, name;
    
    target = target || {};
    
    if (len > 1) {
      if (typeof args[len-1] === 'boolean') {
        overwrite = args[--len];
      }
        
      while (i < len) {
        source = args[i++]; 
        for (name in source) {
          if (_hasOwnProperty(source, name) && _defined(source[name]) && 
              (overwrite || !_defined(target[name]))) {
            target[name] = source[name];
          }
        }
      }
    }
    
    return target;
  }
  
  function _extendClass(obj) {
    var newClass = function() {
      if (this.__needsinit__) {
        this.init.apply(this, arguments);
      }
    };
    
    var prototype = _createInstanceWithoutInit(this);
    
    (v.isFunction(obj) ? obj() : obj).forEach(function(value, name) {
      switch (name) {
        case 'super':
        case '__class__':
        case '__needsinit__':
          // protect common properties and methods
          break;
        
        case 'statics':
          _mixin(newClass, value);
          break;
          
        default:
          prototype[name] = value;
      }
    });
    
    prototype.__class__ = prototype.constructor = newClass;
    prototype.super = _superMethod;
    prototype.init = prototype.init || EMPTY_FUNCTION;
    
    newClass.prototype = prototype;
    newClass.__superclass__ = this;
    newClass.extend = _extendClass;
    newClass.create = _createInstance;
    
    return newClass;
  }
  
  function _superMethod(name, args) {
    var thisClass = this.__class__;
    var superClass = thisClass.__superclass__;
    
    var thisMethod = thisClass.prototype[name];
    var superMethod = superClass.prototype[name];
    
    var result;
    
    if (v.isFunction(superMethod)) {
      this.__class__ = superClass;
      thisMethod._supercalled = true;
      result = superMethod._supercalled ? this.super(name, args)
                                        : superMethod.apply(this, args);
      delete thisMethod._supercalled;
      this.__class__ = thisClass;
    }
    
    return result;
  }
  
  function _createInstance() {
    var obj = _createInstanceWithoutInit(this);
    obj.init.apply(obj, arguments);
    return obj;
  }
  
  function _createInstanceWithoutInit(cls) {
    var obj;
    var prototype = cls.prototype;
    prototype.__needsinit__ = 0;
    obj = new cls;
    prototype.__needsinit__ = 1;
    return obj;
  }
  
})(this);
DEBUG && console.timeEnd('core');