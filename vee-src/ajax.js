DEBUG && console.time('ajax');

// https://github.com/pyrsmk/qwest/blob/master/src/qwest.js
(function($) {
  'use strict';
  
  var DEFAULTS = {
    TYPE: 'GET',
    MIME: 'json'
  };
  var MIME_TYPES = {
    script: 'text/javascript, application/javascript',
    json: 'application/json',
    xml: 'application/xml, text/xml',
    html: 'text/html',
    text: 'text/plain'
  };
  var JSONP_ID = 0;
  var QUERY;
  var abortTimeout;
  
  $.ajaxSettings = {
    // url: '',                // URL
    type: DEFAULTS.TYPE,       // 请求方法: GET | POST | PUT | DELETE 等
    async: true,               // 是否异步调用
    success: $.nop,            // 成功响应的callback函数
    error: $.nop,              // 失败或错误的callback函数
    context: null,             // callback函数的上下文对象
    dataType: DEFAULTS.MIME,   // 返回数据的类型: json | xml | text
    headers: {},               // 头信息
    timeout: 0,                // 超时时间
    xhr: function() {          // 获取 XHR 对象
      return new window.XMLHttpRequest();
    }
  };
  
  $.ajax = function(options) {
    var settings = $.mixin({}, options, $.ajaxSettings);
    var xhr = settings.xhr();
    if (settings.data) {
      if (settings.type === DEFAULTS.TYPE) {
        settings.url += $.queryString(settings.data, 
                                      settings.url.indexOf('?') < 0 ? '?' 
                                                                    : '&');
      } else {
        settings.data = $.queryString(settings.data);
      }
    }
    
    // is jsonp
    if (settings.url.indexOf('=?') >= 0) {
      return $.jsonp(settings);
    }
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        clearTimeout(abortTimeout);
        _xhrStatus(xhr, settings);
      }
    };
    
    xhr.open(settings.type, settings.url, settings.async);
    
    // set headers
    if (settings.contentType) {
      settings.headers['Content-Type'] = settings.contentType;
    }
    if (settings.dataType) {
      settings.headers['Accept'] = MIME_TYPES[settings.dataType];
    }
    for (var key in settings.headers) if ($.own(settings.headers, key)) {
      xhr.setRequestHeader(key, settings.headers[key]);
    }
    
    // set timeout
    if (settings.timeout > 0) {
      abortTimeout = setTimeout(_xhrTimeout, settings.timeout, xhr, settings);
    }
    
    try {
      xhr.send(settings.data);
    } catch (error) {
      _xhrError('Resource not found', (xhr = error), settings);
    }
    
    return (settings.async ? xhr : _parseResponse(xhr, settings));
  };
  
  $.jsonp = function(settings) {
    if (settings.async) {
      var callbackName = 'jsonp' + (++JSONP_ID);
      var script = document.createElement('script');
      var xhr = {
        abort: function() {
          $(script).remove();
          if (callbackName in window) {
            delete window[callbackName];
          }
        }
      };
      
      window[callbackName] = function(response) {
        clearTimeout(abortTimeout);
        xhr.abort();
        _xhrSuccess(response, xhr, settings);
      };
      
      script.src = settings.url.replace(/=\?/, '=' + callbackName);
      $('head').append(script);
      
      if (settings.timeout > 0) {
        abortTimeout = setTimeout(_xhrTimeout, settings.timeout, xhr, settings);
      }
      
      return xhr;
    } else {
      return console.error('VeeJS.ajax: Unable to make jsonp synchronous call.');
    }
  };
  
  $.get = function(url, data, success, dataType) {
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
  };
  
  $.post = function(url, data, success, dataType) {
    if ($.isFunction(data)) {
      dataType = success;
      success = data;
      data = null;
    }
    
    return _xhrForm('POST', url, data, success, dataType);
  };
  
  $.put = function(url, data, success, dataType) {
    if ($.isFunction(data)) {
      dataType = success;
      success = data;
      data = null;
    }
    
    return _xhrForm('PUT', url, data, success, dataType);
  };
  
  $['delete'] = function(url, data, success, dataType) {
    if ($.isFunction(data)) {
      dataType = success;
      success = data;
      data = null;
    }
    
    return _xhrForm('DELETE', url, data, success, dataType);
  };
  
  $.json = function(url, data, success) {
    return $.ajax({
      url: url,
      data: data,
      success: success,
      dataType: DEFAULTS.MIME
    });
  };
  
  $.queryString = function(parameters, prefix) {
    if ($.isObject(parameters)) {
      if (prefix == null) {
        prefix = '';
      }
      var serialize = prefix;
      var key;
      for (key in parameters) {
        if ($.own(parameters, key) && $.defined(parameters[key])) {
          if (serialize !== prefix) {
            serialize += '&';
          }
          serialize += key + '=' + encodeURIComponent(parameters[key]);
        }
      }
      return (serialize === prefix ? '' : serialize);
    } else {
      if (!QUERY) {
        QUERY = {};
        location.search.slice(1).split('&').forEach(function(item){
          var parts = item.split('=');
          QUERY[parts[0]] = decodeURIComponent(parts[1]);
        });
      }
      return parameters ? QUERY[parameters] : QUERY;
    }
  };
  
  function _xhrStatus(xhr, settings) {
    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 0) {
      if (settings.async) {
        _xhrSuccess(_parseResponse(xhr, settings), xhr, settings);
      }
    } else {
      _xhrError('VeeJS.ajax: Unsuccesful request', xhr, settings);
    }
  }
  
  function _xhrSuccess(response, xhr, settings) {
    if (response instanceof Error) {
      _xhrError(response.message, response, settings);
    } else {
      settings.success.call(settings.context, response, xhr, settings);
    }
  }
  
  function _xhrError(type, xhr, settings) {
    settings.error.call(settings.context, type, xhr, settings);
  }
  
  function _xhrTimeout(xhr, settings) {
    xhr.onreadystatechange = {};
    xhr.abort();
    _xhrError('VeeJS.ajax: Timeout exceeded', xhr, settings);
  }
  
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
  
  function _parseResponse(xhr, settings) {
    var response = xhr.responseText;
    if (response) {
      if (settings.dataType === DEFAULTS.MIME) {
        try {
          response = JSON.parse(response);
        } catch (error) {
          response = error;
          _xhrError('VeeJS.ajax: Parse Error', xhr, settings);
        }
      } else if (settings.dataType === 'xml') {
        response = xhr.responseXML;
      }
    }
    return response;
  }
})(vee);
DEBUG && console.timeEnd('ajax');