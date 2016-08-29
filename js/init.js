define("init", ["config", "jquery", "touch", "url", "md5", "slides"], function(require, exports, module){
	var $$ = require("config");
	var $ = require("jquery");
	var url = require("url");
	var md5 = require("md5");
	require("touch")($);
  require("slides");

	var query = url(location.href).param();

	var body = $(document.body);

	$$.fake = query.fake && md5(query.fake);
	$$.cmd = query.cmd && md5(query.cmd);

	var options = {
		iscroll: true,
		menu: false,
		wx: true,
		copyright: true
	};
	var callback = function() {
		var pageInit = require("page").pageInit;
		if ($.type(pageInit) !== 'undefined' && $.isFunction(pageInit)) {
			var pageInitOptions = pageInit($, query);
			if(pageInitOptions){
				if (!$.isPlainObject(pageInitOptions) && $.type(pageInitOptions) === 'boolean') {
					$.each(options, function(key, val) {
						options[key] = pageInitOptions;
					});
				} else if (pageInitOptions && $.type(pageInitOptions) === 'object') {
					$.extend(options, pageInitOptions, true);
				} else {
					console.log("pageInit如果没有值可以不返回");
				}
			}
		}
	};
	callback();
});