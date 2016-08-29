DEBUG && console.time('gesture');
(function($) {
  'use strict';
  
  var EVENT;
  var firstTouch = [];
  var lastTouch = [];
  var singleTapTimeout;
  var holdTimeout;
  var highlightTimeout;
  var gesture = {};
  var HOLD_DELAY = 650;
  var GESTURES = ['tap', 'singleTap', 'doubleTap', 'hold',
                  'dragStart', 'drag', 'drop',
                  'pinch', 'pinching'];
                  
  GESTURES.forEach(function(event) {
    $.fn[event] = function(callback) {
      this.on(event, callback);
    };
  });
  
  $(function() {
    $(document.body).on('touchstart', _onTouchStart)
                    .on('touchmove', _onTouchMove)
                    .on('touchend', _onTouchEnd)
                    .on('touchcancel', _cleanGesture);
  });
  
  function _onTouchStart(event) {
    singleTapTimeout && clearTimeout(singleTapTimeout);
    holdTimeout && clearTimeout(holdTimeout);
    EVENT = event;
    
    var now = Date.now();
    var delta = now - (gesture.last || now);
    var touches = _getTouches(event);
    var fingers = touches.length;
    var target = $(_parentIfText(touches[0].target));
    
    firstTouch = _fingersPosition(touches, fingers);
    
    gesture.el = target;
    gesture.fingers = fingers;
    gesture.last = now;
    gesture.dx = 0;
    gesture.dy = 0;
    gesture.tappable = false;
    if (gesture.taps) {
      gesture.taps++;
    } else {
      gesture.taps = 1;
    }
    
    if (fingers === 1) {
      gesture.tappable = true;
      gesture.gap = delta > 0 && delta <= 250;
      holdTimeout = setTimeout(_captureHold, HOLD_DELAY);
      
      gesture.highlightEl = target.attr('tap-highlight') === 'yes'
                            ? target 
                            : target.closest('[tap-highlight=yes]');
      
      if (gesture.highlightEl.length) {
        highlightTimeout = setTimeout(_highlight, 100);
        if ($.env.android) {
          setTimeout(_unhighlight, HOLD_DELAY);
        }
      }
    } else if (fingers === 2) {
      gesture.initialDistance = _distance(firstTouch);
      gesture.distance = 0;
    }
  }
  
  function _onTouchMove(event) {
    EVENT = event;
    if (gesture.el) {
      var touches = _getTouches(event);
      var fingers = touches.length;
      if (fingers === gesture.fingers) {
        lastTouch = _fingersPosition(touches, fingers);
        
        gesture.dx = lastTouch[0].x - firstTouch[0].x;
        gesture.dy = lastTouch[0].y - firstTouch[0].y;
        
        if (fingers === 1) {
          if (gesture.tappable && 
              !(gesture.tappable = _inHysteresisSquared()) ) {
            _unhighlight();
            _trigger('dragStart');
          }
          
          if (!gesture.tappable) {
            _trigger('drag');
          }
        } else if (fingers === 2) {
          _capturePinch();
          return false;
        }
      } else {
        _cleanGesture();
      }
    }
  }
  
  function _onTouchEnd(event) {
    EVENT = event;
    if (gesture.fingers === 1) {
      if (gesture.tappable) {
        holdTimeout && clearTimeout(holdTimeout);
        $.env.mobile && _trigger('tap');
        if (gesture.taps === 1) {
          singleTapTimeout = setTimeout((function() {
            _trigger('singleTap');
            _cleanGesture();
          }), 200);
        } else if (gesture.taps === 2 && gesture.gap) {
          _trigger('doubleTap');
          _cleanGesture();
        }
        return;
        // return false;
      } else {
        _trigger('drop', {
          dir: _direction(firstTouch[0].x, lastTouch[0].x,
                          firstTouch[0].y, lastTouch[0].y)
        });
      }
    } else {
      if (gesture.distance !== 0) {
        _trigger('pinch', {
          distance: gesture.distance,
          scale: gesture.scale
        });
      }
    }
    _cleanGesture();
  }
  
  function _fingersPosition(touches, fingers) {
    var result = [];
    var i = 0;
    touches = touches[0].targetTouches ? touches[0].targetTouches : touches;
    while (i < fingers) {
      result.push({
        x: touches[i].pageX,
        y: touches[i].pageY
      });
      i++;
    }
    return result;
  }
  
  function _capturePinch() {
    var distance = _distance(lastTouch);
    var diff = (distance - gesture.initialDistance) | 0;
    if (Math.abs(diff) > 10 || gesture.distance) {
      gesture.distance = diff;
      gesture.scale = distance / gesture.initialDistance;
      _trigger('pinching', {
        distance: diff,
        scale: gesture.scale
      });
    }
  }
  
  function _trigger(type, params) {
    if (gesture.el) {
      params = $.mixin(params, {
        timeStart: gesture.last,
        dx: gesture.dx,
        dy: gesture.dy
      });
      
      if (lastTouch[0]) {
        params.firstTouch = firstTouch;
        params.lastTouch = lastTouch;
      }
      
      [ 'clientX', 'clientY', 'pageX', 'pageY', 'screenX', 'screenY', 
        'identifier', 'detail', 'which', 'rotation', 'scale'
      ].forEach(function(item) {
        params[item] = EVENT.type === 'touchend' &&
                       EVENT.changedTouches && EVENT.changedTouches[0] &&
                       EVENT.changedTouches[0][item] || 
                       EVENT.touches && EVENT.touches[0] &&
                       EVENT.touches[0][item] ||
                       EVENT[item];
      });
      
      gesture.el.trigger(type, params, EVENT);
    }
  }
  
  function _cleanGesture(event) {
    clearTimeout(singleTapTimeout);
    clearTimeout(holdTimeout);
    
    _unhighlight();
    
    firstTouch = [];
    lastTouch = [];
    gesture = {};
  }
  
  function _distance(touchesData) {
    return Math.sqrt(Math.pow(touchesData[0].x - touchesData[1].x, 2) + 
                     Math.pow(touchesData[0].y - touchesData[1].y, 2));
  }
  
  function _getTouches(event) {
    return event.touches || [event];
  }
  
  function _parentIfText(node) {
    return ('tagName' in node) ? node : node.parentNode;
  }
  
  function _direction(x1, x2, y1, y2) {
    var dx = x1 - x2;
    var dy = y1 - y2;
    return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'left' : 'right')
                                        : (dy > 0 ? 'up'   : 'down');
  }
  
  function _captureHold() {
    if (gesture.last && (Date.now() - gesture.last >= HOLD_DELAY) &&
        _inHysteresisSquared()) {
      _trigger('hold');
    }
  }
  
  function _inHysteresisSquared() {
    return gesture.dy*gesture.dy + gesture.dx*gesture.dx <= 16;
  }
  
  function _highlight() {
    gesture.highlightEl.addClass('highlight');
    gesture.highlighted = true;
  }
  
  function _unhighlight() {
    if (highlightTimeout) {
      clearTimeout(highlightTimeout);
    }
    
    var highlightEl = gesture.highlightEl;
    if (highlightEl && highlightEl.length) {
      if (gesture.highlighted) {
        highlightEl.removeClass('highlight');
        gesture.highlighted = false;
      } else if (gesture.tappable) {
        highlightEl.addClass('highlight');
        setTimeout(function() {
          highlightEl.removeClass('highlight');
        }, 200);
      }
    }
  }
  
})(vee);
DEBUG && console.timeEnd('gesture');