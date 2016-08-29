DEBUG && console.time('dom');
(function($) {
  'use strict';
  
  var TABLE = _createElement('table');
  var TABLE_ROW = _createElement('tr');
  var HTML_CONTAINERS = {
    tr: _createElement('tbody'),
    tbody: TABLE,
    thead: TABLE,
    tfoot: TABLE,
    td: TABLE_ROW,
    th: TABLE_ROW,
    _: _createElement('div')
  };
  
  var IS_HTML_FRAGMENT = /^\s*<(\w+|!)[^>]*>/;
  var CLASS_SELECTOR = /^\.([\w-]+)$/;
  var ID_SELECTOR = /^#[\w\d-]+$/;
  var TAG_SELECTOR = /^[\w-]+$/;
  var EVENT_PREFIX = /^on[A-Z]/;
  
  var VENDORS = ['-webkit-', '-moz-', '-ms-', '-o-', ''];
  
  var ELEMENT_ID = 1;
  
  $.createElements = function(elements, parentNode) {
    if ($.isString(parentNode)) {
      parentNode = $(parentNode)[0];
    } else if (Array.isArray(parentNode)) {
      parentNode = parentNode[0];
    }
    return $( _createElements(elements,  parentNode) );
  };
  
  $.mixin($, {
    getDOMObject: function(selector, children) {
      var domain = null;
      var elementTypes = [1, 9, 11];
      var type = $.type(selector);

      if (type === 'array') {
        domain = selector.filter(function(item) {
          return item != null;
        });
      } else if (type === 'string') {
        if (IS_HTML_FRAGMENT.test(selector)) {
          domain = _fragment(selector.trim(), RegExp.$1);
        } else {
          domain = $.query(document, selector);
          if (children) {
            if (domain.length === 1) {
              domain = $.query(domain[0], children);
            } else {
              domain = domain.map(function(item) {
                return $.query(item, children);
              });
            }
          }
        }
      } else if (elementTypes.indexOf(selector.nodeType) >= 0 || 
                 selector === window) {
        domain = [selector];
      }
      
      return domain;
    },
    
    query: function(domain, selector) {
      var elements;
      
      selector = selector.trim();
      if (CLASS_SELECTOR.test(selector)) {
        elements = domain.getElementsByClassName(selector.substring(1));
      } else if (TAG_SELECTOR.test(selector)) {
        elements = domain.getElementsByTagName(selector);
      } else if (ID_SELECTOR.test(selector) && domain === document) {
        elements = domain.getElementById(selector.substring(1));
        if (!elements) {
          elements = [];
        }
      } else {
        elements = domain.querySelectorAll(selector);
      }
      
      return elements.nodeType ? [elements] : elements.toArray();
    },
    
    id: function(element) {
      if (element) {
        return element.id || (element.id = $.id());
      } else {
        return '__id_' + ELEMENT_ID++;
      }
    }
  });

  $.mixin($.fn, {
    
    // Attribute

    attr: function(name, value) {
      if (this.length === 0) {
        null;
      }
      
      if ($.defined(value)) {
        this.forEach(function(item) {
          item.setAttribute(name, _toStringValue(value));
        });
      } else {
        return this[0].getAttribute(name);
      }
    },
    
    removeAttr: function(name) {
      this.forEach(function(item) {
        item.removeAttribute(name);
      });
    },
    
    data: function(name, value) {
      return this.attr('data-' + name, value);
    },
    
    removeData: function(name) {
      this.removeAttr('data-' + name);
    },
    
    val: function(value) {
      if ($.type(value) === 'string') {
        this.forEach(function(item) {
          item.value = _toStringValue(value);
        });
      } else {
        return this.length ? this[0].value : null;
      }
    },
    
    // Class
    
    addClass: function(name) {
      this.forEach(_addClass(name));
    },
    
    removeClass: function(name) {
      this.forEach(_removeClass(name));
    },
    
    toggleClass: function(name) {
      this.forEach(function(item) {
        (_existsClass(item, name) ? _removeClass : _addClass)(name)(item);
      });
    },
    
    hasClass: function(name) {
      return _existsClass(this[0], name);
    },
    
    // Style
    
    style: function(property, value) {
      if ($.defined(value)) {
        this.forEach(function(item) {
          item.style[property] = value;
        });
      } else {
        if ($.type(property) === 'object') {
          property.forEach(function(item, key) {
            this.style(key, item);
          }.bind(this));
        } else {
          return this[0].style[property] || _computedStyle(this[0], property);
        }
      }
    },
    
    vendor: function(property, value) {
      var i = 0;
      var len = VENDORS.length;
      var result, name;
      while (i < len) {
        name = VENDORS[i++] + property;
        if (value != null) {
          this.style(name, value);
        } else if ( (result = this.style(name)) ) {
          return result;
        }
      }
    },
    
    show: function() {
      this.style('display', 'block');
    },
    
    hide: function() {
      this.style('display', 'none');
    },
    
    // Size & Position
    
    height: function() {
      return this.rect().height;
    },
    
    width: function() {
      return this.rect().width;
    },
    
    offset: function() {
      var rect = this.rect();
      return {
        left: rect.left + window.pageXOffset,
        top: rect.top + window.pageYOffset,
        width: rect.width,
        height: rect.height
      };
    },
    
    rect: function() {
      return this[0].getBoundingClientRect();
    },
    
    // Element
    
    text: function(value) {
      if ($.defined(value)) {
        this.forEach(function(item) {
          item.textContent = value;
        });
      } else {
        return this[0].textContent;
      }
    },
    
    html: function(value) {
      if ($.defined(value)) {
        var type = $.type(value);
        this.forEach(function(item) {
          if (type === 'string' || type === 'number') {
            item.innerHTML = value;
          } else {
            item.innerHTML = null;
            if (type === 'array') {
              value.forEach(function(value) {
                item.appendChild(value);
              });
            } else {
              item.appendChild(value);
            }
          }
        });
      } else {
        return this[0].innerHTML;
      }
    },
    
    empty: function() {
      this.forEach(function(item) {
        item.innerHTML = null;
      });
    },
    
    append: _addElement(0),
    
    prepend: _addElement(1),
    
    replaceWith: _addElement(2),
    
    remove: function() {
      this.forEach(function(item) {
        if (item.parentNode) {
          item.parentNode.removeChild(item);
        }
      });
    },
    
    // Query
    
    find: function(selector) {
      return _flatten(this.map(function(item) {
        return $.query(item, selector);
      }));
    },
    
    parent: function(selector) {
      if (selector) {
        var ancestors = [];
        var nodes = this;
        
        while (nodes.length) {
          nodes = nodes.filter(function(node) {
            if (node && (node = node.parentNode) && 
                node !== document && ancestors.indexOf(node) < 0) {
              return ancestors.push(node);
            }
          });
        }

        return _filtered(ancestors, selector);
      }
      
      return $( this.map(function(item) {
        return item.parentNode;
      }) );
    },
    
    siblings: function(selector) {
      return _filtered(_flatten(this.map(function(item) {
        return item.parentNode.children.toArray().filter(function(child) {
          return child !== item;
        });
      })), selector);
    },
    
    children: function(selector) {
      return _filtered(_flatten(this.map(function(item) {
        return item.children.toArray();
      })), selector);
    },
    
    first: function() {
      return $(this[0]);
    },
    
    last: function() {
      return $(this[this.length - 1]);
    },
    
    closest: function(selector, context) {
      var node = this[0];
      var candidates = $(selector);
      if (!candidates.length) {
        node = null;
      }
      while (node && candidates.indexOf(node) < 0) {
        node = node !== context && node !== document && node.parentNode;
      }
      return $(node);
    }
  }, true);
  
  
  function _flatten(array) {
    return $(array.length ? [].concat.apply([], array) : array);
  }
  
  function _filtered(nodes, selector) {
    return $( selector === undefined ? nodes : nodes.filter(function(item) {
      return item.parentNode && 
             $.query(item.parentNode, selector).indexOf(item) >= 0;
    }) );
  }
  
  function _fragment(markup, tag) {
    var nodes;
    var container = HTML_CONTAINERS[tag != null && tag in HTML_CONTAINERS 
                                    ? tag : '_'];
    container.innerHTML = '' + markup;
    
    nodes = container.childNodes.toArray();
    nodes.forEach(function(element) {
      container.removeChild(element);
    });
    
    return nodes;
  }
  
  function _createElement(tagName) {
    return document.createElement(tagName);
  }
  
  function _createElements(elements, parentNode) {
    var nodes = [];
    var type = $.type(elements);
    
    var vendor = function(property, value) {
      return VENDORS.map(function(item) {
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
        for (property in properties) if ($.own(properties, property)) {
          value = properties[property];
          switch (property) {
            case 'tag':
            case 'components':
              // ignore properties
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
                          ($.isString(value) ? value : (+value + 'px')) );
              break;
              
            default:
              if (EVENT_PREFIX.test(property) && $.isFunction(value)) {
                $(element).on(property[2].toLowerCase() + property.slice(3), 
                              value);
              } else if (value != null) {
                element.setAttribute(property.replace(/[A-Z]/g, function(obj) {
                  return '-' + obj.toLowerCase();
                }), _toStringValue(value));
              }
          }
        }
        
        if (properties.components) {
          _createElements(properties.components, element);
        }
        
        if (styles.length) {
          element.style.cssText = styles.join(';');
        }
        
        if (parentNode) {
          parentNode.appendChild(element);
        }
        
        nodes.push(element);
      }
      
    });
    
    return nodes;
  }
  
  function _toStringValue(value) {
    return value === true 
            ? 'yes' : value === false 
                      ? 'no' : $.isObject(value) 
                               ? JSON.stringify(value) : value;
  }
  
  function _existsClass(el, name) {
    return el.classList ? el.classList.contains(name)
                        : (el.className.split(/\s+/g).indexOf(name) >= 0);
  }
  
  function _addClass(name) {
    return function(item) {
      if (!_existsClass(item, name)) {
        if (item.classList) {
          item.classList.add(name);
        } else {
          item.className = (item.className + ' ' + name).trim();
        }
      }
    };
  }
  
  function _removeClass(name) {
    return function(item) {
      var className = item.className;
      if (name && name != className) {
        if (_existsClass(item, name)) {
          if (item.classList) {
            item.classList.remove(name);
          } else {
            var exp = new RegExp('^' + [name, name, name].join(' | ') + '$', 
                                 'g');
            item.className = className.replace(exp, ' ')
                                      .replace(/\s+/g, ' ')
                                      .trim();
          }
        }
      } else {
        item.className = '';
      }
    };
  }
  
  function _computedStyle(element, property) {
    return document.defaultView.getComputedStyle(element, '')[property];
  }
  
  function _addElement(mode) {
    return function(value) {
      var type = $.type(value);
      var method = function(item, value) {
        if (mode) {
          if (mode === 2) { // replace
            item.parentNode.insertBefore(value, item);
          } else { // prepend
            item.insertBefore(value, item.firstChild);
          }
        } else { // append
          item.appendChild(value);
        }
      }
      
      this.forEach(function(item) {
        if (type === 'string' || type === 'number') {
          item.insertAdjacentHTML(mode ? (mode === 2 ? 'beforeBegin'
                                                     : 'afterBegin') 
                                       : 'beforeEnd', value);
        } else if (type === 'array') {
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
  
})(vee);
DEBUG && console.timeEnd('dom');