DEBUG && console.time('storage');;
(function($) {
  'use strict';

  var _isValidKey = new RegExp("^[^\\x00-\\x20\\x7f\\(\\)<>@,;:\\\\\\\"\\[\\]\\?=\\{\\}\\/\\u0080-\\uffff]+\x24");

  $.extend({
    storage: {
      set: function(key, value, expires) {
        if (_isValidKey.test(key)) {
          if ($.isObject(value)) {
            value = "@" + value.toStr();
          }
          window.localStorage.setItem(key, value);
          if (expires) {
            if ($.isNumber(expires)) {
              var date = new Date();
              expires = date.setTime(date.getTime() + expires);
            }
            window.localStorage.setItem(key + ".expires", expires);
          }
        }
      },
      get: function(key) {
        var result = null;
        if (_isValidKey.test(key)) {
          result = window.localStorage.getItem(key);
          if (result) {
            if (result.indexOf("@") === 0) {
              result = result.slice(1).parseJSON();
            }
            var expires = window.localStorage.getItem(key + ".expires");
            expires = expires ? new Date(expires) : null;
            if (result && expires && expires < new Date()) {
              result = null;
              window.localStorage.removeItem(key);
              window.localStorage.removeItem(key + ".expires");
            }
          }
        }
        return result;
      },
      remove: function(key) {
        if (_isValidKey.test(key)) {
          window.localStorage.removeItem(key);
          window.localStorage.removeItem(key + ".expires");
        }
      },
      clearAll: function() {
        window.localStorage.clear();
      }
    },
    cookie: {
      get: function(key) {
        var result = null;
        if (_isValidKey.test(key)) {
          result = new RegExp("(^| )" + key + "=([^;\/]*)([^;\x24]*)(;|\x24)").exec(document.cookie);
          if (result) {
            result = result[2] || null;
          }
          if ($.isString(result)) {
            return decodeURIComponent(result);
          }
        }
        return null;
      },
      set: function(key, value, expires) {
        if (_isValidKey.test(key)) {
          if ($.isNumber(expires)) {
            expires = ";expires=" + new Date(Date.now() + expires * 1000).toGMTString();
          } else {
            expires = "";
          }
          document.cookie = encodeURIComponent(key) + '=' + encodeURIComponent(value.toStr()) + expires;
        }
      },
      remove: function(key) {
        if (_isValidKey.test(key)) {
          var obj = this.get(key);
          if (obj != null) {
            this.set(key, "", -1);
          }
        }
      },
      clearAll: function() {
        (document.cookie.match(/[^ =;]+(?=\=)/g) || []).forEach($.cookie.remove.bind(this));
      }
    }
  });

})(Baic);
DEBUG && console.timeEnd('storage');