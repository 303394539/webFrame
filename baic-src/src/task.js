DEBUG && console.time('task');;
(function($) {
  'use strict';

  var asap = (function() {
    // Use the fastest possible means to execute a task in a future turn
    // of the event loop.

    // linked list of tasks (single, with head node)
    var head = {
      task: void 0,
      next: null
    };
    var tail = head;
    var flushing = false;
    var requestFlush = void 0;

    function flush() {
      /* jshint loopfunc: true */

      while (head.next) {
        head = head.next;
        var task = head.task;
        head.task = void 0;

        try {
          task();

        } catch (e) {
          setTimeout(function() {
            throw e;
          }, 0);
        }
      }

      flushing = false;
    }

    if (typeof MessageChannel !== "undefined") {
      // modern browsers
      // http://www.nonblocking.io/2011/06/windownexttick.html
      var channel = new MessageChannel();
      channel.port1.onmessage = flush;
      requestFlush = function() {
        channel.port2.postMessage(0);
      };

    } else {
      // old browsers
      requestFlush = function() {
        setTimeout(flush, 0);
      };
    }

    return function(task) {
      tail = tail.next = {
        task: task,
        next: null
      };

      if (!flushing) {
        flushing = true;
        requestFlush();
      }
    }
  }).call(this)

  var _Task = function(asap){
    this.__asap__ = asap
    return this
  }
  var _index = 0;
  var _queue = {};
  var _queueArgs = {};
  var _async = {};
  var _asyncArgs = {};

  $.extend(_Task.prototype, {
    scope: function(fn){
      if(this.__asap__){
        asap(fn)
      }else{
        fn();
      }
    }
  })

  var _runQueue = function(){
    _queue.forEach(function(fn, key){
      var args = _queueArgs[key]
      fn.result = fn.apply(args[0], args.slice(1))
    })
    return new _Task();
  }

  var _runAsync = function(){
    _async.forEach(function(fn, key){
      asap(function(){
        var args = _asyncArgs[key]
        fn.result = fn.apply(args[0], args.slice(1))
      })
    })
    return new _Task(true);
  }

  var _run = function(){
    asap(_runQueue)
    _runAsync()
    return new _Task(true);
  }

  $.extend(_Task, {
    run: _run,
    runQueue: _runQueue,
    runAsync: _runAsync,
    clean: function(){
      asap(function(){
        _index = 0;
        _queue = {};
        _queueArgs = {};
        _async = {};
        _asyncArgs = {};
      })
    },
    inject: function(){
      var args = arguments.toArray();
      var scope = args[0];
      if(!scope){
        return {}
      }
      if(scope.__async__){
        asap(function(){
          _asyncArgs[scope.__taskindex__] = args;
        })
      }else{
        _queueArgs[scope.__taskindex__] = args;
      }
      return scope
    },
    expose: function(){
      if(DEBUG){
        console.group('task.js');
        console.log('_index:', _index);
        console.log('_queue:', _queue);
        console.log('_queueArgs:', JSON.stringify(_queueArgs));
        console.log('_async:', _async);
        console.log('_asyncArgs:', JSON.stringify(_asyncArgs));
        console.groupEnd();
      }
    },
    asyncExpose: function(){
      if(DEBUG){
        asap(_Task.expose)
      }
    }
  })

  $.extend(Function.prototype, {
    queue: function(){
      var args = arguments.toArray()
      args.unshift(this)
      _queue[_index] = this
      _queueArgs[_index] = args
      this.__taskindex__ = _index
      this.__async__ = false
      _index++;
      return this
    },
    async: function(){
      var args = arguments.toArray()
      args.unshift(this)
      _async[_index] = this
      _asyncArgs[_index] = args
      this.__taskindex__ = _index
      this.__async__ = true
      _index++;
      return this
    },
    inject: function(){
      return _Task.inject.apply(this, [this].concat(arguments.toArray()))
    }
  })

  $.extend({
    task: _Task,
    runAsyncTask: _runAsync,
    runQueueTask: _runQueue,
    runTask: _run,
    cleanTask: function(){
      _Task.clean();
    }
  })

})(Baic);
DEBUG && console.timeEnd('task');