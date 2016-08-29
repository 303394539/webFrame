DEBUG && console.time('browser');;
(function($) {
  'use strict';

  var userAgent = navigator.userAgent.toLowerCase(),
    msPointerEnabled = !!window.navigator.msPointerEnabled,
    EXPS = {
      mobile: /iphone|android|windows phone|ipod|ipad|apple.*mobile.*safari/,
      ios: /iphone|ipod|ipad/,
      iphone: /(iphone\sos)\s([\d_]+)/,
      android: /(android)\s+([\d.]+)/,
      ipad: /(ipad).*os\s([\d_]+)/,
      ipod: /(ipod).*os\s([\d_]+)/,
      version: /.*(?:rv|chrome|webkit|version|ie)[\/: ](.+?)([ \\);]|$)/,
      wx: /micromessenger\/([\d\.]+)/
    },
    match;

  $.extend({
    browser: {
      touch: (('ontouchstart' in window) || msPointerEnabled),
      gesture: (('ongesturestart' in window) || msPointerEnabled),
      ios: EXPS.ios.test(userAgent),
      wx: EXPS.wx.test(userAgent),
      android: EXPS.android.test(userAgent),
      mobile: EXPS.mobile.test(userAgent),
      version: (userAgent.match(EXPS.mobile.test(userAgent) ? EXPS.mversion : EXPS.version) || [])[1] || ""
    }
  });

  if ($.browser.ios) {
    match = userAgent.match(EXPS.iphone) || userAgent.match(EXPS.ipad) || userAgent.match(EXPS.ipod);
    if (match) $.browser.version = match[2].replace(/_/g, '.');
  } else if ($.browser.android) {
    match = userAgent.match(EXPS.android)
    if (match) $.browser.version = match[2];
  }
  if ($.browser.wx) {
    $.browser.wxversion = (userAgent.match(EXPS.wx) || [])[1] || "0";
  }

})(Baic);
DEBUG && console.timeEnd('browser');