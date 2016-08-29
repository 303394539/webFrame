DEBUG && console.time('dom');;
(function($) {
  'use strict';
  var EVENT_PREFIX = /^on[A-Z]/,
    ELEMENT_ID = 1;

  $.extend($.fn, {
    html: function(value) {
      if ($.isUndefined(value)) {
        return this[0].innerHTML;
      } else {
        this.forEach(function(item) {
          if ($.isString(value) || $.isNumber(value)) {
            item.innerHTML = value;
          } else {
            item.innerHTML = null;
            if ($.isArray(value)) {
              value.forEach(function(dom) {
                if (dom.nodeType) {
                  item.appendChild(dom);
                } else {
                  item.innerHTML = dom;
                }
              });
            } else {
              if (value.nodeType) item.appendChild(value);
            }
          }
        });
      }
      return this;
    },
    text: function(value) {
      if ($.isUndefined(value)) {
        return this[0].textContent;
      } else {
        this.forEach(function(item) {
          item.textContent = value.toStr();
        });
      }
      return this;
    },
    empty: function() {
      this.forEach(function(item) {
        item.innerHTML = null;
      });
      return this;
    },
    remove: function() {
      this.forEach(function(item) {
        item.remove();
      })
    },
    attr: function(name, value) {
      if ($.isUndefined(value)) {
        if ($.isString(name)) {
          return this[0].getAttribute(name);
        } else if ($.isJSON(name)) {
          name.forEach(function(v, k) {
            this.attr(k, v);
          }.bind(this));
        }
      } else {
        this.forEach(function(item) {
          item.setAttribute(name, value.toStr());
        });
      }
      return this;
    },
    removeAttr: function(name) {
      this.forEach(function(item) {
        if ($.isArray(name)) {
          name.forEach(function(value) {
            this.removeAttr(value);
          }.bind(this));
        } else {
          item.removeAttribute(name);
        }
      }.bind(this));
      return this;
    },
    data: function(name, value) {
      //利用html5特性dataset,大量dom操作dataset性能不太好,限制在10个元素以内
      if (this.length <= 10 && this[0].dataset) {
        if ($.isUndefined(value)) {
          return this[0].dataset[name];
        } else {
          this.forEach(function(item) {
            item.dataset[name] = value.toStr();
          });
          return this;
        }
      } else {
        return this.attr("data-" + name, value);
      }
    },
    removeDate: function(name) {
      return this.removeAttr("data-" + name);
    },
    val: function(value) {
      if ($.isUndefined(value)) {
        return this[0].value;
      } else {
        this.forEach(function(item) {
          item.value = value.toStr();
        });
      }
      return this;
    },
    hasClass: function(name) {
      return _hasClass(this[0], name);
    },
    addClass: function(name) {
      this.forEach(function(item) {
        if (!_hasClass(item, name)) {
          if (item.classList) {
            item.classList.add(name);
          } else {
            item.className = (item.className + " " + name).trim();
          }
        }
      });
      return this;
    },
    removeClass: function(name) {
      this.forEach(function(item) {
        if (name == item.className) {
          item.className = "";
        } else {
          name = name.trim();
          if (_hasClass(item, name)) {
            if (item.classList) {
              item.classList.remove(name);
            } else {
              item.className = item.className.replace(new RegExp('^' + [name, name, name].join(' | ') + '$', 'g'), " ")
                .replace(/\s+/g, " ").trim();
            }
          }
        }
      });
      return this;
    },
    css: function(name, value) {
      if ($.isUndefined(value)) {
        if ($.isJSON(name)) {
          name.forEach(function(value, key) {
            this.css(key, value);
          }.bind(this));
        } else {
          return this[0].style[name] || document.defaultView.getComputedStyle(this[0], '')[name];
        }
      } else {
        this.forEach(function(item) {
          item.style[name] = value.toStr();
        });
      }
      return this;
    },
    vendor: function(name, value, oppo) {
      var len = $.VENDORS.length,
        newname, newvalue, vendor, result;
      for (var i = 0; i < len; i++) {
        vendor = $.VENDORS[i];
        newname = vendor + name;
        if (!$.isUndefined(value) && !$.isNull(value)) {
          if (!oppo) {
            this.css(newname, value);
          } else {
            newvalue = vendor + value;
            this.css(name, newvalue);
          }
        } else if ((result = this.css(newname))) {
          return result;
        }
      };
      return this;
    },
    rect: function() {
      return this[0].getBoundingClientRect();
    },
    width: function() {
      return this.rect().width;
    },
    height: function() {
      return this.rect().height;
    },
    offset: function() {
      var rect = this.rect(),
        dom = this[0],
        doc = dom && dom.ownerDocument;
      if (!doc) return;
      var docElem = doc.documentElement,
        win = $.getWindow(doc);
      return {
        left: rect.left + win.pageXOffset - docElem.clientLeft,
        top: rect.top + win.pageYOffset - docElem.clientTop,
        width: rect.width,
        height: rect.height
      }
    },
    append: _addElement(0),
    prepend: _addElement(1),
    replaceWith: _addElement(2),
    createElement: function(obj) {
      if (!obj) return null;
      this.append(_createElements(obj));
      return this;
    },
    createElementPrepend: function(obj) {
      if (!obj) return null;
      this.prepend(_createElements(obj));
      return this;
    },
    id: function(index) {
      return ($.isNumber(index) && index < this.length) ? (this[0].id = $.id()) : this.map(function(item) {
        return item.id || (item.id = $.id());
      });
    }
  });

  $.extend({
    VENDORS: (function() {
      var styles = document.defaultView.getComputedStyle(document.documentElement, "") || window.getComputedStyle(document.documentElement, "") || "";
      if (!styles) return ['-webkit-', '-moz-', '-ms-', '-o-', ''];
      var vendors = Array.prototype.slice
        .call(styles)
        .join('')
        .match(/-(moz|webkit|ms|o)-/);
      return $.isArray(vendors) ? [""].concat(vendors[0]) : (styles.OLink === '' && ['', 'o']);
    })(),
    createElement: _createElements,
    createElementPrepend: function(obj, parentNode) {
      if (!obj || !parentNode) return null;
      return $(parentNode).createElementPrepend(obj);
    },
    id: function(element, index) {
      if (element && element.nodeType) {
        return element.id || (element.id = $.id());
      } else if ($.isArray(element)) {
        return ($.isNumber(index) && index < this.length) ? (this[0].id = $.id()) : this.map(function(item) {
          return item.id || (item.id = $.id());
        });
      } else {
        return '__id_' + ELEMENT_ID++;
      }
    }
  });

  function _hasClass(dom, name) {
    return dom.classList ? dom.classList.contains(name) : dom.className.split(/\s+/g).indexOf(name) >= 0;
  }

  function _addElement(mode) {
    return function(value) {
      var method = function(item, value) {
        switch (mode) {
          case 0:
            item.appendChild(value);
            break;
          case 1:
            item.insertBefore(value, item.firstChild);
            break;
          case 2:
            item.parentNode.insertBefore(value, item);
            break;
        }
      }

      this.forEach(function(item) {
        if ($.isString(value) || $.isNumber(value)) {
          item.insertAdjacentHTML(mode ? (mode === 2 ? 'beforeBegin' : 'afterBegin') : 'beforeEnd', value);
        } else if ($.isArray(value)) {
          value.forEach(function(value) {
            method(item, value);
          });
        } else {
          method(item, value);
        }
      });

      if (mode === 2) {
        this.remove();
      }
    };
  }

  function _createElements(elements, parentNode) {
    var nodes = [];
    var type = $.type(elements);

    var vendor = function(property, value) {
      return $.VENDORS.map(function(item) {
        return item + property + ':' + value
      }).join(';');
    };

    if (type === 'object') {
      elements = [elements];
    } else if (type !== 'array') {
      return nodes;
    }

    elements.forEach(function(properties) {
      if (properties) {
        var element = document.createElement(properties.tag || 'div');
        var styles = [];
        var property, value;
        for (property in properties)
          if ($.hasOwn(properties, property)) {
            value = properties[property];
            switch (property) {
              case 'tag':
              case 'components':
                break;

              case 'style':
                styles.push(value);
                break;

              case 'flex':
                styles.push(vendor('box-flex', value));
                break;

              case 'text':
                element.textContent = value;
                break;

              case 'html':
                element.innerHTML = value;
                break;

              case 'classes':
                element.className = value;
                break;

              case 'showing':
                styles.push('display:' + (value ? 'block' : 'none'));
                break;

              case 'width':
              case 'height':
              case 'top':
              case 'bottom':
              case 'left':
              case 'right':
                styles.push(property + ':' +
                  ($.isString(value) ? value : (+value + 'px')));
                break;

              default:
                if (EVENT_PREFIX.test(property) && $.isFunction(value)) {
                  $(element).on(property[2].toLowerCase() + property.slice(3),
                    value);
                } else if (value != null) {
                  element.setAttribute(property.replace(/[A-Z]/g, function(obj) {
                    return '-' + obj.toLowerCase();
                  }), value.toStr());
                }
            }
          }

        if (properties.components) {
          _createElements(properties.components, element);
        }

        if (styles.length) {
          element.style.cssText = styles.join(';');
        }

        nodes.push(element);
      }

    });

    return nodes;
  }

})(Baic);
DEBUG && console.timeEnd('dom');