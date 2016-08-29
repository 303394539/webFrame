DEBUG && console.time('tpl');;
(function($) {
  'use strict';

  var _Tpl = $.nop

  var FIRST_EXP = /\$\{\s*(.*?)\s*\}/g;
  var SECOND_EXP = /\$\(\s*(.*?)\s*\)/g;
  var THIRD_EXP = /\$\<\s*(.*?)\s*\>/g;
  var BOOLEAN_EXP = /^([\w\.]+)\s*(\?\s*([^:]*?))?\s*(\:\s*(.*))?$/;

  function _initTpl(context){
    context = context || $(document.body)
    var tpl = new _Tpl();
    _initTplHtml(tpl, context)
    return tpl
  }

  function _parseStr(string, obj){
    function _getBooleanValue(str){
      var arr = str.match(BOOLEAN_EXP);
      var value = obj[arr[1]]
      return (!arr[3] && !arr[5]) ? value : (value ? (arr[3] || "") : (arr[5] || ""));
    }
    string = string.replace(FIRST_EXP, function(matched, str){
      str = str.replace(SECOND_EXP, function(matched, str){
        return _getBooleanValue(str).replace(THIRD_EXP, function(matched, str){
          return _getBooleanValue(str)
        })
      })
      return _getBooleanValue(str)
    })
    return string;
  }

  $.extend(_Tpl.prototype, {
    tplEventContainer: {},
    tplMap: {},
    on: function(fnName, fn){
      if($.isObject(fnName)){
        $.extend(this.tplEventContainer, fnName)
      }else{
        this.tplEventContainer[fnName] = fn
      }
    },
    parse: function(name, obj){
      var html = name;
      if(name in this.tplMap && $.hasOwn(this.tplMap, name)){
        html = this.tplMap[name] || "";
      }
      function _getBooleanValue(str){
        var arr = str.match(BOOLEAN_EXP);
        var value = obj[arr[1]]
        return (!arr[3] && !arr[5]) ? value : (value ? (arr[3] || "") : (arr[5] || ""));
      }
      html = html.replace(FIRST_EXP, function(matched, str){
        str = str.replace(SECOND_EXP, function(matched, str){
          return _getBooleanValue(str).replace(THIRD_EXP, function(matched, str){
            return _getBooleanValue(str)
          })
        })
        return _getBooleanValue(str)
      })
      return html;
    },
    create: function(name, obj, parentNode){
      var html = this.parse(name, obj)

      html = html.replace(FIRST_EXP, "")

      var dom = $(html);

      dom.forEach(_process.bind(this))

      if (parentNode) {
        if (!parentNode.isB) {
          parentNode = $(parentNode)
        }
        parentNode.append(dom)
      }

      return dom;
    }
  })

  function _initTplHtml(tpl, context){
    context.find("[data-tpl]").forEach(function(item) {
      var dom = $(item)
      tpl.tplMap[dom.data("tpl")] = dom.html().replace(/>\s+</g, '><').trim();
      dom.remove()
    })
    context.children().forEach(_process.bind(tpl))
  }

  function _process(el) {
    var tpl = this;
    el = $(el);
    var eventName = el.attr('v-link-event');
    var link = el.attr("v-link");
    if (link) {
      el.removeAttr("v-link")
      el.removeAttr("v-link-event")
      el.attr('tap-highlight', 'yes')
      var prefix = link.charAt(0);
      el.on(eventName || "singleTap", function(event) {
        event.stopPropagation()
        if (prefix === "*") {
          var args = link.substring(1).split(/\s+/).map(function(a) {
            return /%u[0-9a-f]{4}/i.test(a) ? unescape(a) : decodeURIComponent(a)
          })
          var name = args.shift()
          if (tpl.tplEventContainer[name]) {
            tpl.tplEventContainer[name].apply(window, [event].concat(args))
          }
        } else {
          location.href = link;
        }

      })

    }

    el.children().forEach(_process.bind(tpl))

  }

  $.extend({
    tpl: _initTpl,
    parseStr: _parseStr
  })

})(Baic);
DEBUG && console.timeEnd('tpl');