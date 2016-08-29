DEBUG && console.time('loader');
(function($) {
  'use strict';
  
  var EXP_READY = /complete|loaded|interactive/;
  var EXP_HTTP  = /^(?:\.\/|\.\.\/|http:\/\/|https:\/\/)/i;
  var EXP_EXT   = /(?:\.js|\.css)$/i;
  var EXP_CSS   = /\.css$/i;
  
  var queue = [];
  var cache = {};

  var step = 0;

  var isReady = EXP_READY.test(document.readyState);
  
  var head = document.getElementsByTagName('head')[0];

  var config = {
    baseUrl: '',
    alias: typeof REQUIRE_ALIAS === 'undefined' ? {} : REQUIRE_ALIAS
  };

  // parse script element
  var scripts = document.getElementsByTagName('script');
  var len = scripts.length;
  var script, main, scriptUrl, baseUrl;
  var i = 0;
  while (i < len) {
    script = scripts[i++];
    
    if (script.hasAttribute('data-main')) {
      main = script.getAttribute('data-main');
      baseUrl = script.getAttribute('data-base-url');
      if (!baseUrl) {
        scriptUrl = script.getAttribute('src');
        baseUrl = scriptUrl.substring(0, scriptUrl.lastIndexOf('/') + 1);
      }
      config.baseUrl = baseUrl;
      
      if (main) {
        _push(main.split(';').map(function (item) {
          return item.indexOf(',') >= 0 ? item.split(',') : item;
        }));
      }
    }
  }

  // check ready status
  if (!isReady) {
    if (document.addEventListener) {
      document.addEventListener('DOMContentLoaded', _DOMLoaded, false);
      window.addEventListener('load', _load, false);
    } else {
      document.attachEvent('onreadystatechange', _DOMLoaded);
      window.attachEvent('onload', _load);
    }
  } else {
    _load.defer(99);
  }

  $.require = window.require = function() {
    var i = 0;
    var len = arguments.length;
    var item, type;
    
    while (i < len) {
      type = $.type(item = arguments[i++]);

      if (type == 'function') {
        queue.push(item);
      } else if (item != null) { // type == string or type == array
        _push(Array.isArray(item) ? item : [item]);
      }
    }
    
    _load();
  };
  
  $.mixin($.require, {
    config: config,
    cache: cache
  });

  function _push(list) {
    var hasArrayEmbed = false;
    var len = list.length;
    var i = 0;
    var item;
    while (i < len) {
      item = list[i];
      if (Array.isArray(item)) {
        hasArrayEmbed = true;
      } else if (item) {
        if (config.alias[item] && Array.isArray(item = config.alias[item])) {
          list.splice(i--, 1, item);
          len = list.length;
        } else {
          if (!EXP_HTTP.test(item)) {
            item = config.baseUrl + item;
          }

          if (!EXP_EXT.test(item)) {
            item += '.js';
          }
        }

        list[i] = item;
      }
      
      i++;
    }
    
    if (hasArrayEmbed) {
      for (i = 0; i < len; i++) {
        item = list[i];
        if (Array.isArray(item)) {
          _push(item);
        } else {
          queue.push([item]);
        }
      }
    } else {
      queue.push(list);
    }
  }

  function _load() {
    if (!isReady || step > 0) {
      return;
    }

    if (queue.length) {
      var files = queue.shift();
      
      if ($.isFunction(files)) {
        files($);
        return _load();
      }
      
      var len = files.length;
      var i = 0;
      var item, node;
      
      step = len;

      while (i < len) {
        if (cache[item = files[i++]]) {
          // cache[item]++;
          step--;
        } else {
          cache[item] = 1;

          if (EXP_CSS.test(item)) { // load CSS file
            node = document.createElement('node');
            node.href = item;
            node.rel = 'stylesheet';
            head.appendChild(node);
            
            step--;
          } else { // load JavaScript file
            node = document.createElement('script');
            node.src = item;
            node.setAttribute('data-module-id', item);
            // node.charset = 'utf-8';
            // node.async = true;
            head.appendChild(node);

            if (node.attachEvent) {
              node.attachEvent('onreadystatechange', _success);
            } else {
              node.addEventListener('load', _success, false);
              node.addEventListener('error', _failure, false);
              node.addEventListener('readystatechange', function() {
                DEBUG && console.log('debug');
              }, false);
            }
          }
        }
      };

      if (step == 0) {
        _load();
      }
    }
  }

  function _success(event) {
    var el = event.currentTarget || event.srcElement;
    var moduleId, def;
    if (event.type === 'load' || EXP_READY.test(el.readyState)) {
      step--;
      _removeListener(el);
      
      moduleId = el.getAttribute('data-module-id');
      if (cache[moduleId] === 1) {
        cache[moduleId] = {};
      }

      _load();
    }
  }

  function _failure(event) {
    var el = event.currentTarget || event.srcElement;
    step--;
    _removeListener(el);
  }

  function _removeListener(node) {
    if (node.detachEvent) {
      node.detachEvent('onreadystatechange', _success);
    } else {
      node.removeEventListener('load', _success, false);
      node.removeEventListener('error', _failure, false);
    }
  }

  function _DOMLoaded() {
    if (document.addEventListener) {
      document.removeEventListener('DOMContentLoaded', _DOMLoaded, false);
    } else if (EXP_READY.test(document.readyState)) {
      document.detachEvent('onreadystatechange', _DOMLoaded);
    } else {
      return;
    }
    
    isReady = true;
    _load();
  }
  
})(vee);
DEBUG && console.timeEnd('loader');