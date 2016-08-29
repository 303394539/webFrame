DEBUG && console.time('selector');;
(function($) {
  'use strict';
  var // http://www.w3.org/TR/css3-syntax/#characters
    IS_HTML_FRAGMENT = /^\s*<(\w+|!)[^>]*>/,
    CLASS_SELECTOR = /^\.([\w-]+)$/,
    ID_SELECTOR = /^#[\w\d-]+$/,
    TAG_SELECTOR = /^[\w-]+$/,
    EVENT_PREFIX = /^on[A-Z]/,
    TMP_CONTAINER = document.createElement("div");

  $.extend({
    getDOMObject: function(selector, children) {
      var elementTypes = [1, 9, 11];
      if ($.isArray(selector)) {
        return selector.filter(function(item) {
          return item != null;
        });
      } else if ($.isString(selector)) {
        selector = selector.trim();
        if (IS_HTML_FRAGMENT.test(selector)) {
          TMP_CONTAINER.innerHTML = "" + selector;
          var tmp_container = $(TMP_CONTAINER);
          var nodes = tmp_container.children().toArray();
          tmp_container.empty();
          return nodes;
        } else {
          var dom = $.selector(document, selector);
          if (children && $.isString(children)) {
            if (dom.length === 1) {
              dom = $.selector(dom[0], children);
            } else {
              dom = dom.map(function(item) {
                return $.selector(item, children);
              });
            }
          }
          return dom;
        }
      } else if (elementTypes.indexOf(selector.nodeType) >= 0 || Baic.isWindow(selector)) {
        return [selector];
      }
    },
    selector: function(dom, selector) {
      var elements = [];
      if (CLASS_SELECTOR.test(selector)) {
        elements = dom.getElementsByClassName(selector.substring(1));
      } else if (TAG_SELECTOR.test(selector)) {
        elements = dom.getElementsByTagName(selector);
      } else if (ID_SELECTOR.test(selector)) {
        elements = dom.getElementById(selector.substring(1));
        if (!elements) elements = [];
      } else {
        elements = dom.querySelectorAll(selector);
      }

      return elements.nodeType ? [elements] : elements.toArray();
    }
  });

  $.extend($.fn, {
    find: function(selector) {
      return $(this.map(function(item) {
        return $.selector(item, selector);
      }).flatten());
    },
    parent: function(selector) {
      if (!selector) {
        return $(this.map(function(item) {
          return item.parentNode;
        }));
      } else {
        var ancestors = [];
        return $(this.map(function(item) {
          if (item && (item = item.parentNode) && item !== document && ancestors.indexOf(item) < 0 && ancestors.push(item) && _filtered(item, selector)) {
            return item;
          }
        }));
      }
    },
    siblings: function(selector) {
      var siblings = [];
      return $(this.map(function(item) {
        return item.parentNode.children.toArray().filter(function(child) {
          return (siblings.indexOf(child) < 0 && siblings.push(child)) && (child !== item && _filtered(item, selector));
        });
      }).flatten());
    },
    children: function(selector) {
      return $(this.map(function(item) {
        return item.children.toArray().filter(function(child) {
          return _filtered(child, selector);
        });
      }).flatten());
    },
    first: function() {
      return $(this[0]);
    },
    last: function() {
      return $(this[this.length - 1]);
    }
  });

  function _filtered(dom, selector) {
    return selector ? (dom.parentNode && $.selector(dom.parentNode, selector).indexOf(dom) >= 0) : true;
  }

})(Baic);
DEBUG && console.timeEnd('selector');