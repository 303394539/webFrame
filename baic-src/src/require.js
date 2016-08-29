typeof DEBUG === 'undefined' && (DEBUG = 1);
DEBUG && console.time('require');;
// (function(window, document) {
//   'use strict';
//   var EXP_READY = /complete|loaded|interactive/,
//     EXP_HTTP = /((^http)|(^https)):\/\/(\w)+.(\w)+/i,
//     EXP_EXT = /(?:\.js|\.css)$/i;

//   var scripts = document.getElementsByTagName("script"),
//     head = document.head || document.getElementsByTagName("head")[0] || document.documentElement,
//     isReady = EXP_READY.test(document.readyState),
//     len = scripts.length,
//     urls = [],
//     url,
//     script, main, baseUrl = _getScriptAbsPath(),
//     scriptUrl,
//     plen, mlen,
//     _callback = new Function;

//   function _checkType(type) {
//     return function(obj) {
//       return {}.toString.call(obj) == "[object " + type + "]";
//     }
//   }

//   var isFunction = _checkType("Function");

//   function _getScriptAbsPath() {
//     var url = "";
//     try {
//       url = document.currentScript.src;
//     } catch (e) {
//       url = /(?:http|https|file):\/\/.*?\/.+?.js/.exec(e.stack || e.sourceURL || e.stacktrace)[0] || "";
//     }
//     return url.substring(0, url.lastIndexOf('/') + 1);
//   }

//   if (isReady) {
//     setTimeout(_load, 100);
//   } else {
//     if (document.addEventListener) {
//       document.addEventListener('DOMContentLoaded', _DOMLoaded, false);
//       window.addEventListener('load', _load, false);
//     } else {
//       document.attachEvent('onreadystatechange', _DOMLoaded);
//       window.attachEvent('onload', _load);
//     }
//   }

//   function _DOMLoaded() {
//     if (document.addEventListener) {
//       document.removeEventListener('DOMContentLoaded', _DOMLoaded, false);
//     } else if (EXP_READY.test(document.readyState)) {
//       document.detachEvent('onreadystatechange', _DOMLoaded);
//     } else {
//       return;
//     }
//     isReady = true;
//     _load();
//   }

//   function _load() {
//     if (!isReady || urls.length <= 0) {
//       return;
//     }
//     url = urls.shift();
//     var node = document.createElement("script");
//     node.src = _getUrl(url);
//     // node.async = true;
//     if (node.addEventListener) {
//       node.addEventListener("load", _onload, false);
//     } else {
//       node.attachEvent('onreadystatechange', _onload);
//     }

//     function _onload() {
//       if (node.removeEventListener) {
//         node.removeEventListener('load', _onload, false);
//       } else {
//         node.detachEvent('onreadystatechange', _onload);
//       }
//       node = null;
//       if (urls.length == 0) _callback();
//       _load();
//     }
//     head.appendChild(node);
//   }

//   function _getUrl(url) {
//     if (!EXP_HTTP.test(url)) {
//       url = baseUrl + url;
//     }
//     if (!EXP_EXT.test(url)) {
//       url += '.js';
//     }
//     return url;
//   }

//   var require = function(array, fn) {
//     urls = urls.concat(Array.isArray(array) ? array : [array]);
//     _callback = isFunction(fn) ? fn : new Function;
//     if (isReady) _load();
//   }

//   for (var i = 0; i < len; i++) {
//     script = scripts[i];
//     if (script.hasAttribute("data-main")) {
//       main = script.getAttribute("data-main");
//       baseUrl = script.getAttribute("data-base-url") || baseUrl;
//       urls = main ? main.split(';').map(function(item) {
//         item = item.trim();
//         return item;
//       }) : [];
//       break;
//     }
//   };

//   window.require = require;

