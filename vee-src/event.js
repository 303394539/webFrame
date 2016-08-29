DEBUG && console.time('event');
(function($) {
  'use strict';
  
  var EVENTS_DESKTOP = {
    touchstart: 'mousedown',
    touchmove: 'mousemove',
    touchend: 'mouseup',
    tap: 'click',
    doubletap: 'dblclick',
    orientationchange: 'resize'
  };
  var HANDLERS = {};
  
  $.Event = function(type, touch) {
    var event = document.createEvent('Events');
    event.initEvent(_getEventName(type), true, true, null, null, null, 
                    null, null, null, null, null, null, null, null, null);
    if (touch) {
      $.mixin(event, touch, true);
    }
    return event;
  };
  
  $.mixin($.fn, {
    on: function(event, callback) {
      event = _getEventName(event);
      this.forEach(function(element) {
        var id = $.id(element);
        var elementHandlers = HANDLERS[id] || (HANDLERS[id] = []);
        var handler = {
          event: event,
          callback: callback,
          proxy: _createProxyCallback(callback, element),
          index: elementHandlers.length
        };
        
        elementHandlers.push(handler);
        
        _addEventListener(element, handler.event, handler.proxy);
      });
      
      return this;
    },
    
    off: function(event, callback) {
      event = _getEventName(event);
      this.forEach(function(element) {
        var id = $.id(element);
        (HANDLERS[id] || []).filter(function(handler) {
          return handler && (!event || handler.event === event) && 
                 (!callback || handler.callback === callback);
        }).forEach(function(handler) {
          delete HANDLERS[id][handler.index];
          _removeEventListener(element, handler.event, handler.proxy);
        });
      });
      
      return this;
    },
    
    trigger: function(event, touch, srcEvent) {
      if ($.type(event) === 'string') {
        event = $.Event(event, touch);
      }
      if (srcEvent != null) {
        event.srcEvent = srcEvent;
      }
      this.forEach(function(item) {
        item.dispatchEvent(event);
      });
      
      return this;
    }
  });
  
  function _addEventListener(element, eventName, callback) {
    if (element.addEventListener) {
      element.addEventListener(eventName, callback, false);
    } else if (element.attachEvent) {
      element.attachEvent('on' + eventName, callback);
    } else {
      element['on' + eventName] = callback;
    }
  }
  
  function _removeEventListener(element, eventName, callback) {
    if (element.removeEventListener) {
      element.removeEventListener(eventName, callback, false);
    } else if (element.detachEvent) {
      element.detachEvent('on' + eventName, callback);
    } else {
      element['on' + eventName] = null;
    }
  }
  
  function _getEventName(eventName) {
    eventName = eventName.toLowerCase();
    return ($.env.mobile ? eventName : EVENTS_DESKTOP[eventName]) || eventName;
  }
  
  function _createProxyCallback(callback, element) {
    return function(event) {
      event = event || window.event;
      if (event && !event.target) {
        event.target = event.srcElement;
      }
      if (callback.apply(element, [event].concat(event.data)) === false) {
        event.preventDefault();
      }
    }
  }
  
})(vee);
DEBUG && console.timeEnd('event');