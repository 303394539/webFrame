DEBUG && console.time('cssmedia');;
(function($) {
	'use strict';

	var win = window;
	var _styleMedia = (win.styleMedia || win.media);

	if (_styleMedia) {

		var _hasMediaQueries = _styleMedia.matchMedium('only all');

		var _mediaIndex = 0;

		$.extend({
			cssmedia: function(media) {
				var _callbacks = [];
				var timeout;
				var _handleResize = function(e) {
					timeout && timeout.cancel();
					timeout = _handlefn.defer(30, e);
				}
				var _handlefn = function(e) {
					var matchMedium = _styleMedia.matchMedium(media);
					if (matchMedium) {
						_callbacks.forEach(function(item) {
							item.call(win, e);
						});
					}
				};
				return $.extend({}.prototype, {
					media: media || 'all',
					onListener: function(callback) {
						if (!_hasMediaQueries) {
							return;
						}
						if (_callbacks.length == 0) {
							$(win).on("resize", _handleResize, true);
						}
						_callbacks.push(callback);
						return this;
					},
					offListener: function(callback) {
						if (callback) {
							var len = _callbacks.length;
							var i = 0;
							while (i < len) {
								if (_callbacks[i] === callback && _callbacks.splice(i, 1) === 0) {
									$(win).off("resize", _handleResize, true);
								}
								i++;
							}
						} else {
							_callbacks = [];
							$(win).off("resize", _handleResize, true);
						}
						return this;
					}
				});
			}
		});

	} else {
		$.cssmedia = function() {
			console.error("BaicJS.cssmedia: browser don't support styleMedia");
		};
		$.cssmedia();
	}

})(Baic);
DEBUG && console.timeEnd('cssmedia');