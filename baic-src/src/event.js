DEBUG && console.time('event');;
(function($) {
  'use strict';

  var EVENTS_PC = {
    touchstart: 'mousedown',
    touchmove: 'mousemove',
    touchend: 'mouseup',
    tap: 'click',
    doubletap: 'dblclick',
    orientationchange: 'resize'
  };
  var HANDLERS = {};

  $.extend({
    createEvent: function(type, options) {
      var event = document.createEvent('Events');
      event.initEvent(_getEventName(type), true, true, null, null, null,
        null, null, null, null, null, null, null, null, null);
      if (options) {
        $.extend(true, event, options);
      }
      return event;
    },
    addEventListener: function(element, eventName, callback, bool) {
      if (element.addEventListener) {
        element.addEventListener(eventName, callback, $.isUndefined(bool) ? false : bool);
      } else if (element.attachEvent) {
        element.attachEvent('on' + eventName, callback);
      } else {
        element['on' + eventName] = callback;
      }
    },
    removeEventListener: function(element, eventName, callback, bool) {
      if (element.removeEventListener) {
        element.removeEventListener(eventName, callback, $.isUndefined(bool) ? false : bool);
      } else if (element.detachEvent) {
        element.detachEvent('on' + eventName, callback);
      } else {
        element['on' + eventName] = null;
      }
    }
  });

  $.extend($.fn, {
    on: function(eventName, callback, bool) {
      var event = _getEventName(eventName);
      this.forEach(function(item) {
        var id = $.id(item);
        var elementHandlers = HANDLERS[id] || (HANDLERS[id] = []);
        var handler = {
          event: event,
          callback: callback,
          proxy: _createProxyCallback(callback, item),
          index: elementHandlers.length
        };
        elementHandlers.push(handler);

        $.addEventListener(item, handler.event, handler.proxy, bool);
      });
      return this;
    },
    off: function(eventName, callback, bool) {
      var event = _getEventName(eventName);
      this.forEach(function(item) {
        var id = $.id(item);
        (HANDLERS[id] || []).forEach(function(handler) {
          if (handler && (!event || handler.event === event) && (!callback || handler.callback === callback)) {
            delete HANDLERS[id][handler.index];
            $.removeEventListener(item, handler.event, handler.proxy, bool);
          }
        });
      });
      return this;
    },
    trigger: function(event, options, srcEvent) {
      if ($.isString(event)) {
        event = $.createEvent(event, options);
      }
      if (!$.isNull(srcEvent)) {
        event.srcEvent = srcEvent;
      }
      this.forEach(function(item) {
        item.dispatchEvent(event);
      });
      return this;
    }
  });

  function _getEventName(eventName) {
    eventName = eventName.toLowerCase();
    return ($.browser.mobile ? eventName : EVENTS_PC[eventName]) || eventName;
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

})(Baic);
DEBUG && console.timeEnd('event');