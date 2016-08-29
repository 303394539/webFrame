DEBUG && console.time('oop');;
(function($) {
  'use strict';

  function _extends(obj){
    var object = function(){
      if(this.__needinit__){
        this.init.apply(this, arguments)
      }
    }
    this.prototype.__needinit__ = 0;
    var prototype = new this();
    this.prototype.__needinit__ = 1;
    var rtn = ($.isFunction(obj) ? obj() : obj) || {};
    rtn.forEach(function(value, key){
      switch(key){
        case "__superclass__":
        case "__class__":
        case "__needinit__":
          break;
        case "static":
          $.extend(object, value)
          break;
        default:
          prototype[key] = value
      }
    })
    $.extend(prototype, {
      __superclass__: this,
      __class__: object,
      constructor: object,
      init: prototype.init || $.nop
    })
    object.prototype = prototype
    $.extend(object, {
      __superclass__: prototype,
      extends: _extends,
      create: function(){
        this.prototype.__needinit__ = 0;
        var obj = new this();
        this.prototype.__needinit__ = 1;
        obj.init.apply(obj, arguments);
        return obj
      }
    })
    return object
  }

  Array.extends = Object.extends = _extends

})(Baic);
DEBUG && console.timeEnd('oop');