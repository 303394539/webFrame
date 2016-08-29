DEBUG && console.time('ajax');;
(function($) {
  'use strict';

  var _AJAX_DEFAULTS = {
    TYPE: 'GET',
    MIME: 'json'
  };
  var _AJAX_MIME_TYPES = {
    script: 'text/javascript, application/javascript',
    json: 'application/json',
    xml: 'application/xml, text/xml',
    html: 'text/html',
    text: 'text/plain'
  };
  var _AJAX_OPTIONS = {
    // url: '',                // URL
    type: _AJAX_DEFAULTS.TYPE, // 请求方法: GET | POST | PUT | DELETE 等
    async: true, // 是否异步调用
    success: $.nop, // 成功响应的callback函数
    error: $.nop, // 失败或错误的callback函数
    context: null, // callback函数的上下文对象
    dataType: _AJAX_DEFAULTS.MIME, // 返回数据的类型: json | xml | text
    headers: {}, // 头信息
    timeout: 0, // 超时时间
    xhr: function() { // 获取 XHR 对象
      return new window.XMLHttpRequest();
    }
  };

  var JSONP_ID = 0;
  var abortTimeout;

  $.extend({
    AJAX_DEFAULTS: _AJAX_DEFAULTS,
    AJAX_OPTIONS: _AJAX_OPTIONS,
    AJAX_MIME_TYPES: _AJAX_MIME_TYPES,
    ajax: function(options) {
      return new Promise(function(resolve, reject){
        options = $.extend({
          _resolve: resolve,
          _reject: reject
        }, $.AJAX_OPTIONS, options);
        var xhr = options.xhr();
        if (options.data) {
          if (options.type === $.AJAX_DEFAULTS.TYPE) {
            options.url += $.queryString(options.data, options.url.indexOf('?') < 0 ? '?' : '&');
          } else {
            options.data = $.queryString(options.data);
          }
        }

        if (options.url.indexOf("=?") >= 0) {
          return $.jsonp(options);
        }

        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            abortTimeout && abortTimeout.cancel();
            _xhrStatus(xhr, options);
          }
        }

        xhr.open(options.type, options.url, options.async);

        if (options.contentType) {
          options.headers['Content-Type'] = options.contentType;
        }
        if (options.dataType) {
          options.headers['Accept'] = $.AJAX_MIME_TYPES[options.dataType];
        }

        for (var key in options.headers) {
          if ($.hasOwn(options.headers, key)) {
            xhr.setRequestHeader(key, options.headers[key]);
          }
        }

        if (options.timeout > 0) {
          abortTimeout = _xhrTimeout.defer(options.timeout, xhr, options);
        }

        try {
          xhr.send(options.data);
        } catch (error) {
          _xhrError('Resource not found', (xhr = error), options);
        }
      });
    },
    jsonp: function(options) {
      if (options.async) {
        var callbackName = "jsonp" + (++JSONP_ID);
        var script = document.createElement("script");
        var xhr = {
          abort: function() {
            $(script).remove();
            if (callbackName in window) {
              delete window[callbackName];
            }
          }
        }

        window[callbackName] = function(response) {
          clearTimeout(abortTimeout);
          xhr.abort();
          _xhrSuccess(response, xhr, options);
        };
        
        script.src = options.url.replace(/=\?/, '=' + callbackName);
        $('head').append(script);
        
        if (options.timeout > 0) {
          abortTimeout = setTimeout(_xhrTimeout, options.timeout, xhr, options);
        }
        
        return xhr;
      } else {
        return console.error('Unable to make jsonp synchronous call.');
      }
    },
    get: function(url, data, success, dataType) {
      if ($.isFunction(data)) {
        dataType = success;
        success = data;
        data = null;
      }
      return $.ajax({
        url: url,
        data: data,
        success: success,
        dataType: dataType
      });
    },
    post: function(url, data, success, dataType) {
      if ($.isFunction(data)) {
        dataType = success;
        success = data;
        data = null;
      }
      return _xhrForm.call(this, 'POST', url, data, success, dataType);
    },
    put: function(url, data, success, dataType) {
      if ($.isFunction(data)) {
        dataType = success;
        success = data;
        data = null;
      }
      return _xhrForm.call(this, 'PUT', url, data, success, dataType);
    },
    json: function(url, data, success) {
      return $.ajax({
        url: url,
        data: data,
        success: success,
        dataType: _AJAX_DEFAULTS.MIME
      });
    },
    delete: function(url, data, success, dataType) {
      if ($.isFunction(data)) {
        dataType = success;
        success = data;
        data = null;
      }
      return _xhrForm.call(this, 'DELETE', url, data, success, dataType);
    },
    queryString: function(obj, prefix) {
      if ($.isJSON(obj)) {
        prefix = prefix || '';
        var serialize = prefix;
        var key;
        for (key in obj) {
          if (!$.isUndefined(key) && $.hasOwn(obj, key)) {
            if (serialize !== prefix) {
              serialize += '&'
            }
            serialize += key + '=' + encodeURIComponent(obj[key]);
          }
        }
        return (serialize === prefix ? '' : serialize);
      } else {
        var query = {};
        var isUrl = /^(https?\:\/\/|\.\/|\.\.\/)/i.test(obj);
        var search = location.search.slice(1);
        (isUrl ? obj.split('?')[1] : search).split('&').forEach(function(item) {
          var parts = item.split('=');
          if(parts[0])query[parts[0]] = decodeURIComponent(parts[1]);
        });
        return (obj ? (isUrl ? query : query[obj]) : query);
      }
    }
  });

  function _xhrForm(method, url, data, success, dataType) {
    return $.ajax({
      type: method,
      url: url,
      data: data,
      success: success,
      dataType: dataType,
      contentType: 'application/x-www-form-urlencoded'
    });
  }

  function _xhrStatus(xhr, options) {
    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 0) {
      if (options.async) {
        _xhrSuccess(_parseResponse(xhr, options), xhr, options);
      }
    } else {
      _xhrError('Unsuccesful request', xhr, options);
    }
  }

  function _xhrSuccess(response, xhr, options) {
    if (response instanceof Error) {
      _xhrError(response.message, response, options);
    } else {
      options.success.call(options.context, response, xhr, options);
      options._resolve(response, xhr, options);
      delete options._resolve;
      delete options._reject;
    }
  }

  function _xhrError(type, xhr, options) {
    options.error.call(options.context, type, xhr, options);
    options._reject(response, xhr, options);
    delete options._resolve;
    delete options._reject;
  }

  function _xhrTimeout(xhr, options) {
    xhr.onreadystatechange = {};
    xhr.abort();
    _xhrError('Timeout exceeded', xhr, options);
  }

  function _parseResponse(xhr, options) {
    var response = xhr.responseText;
    if (response) {
      if (options.dataType === $.AJAX_DEFAULTS.MIME) {
        try {
          response = JSON.parse(response);
        } catch (error) {
          response = error;
          _xhrError('Parse Error', xhr, options);
        }
      } else if (options.dataType === 'xml') {
        response = xhr.responseXML;
      }
    }
    return response;
  }

})(Baic);
DEBUG && console.timeEnd('ajax');