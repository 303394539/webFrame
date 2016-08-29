DEBUG && console.time('touch');;
(function($) {
  'use strict';

  var EVENT;
  var EVENT_ATTRIBUTE = ['clientX', 'clientY', 'pageX', 'pageY', 'screenX', 'screenY', 'identifier', 'detail', 'which', 'rotation', 'scale'];
  var TOUCH_EVENTS = ['tap', 'singleTap', 'doubleTap', 'longTap',
    'dragStart', 'drag', 'drop', 'dragLeft', 'dragRight', 'dragUp', 'dragDown',
    'zoom', 'zooming'
  ];
  var EVENT_OPTIONS = {
    singleDelay: 250,
    longDelay: 650,
    zoomDelay: 10
  };
  var singleTapTimeout,
    longTapTimeout,
    touch = {},
    firstTouch = [],
    lastTouch = [];

  TOUCH_EVENTS.forEach(function(eventName) {
    $.fn[eventName] = function(callback) {
      this.on(eventName, callback);
    }
  });

  $.extend({
    setEventOptions: function(opts) {
      $.extend(EVENT_OPTIONS, opts, true);
    }
  });

  $(function() {
    $(document).on('touchstart', _onTouchStart)
      .on('touchmove', _onTouchMove)
      .on('touchend', _onTouchEnd)
      .on('touchcancel', _cleanTouch);
  });

  function _onTouchStart(event) {
    singleTapTimeout && singleTapTimeout.cancel();
    longTapTimeout && longTapTimeout.cancel();
    EVENT = event;

    var now = Date.now();
    var difftime = now - (touch.lasttime || now);
    var touches = _getTouches(event);
    var eventCount = touches.length;
    var target = $(_getTarget(touches[0].target));

    firstTouch = _touchesPosition(touches, eventCount);

    touch.el = target;
    touch.eventCount = eventCount;
    touch.lasttime = now;
    touch.dx = 0;
    touch.dy = 0;
    touch.enabled = false;
    if (touch.tapCount) {
      touch.tapCount++;
    } else {
      touch.tapCount = 1;
    }

    if (eventCount === 1) {
      touch.enabled = true;
      touch.gap = (difftime > 0 && difftime <= EVENT_OPTIONS.singleDelay);
      longTapTimeout = _triggerLongTap.defer(EVENT_OPTIONS.longDelay);
    } else if (eventCount === 2) {
      touch.initialDistance = _distance(firstTouch);
      touch.distance = 0;
    }
  }

  function _onTouchMove(event) {
    EVENT = event;
    if (touch.el) {
      var touches = _getTouches(event);
      var eventCount = touches.length;
      if (eventCount === touch.eventCount) {
        lastTouch = _touchesPosition(touches, eventCount);

        touch.dx = lastTouch[0].x - firstTouch[0].x;
        touch.dy = lastTouch[0].y - firstTouch[0].y;
        if (eventCount === 1) {
          if (touch.enabled && !(touch.enabled = _inHysteresisSquared())) {
            _trigger("dragStart");
          }

          if (!touch.enabled) {
            _trigger("drag");
            _trigger("drag" + _direction(firstTouch[0].x, lastTouch[0].x, firstTouch[0].y, lastTouch[0].y).firstUpperCase());
          }
        } else if (eventCount === 2) {
          _triggerZooming();
          return false;
        }
      } else {
        _cleanTouch();
      }
    }
  }

  function _onTouchEnd(event) {
    EVENT = event;
    if (touch.eventCount === 1) {
      if (touch.enabled) {
        longTapTimeout && longTapTimeout.cancel();
        if (touch.tapCount === 1) {
          $.browser.mobile && _trigger('tap');
          singleTapTimeout = _triggerSingleTap.defer(EVENT_OPTIONS.singleDelay);
        } else if (touch.tapCount === 2 && touch.gap && $.browser.mobile) {
          _trigger('doubleTap');
          _cleanTouch();
        }
        return;
      } else {
        _trigger('drop', {
          dir: _direction(firstTouch[0].x, lastTouch[0].x,
            firstTouch[0].y, lastTouch[0].y)
        });
      }
    } else {
      if (touch.distance !== 0) {
        _trigger('zoom', {
          distance: touch.distance,
          scale: touch.scale
        });
      }
    }

    _cleanTouch();
  }

  function _getTouches(event) {
    return event.touches || [event];
  }

  function _getTarget(node) {
    return ('tagName' in node) ? node : node.parentNode;
  }

  function _inHysteresisSquared() {
    return Math.pow(touch.dy, 2) + Math.pow(touch.dx, 2) <= 16;
  }

  function _trigger(type, params) {
    if (touch.el) {
      params = $.extend(params, {
        starttime: touch.lasttime,
        dx: touch.dx,
        dy: touch.dy
      });

      EVENT_ATTRIBUTE.forEach(function(item) {
        params[item] = EVENT.type === 'touchend' &&
          EVENT.changedTouches && EVENT.changedTouches[0] &&
          EVENT.changedTouches[0][item] ||
          EVENT.touches && EVENT.touches[0] &&
          EVENT.touches[0][item] ||
          EVENT[item];
      });

      touch.el.trigger(type, params, EVENT);
    }
  }

  function _triggerLongTap() {
    if (touch.lasttime && (Date.now() - touch.lasttime >= EVENT_OPTIONS.longDelay) && _inHysteresisSquared()) {
      _trigger('longTap');
    }
  }

  function _triggerSingleTap() {
    _trigger('singleTap');
    _cleanTouch();
  }

  function _touchesPosition(touches, eventCount) {
    var result = [];
    touches = touches[0].targetTouches || touches;
    for (var i = 0; i < eventCount; i++) {
      result.push({
        x: touches[i].pageX,
        y: touches[i].pageY
      });
    }
    return result;
  }

  function _distance(touchesData) {
    return Math.sqrt(Math.pow(touchesData[0].x - touchesData[1].x, 2) +
      Math.pow(touchesData[0].y - touchesData[1].y, 2));
  }

  function _direction(x1, x2, y1, y2) {
    var dx = x1 - x2;
    var dy = y1 - y2;
    return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'left' : 'right') : (dy > 0 ? 'up' : 'down');
  }

  function _cleanTouch(event) {
    singleTapTimeout && singleTapTimeout.cancel();
    longTapTimeout && longTapTimeout.cancel();

    firstTouch = [];
    lastTouch = [];
    touch = {};
  }

  function _triggerZooming() {
    var distance = _distance(lastTouch);
    var diff = (distance - touch.initialDistance) | 0;
    if (Math.abs(diff) > EVENT_OPTIONS.zoomDelay || touch.distance) {
      touch.distance = diff;
      touch.scale = distance / touch.initialDistance;
      _trigger('zooming', {
        distance: diff,
        scale: touch.scale
      });
    }
  }

})(Baic);
DEBUG && console.timeEnd('touch');