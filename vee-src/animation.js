DEBUG && console.time('animation');
(function($) {
  'use strict';
  
  window.requestAnimationFrame =  window.requestAnimationFrame       || 
                                  window.webkitRequestAnimationFrame || 
                                  window.mozRequestAnimationFrame    || 
                                  window.msRequestAnimationFrame     || 
                                  function(callback){
                                    setTimeout(callback, 1000 / 60);
                                  };
  window.cancelAnimationFrame = window.cancelAnimationFrame               || 
                                window.cancelRequestAnimationFrame        || 
                                window.webkitCancelAnimationFrame         || 
                                window.webkitCancelRequestAnimationFrame  || 
                                window.mozCancelAnimationFrame            || 
                                window.mozCancelRequestAnimationFrame     || 
                                window.msCancelAnimationFrame             || 
                                window.msCancelRequestAnimationFrame      || 
                                clearTimeout;
  
  $.easing = {
    cubicIn: function(n) {
      return Math.pow(n, 3);
    },
    cubicOut: function(n) {
      return Math.pow(n - 1, 3) + 1;
    },
    expoOut: function(n) {
      return (n == 1) ? 1 : (-1 * Math.pow(2, -10 * n) + 1);
    },
    quadInOut: function(n) {
      n = n * 2;
      if (n < 1) {
        return Math.pow(n, 2) / 2;
      }
      return -1 * ((--n) * (n - 2) - 1) / 2;
    },
    linear: function(n) {
      return n;
    }
  };
  
  $.Animator = function(options) {
    $.mixin(this, options, {
      duration: 350,
      startValue: 0,
      endValue: 1,
      reversed: false,
      easing: $.easing.cubicOut,
      onStep: $.nop,
      onStop: $.nop,
      onEnd: $.nop
    });
  };
  
  $.mixin($.Animator.prototype, {
    start: function() {
      this.stop();
      
      this.t0 = this.t1 = Date.now();
      this.value = this.startValue;
      
      this.job = requestAnimationFrame(_next.bind(this));
    },
    
    stop: function() {
      _cancel(this);
      this.onStop();
    }
  });
  
  function _next() {
    this.t1 = Date.now();
    this.dt = this.t1 - this.t0;
    
    var f = _easedLerp(this.t0, this.duration, this.easing, this.reversed);
    if (f >= 1 || this.dt >= this.duration) {
      this.value = this.endValue
      _cancel(this);
      this.onStep();
      this.onEnd();
    } else {
      this.job = requestAnimationFrame(_next.bind(this));
      this.value = this.startValue + f * (this.endValue - this.startValue)
      this.onStep();
    }
  }
  
  function _cancel(obj) {
    cancelAnimationFrame(obj.job);
    obj.job = null;
  }
  
  function _easedLerp(timeStart, duration, easing, reverse) {
    var lerp = (Date.now() - timeStart) / duration;
    if (reverse) {
      return lerp >= 1 ? 0 : (1 - easing(1 - lerp));
    } else {
      return lerp >= 1 ? 1 : easing(lerp);
    }
  }
})(vee);
DEBUG && console.timeEnd('animation');