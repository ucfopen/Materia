/**
 * Creates a Spinner and a semi-faded background for the throbbed element.
 */
$.fn.spin = function(opts) {
	var SHOW_SPINNER_DELAY_MS = 500;
	var FADE_IN_SPINNER_DURATION_MS = 500;
	var FADE_OUT_SPINNER_DURATION_MS = 250;

	var destroySpinner = function($el)
	{
		if(typeof $el !== 'undefined' && typeof $el.data !== 'undefined')
		{
			var data = $el.data();
			// kill the spinner and timer
			if(data.timer)
			{
				clearTimeout(data.timer);
			}
			//$(this).children().show();
			if(data.spinner)
			{
				data.spinner.stop();
				delete data.spinner;
			}
			if(data.fader)
			{
				$fader = $(data.fader);
				$fader.animate({
					opacity: 0
				}, FADE_OUT_SPINNER_DURATION_MS, function() {
					$(data.fader).remove();
				});
			}
		}
	};

	this.each(function() {
		var $this = $(this);
		var data = $this.data();

		// Destroy any previous spinners for this element
		destroySpinner($this);

		// create the spinner and the background
		if (opts !== false) {
			var defaults = {
				lines: 13, // The number of lines to draw
				length: 10, // The length of each line
				width: 4, // The line thickness
				radius: 10, // The radius of the inner circle
				rotate: 0, // The rotation offset
				color: '#000', // #rgb or #rrggbb
				speed: 1, // Rounds per second
				trail: 60, // Afterglow percentage
				shadow: false, // Whether to render a shadow
				hwaccel: false, // Whether to use hardware acceleration
				className: 'spinner', // The CSS class to assign to the spinner
				zIndex: 1099, // The z-index (defaults to 2000000000)
				top: 'auto', // Top position relative to parent in px
				left: 'auto', // Left position relative to parent in px

				//custom options:
				withBackground: true, // Show the fader background clip
				withDelay: true, // Doesn't show the spinner immedately
				absolute: true // Attach to body and overlay with position absolutetly
			};

			opts = $.extend(defaults, opts);
			//opts = defaults;

			if(!opts.withDelay)
			{
				SHOW_SPINNER_DELAY_MS = 0;
				FADE_IN_SPINNER_DURATION_MS = 0;
				FADE_OUT_SPINNER_DURATION_MS = 0;
			}

			//Set a timeout so if stopSpin is called before the timeout has been reached, the spinner won't fire.
			data.timer = setTimeout(function() {
				data.fader = document.createElement('div');
				var $fader   = $(data.fader);
				var elHeight = $this.outerHeight(true);
				var elWidth  = $this.outerWidth(true);
				var position = $this.offset();
				var elleft   = position.left;
				var eltop    = position.top;

				$fader.css({
					'background' : opts.withBackground ? 'rgba(0, 0, 0, .2)' : 'none',
					'z-index' : 9998,
					'opacity': 0,
					'overflow': 'hidden',
					'position' : 'absolute'
				});

				if(opts.absolute)
				{
					$fader.css({
						'top' : eltop,
						'left' : elleft,
						'width' : $this.outerWidth(true) + 2,
						'height' : $this.outerHeight(true) + 2
					});
				}
				else
				{
					$fader.css({
						'top': 0,
						'left': 0,
						'width' : $this.width(),
						'height' : $this.height()
					});
				}

				(opts.absolute ? $('body') : $this).append($fader);
				$fader.animate({
					opacity: 1
				}, FADE_IN_SPINNER_DURATION_MS);

				// remove non-spin.js options:
				delete opts.withBackground;
				delete opts.withDelay;
				delete opts.absolute;

				data.spinner = new Spinner($.extend({color: $fader.css('color')}, opts)).spin(data.fader);
				//clearTimeout(data.timer);
			}, SHOW_SPINNER_DELAY_MS);
		}
		else if(opts === false)
		{
			destroySpinner($this);
		}
	});

	return this;
};