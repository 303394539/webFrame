DEBUG && console.time('env');
(function($) {
  'use strict';
  
  var msPointerEnabled = !!window.navigator.msPointerEnabled;
  var userAgent = navigator.userAgent;
  
  var platforms = [
    // Android 2 - 4
    {n: 'android', g: 0, r: /Android (\d+)/},
    // iOS 3 - 7 / iPhone
    {n: 'ios', g: 0, r: /iPhone OS (\d+)/, x:{iphone: 1}},
    // iOS 3 - 7 / iPad
    {n: 'ios', g: 0, r: /iPad;(?: U;)? CPU OS (\d+)/, x:{ipad: 1}},
    // Windows Phone 7 - 8
    {n: 'wpos', g: 0, r: /Windows Phone (?:OS )?(\d+)[.\d]+/},
    // Kindle Fire
    {n: 'android', g: 0, r: /Silk\/1./, v: 2, x:{silk: 1}},
    // Kindle Fire HD
    {n: 'android', g: 0, r: /Silk\/2./, v: 4, x:{silk: 2}},
    // webOS 1 - 3
    {n: 'webos', g: 0, r: /(?:web|hpw)OS\/(\d+)/},
    // webOS 4 / OpenWebOS
    {n: 'webos', g: 0, r: /WebAppManager|Isis/, v: 4},
    // FirefoxOS
    {n: 'ffos', g: 0, r: /Mobile;.*Firefox\/(\d+)/},
    // Blackberry Playbook
    {n: 'blackberry', g: 0, r: /PlayBook/i, v: 2},
    // Blackberry 10+
    {n: 'blackberry', g: 0, r: /BB1\d;.*Version\/(\d+\.\d+)/},
    // Tizen
    {n: 'tizen', g: 0, r: /Tizen (\d+)/},
    
    // Safari
    {n: 'safari', g: 1, r: /Version\/(\d+)[.\d]+.+Safari/},
    // Chrome on iOS
    {n: 'chrome', g: 1, r: /CriOS\/(\d+)[.\d]+.+Safari+/},
    // Chrome
    {n: 'chrome', g: 1, r: /Chrome\/(\d+)[.\d]+/},
    // IE 8 - 10
    {n: 'ie', g: 1, r: /MSIE (\d+)/},
    // IE 11
    {n: 'ie', g: 1, r: /Trident\/.*; rv:(\d+)/},
    // desktop Firefox
    {n: 'firefox', g: 1, r: /Firefox\/(\d+)/},
    
    // Wechat (Weixin)
    {n: 'wechat', g: 2, r: /MicroMessageer\/(\d+)/}
  ];
  
  var env = {
    touch: (('ontouchstart' in window) || msPointerEnabled),
    gesture: (('ongesturestart' in window) || msPointerEnabled),
    online: navigator.onLine,
    screen: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };
  
  var status = [0, 0]; // os, browser
  var i = 0;
  var item, matches;
  
  while ( (item = platforms[i++]) ) {
    if (!status[item.g] && (matches = item.r.exec(userAgent)) ) {
      status[item.g] = env[item.n] = item.v || +matches[1];
      if (item.x) {
        $.mixin(env, item.x);
      }
    }
  }
  
  // these platforms only allow one argument for console.log
  // env.dumbConsole = !!(env.android || env.ios || env.webos);
  
  env.mobile = !!(status[0]);
  
  $.env = env;
})(vee);
DEBUG && console.timeEnd('env');