// })(window, document);
(function(window, document){
  'use strict';
  var EXP_READY = /complete|loaded|interactive/,
    EXP_HTTP = /((^http)|(^https)):\/\/(\w)+.(\w)+/i,
    EXP_EXT = /(?:\.js|\.css|\.jpg|\.jpeg|\.png|\.gif)$/i,
    EXP_IMAGE = /(?:\.jpg|\.jpeg|\.png|\.gif)$/i,
    EXP_CSS = /\.css$/i,
    EXP_JS = /\.js$/i;

  var scripts = document.getElementsByTagName("script"),
      script,main,
      head = document.head || document.getElementsByTagName("head")[0] || document.documentElement,
      len = scripts.length,
      isReady = EXP_READY.test(document.readyState),
      baseUrl = _getScriptAbsPath();

  function _getScriptAbsPath() {
    var url = "";
    try {
      url = document.currentScript.src;
    } catch (e) {
      url = /(?:http|https|file):\/\/.*?\/.+?.js/.exec(e.stack || e.sourceURL || e.stacktrace)[0] || "";
    }
    return url.substring(0, url.lastIndexOf('/') + 1);
  }

  function _getUrl(url) {
    if (!EXP_HTTP.test(url)) {
      url = baseUrl + url;
    }
    if (!EXP_EXT.test(url) && url.indexOf("?") < 0) {
      url += '.js';
    }
    return url;
  }

  function _createJs(url){
    var node = document.createElement("script");
    node.src = url;
    return new Promise(function(resolve, reject){
      function _onload(event){
        if(event.type === "load" || EXP_READY.test(node.readyState)){
          _removeListener();
          resolve(node)
        }
      }
      function _error(){
        _removeListener();
        reject(url)
      }
      function _removeListener(){
        if(node.removeEventListener){
          node.removeEventListener("load", _onload, false);
          node.removeEventListener("error", _error, false)
        }else{
          node.detachEvent('onreadystatechange', _onload)
        }
      }
      if (node.addEventListener) {
        node.addEventListener("load", _onload, false);
        node.addEventListener("error", _error, false)
      } else {
        node.attachEvent('onreadystatechange', _onload);
      }
      head.appendChild(node);
    })
  }

  function _createCss(url){
    var node = document.createElement("link");
    node.rel = "stylesheet";
    node.href = url;
    head.appendChild(node);
    return Promise.resolve(node);
  }

  function _createImage(url){
    var image = new Image();
    image.src = url;
    if(image.complete){
      return Promise.resolve(image);
    }else{
      return new Promise(function(resolve, reject){
        image.onload = function(){
          resolve(image)
        }
        image.onerror = function(){
          reject(image)
        }
      })
    }
  }

  function _load(url){
    var complete = _getUrl(url);
    var index = complete.indexOf("?");
    if(index >= 0){
      url = complete.substring(0, index);
    }else{
      url = complete;
    }
    if(EXP_JS.test(url)){
      return _createJs(complete);
    }
    if(EXP_CSS.test(url)){
      return _createCss(complete)
    }
    if(EXP_IMAGE.test(url)){
      return _createImage(complete)
    }
    return Promise.resolve(complete)
  }

  var require = function(){
    var args = Array.prototype.slice.call(arguments);
    if(args.length > 0 && Array.isArray(args[0])){
      args = args[0];
    }
    return new Promise(function(resolve){
      function _DOMLoaded() {
        if (document.addEventListener) {
          document.removeEventListener('DOMContentLoaded', _DOMLoaded, false);
        } else if (isReady) {
          document.detachEvent('onreadystatechange', _DOMLoaded);
        } else {
          return;
        }
        isReady = true;
        resolve();
      }
      if(!isReady){
        if (document.addEventListener) {
          document.addEventListener('DOMContentLoaded', _DOMLoaded, false);
          window.addEventListener('load', _DOMLoaded, false);
        } else {
          document.attachEvent('onreadystatechange', _DOMLoaded);
          window.attachEvent('onload', _DOMLoaded);
        }
      }else{
        setTimeout(_DOMLoaded, 100)
      }
    }).then(function(){
      return Promise.all(args.map(function(item){
        return item ? _load(item) : Promise.resolve();
      }))
    });
  }


  for (var i = 0; i < len; i++) {
    script = scripts[i];
    baseUrl = script.getAttribute("data-base-url") || baseUrl;
    if (script.hasAttribute("data-require")) {
      main = script.getAttribute("data-require");
      if(main){
        main.split(';').forEach(function(item){
          if(item.indexOf(",") < 0){
            require(item)
          }else{
            item.split(',').forEach(function(item){
              require(item)
            })
          }
        })
      }
      break;
    }
  };
  require.baseUrl = baseUrl;

  window.require = require;

})(window, document)
DEBUG && console.timeEnd('require');