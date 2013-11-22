/**
 * This is the popup jQuery plugin. Here's some examples.
 *
 * defaults:
 * {
 *      //Whether the background darkens or not.
 *      modal                : true,
 *      //The style of the popup window (currently either default or dark).
 *      backgroundStyle      : 'default',
 *      //The html to be entered into the popup window.
 *      html                 : '',
 *      //The name of the popup window (used for styling, selected with #popup.className)
 *      className            : '',
 *      //The href of the html if on a different file (don't use this and html together)
 *      src                  : '',
 *      //An array of selectors that, when clicked, will close the popup window.
 *      closingSelectors     : [],
 *      //Whether clicking the background will close the popup or not. default true
 *      backgroundClose      : true
 * };
 *
 * Create a popup with default parameters:
 *
 *  //Bind a link or a button to call the popup window.
 *	$('#open').jqmodal({
 *		html             : '<p>Populates the popup with html<p><p><button id="close">Close</button>',
 *		closingSelectors : ['#close']
 *	});
 **/

(function( $ ){
	//I really like the revealing modual pattern way of setting stuff up, so I sort of set up the methods like that
	var methods = {
		/**
		 * Default init function, called with $(selector).jqmodal();
		 */
		init : function( options, callback )
		{
			//Binds the button to the popup
			$(this).click(function(e) {
				e.preventDefault();
				methods.generate(options, callback);
			});
		},

		/**
		 * Handles window creation, callable from two places.
		 */
		generate: function ( options, callback )
		{
			//Makes sure there's not already a popup there
			if($('#popup').length > 0)
			{
				return false;
			}

			//If the background needs to be darkened
			if(options.modal)
			{
				methods.modal(options.backgroundClose);
			}
			//Prepends the body with the popup, and adds the desired background style to it.
			$('body').prepend('<div id="popup" class="'+options.backgroundStyle+'"></div>');

			//If a name was chosen, add that class name to the popup div.
			if(options.className != '')
			{
				$('#popup').addClass(options.className);
			}
			$('#popup').hide();

			var inner = '';
			if(options.html && options.src)
			{
				//Throws an error if both the html and src options are filled out.
				$.error('Cannot have both html and src declarations in jqmodal, pick one or the other.');
			}
			if(options.html)
			{
				methods.build(options.html, options, callback);
			}
			else if(options.src)
			{
				//$.load() is a little weird because it needs a div to load into. Loading into a hidden dump div allows for the calculations to put it in the middle of the screen to happen after the information is loaded into the popup div.
				$('body').prepend('<div id="dump"></div>');
				$('#dump').hide().load(options.src, function() {
					var html = $('#dump').html();
					$('#dump').remove();
					methods.build(html, options, callback);
				});
			}
		},

		/**
		 * Populates the popup window and positions it in the middle of the screen.
		 */
		build : function( inner, options, callback )
		{
			$('#popup').html(inner);

			//gets the middle positions of the window.
			var leftMarginMinusWidthHalfWay = ($(window).width()/2) - ($('#popup').width()/2);
			var topMarginMinusHeightHalfWay = ($(window).height()/2) - ($('#popup').height()/2);

			$('#popup').css({'left' : leftMarginMinusWidthHalfWay, 'top' : topMarginMinusHeightHalfWay});
			$('#popup').fadeIn(300);

			//If there are any closing selectors chosen, then for each closing selector, bind it to close the popup.
			if(options.closingSelectors.length > 0)
			{
				for(var i in options.closingSelectors)
				{
					methods.closingSelectors(options.closingSelectors[i]);
				}
			}

			$("#popup").tablock();

			//If there's a callback, it gets fired here.
			if(callback)
			{
				callback();
			}

			$(window).resize(function(){
				var leftMarginMinusWidthHalfWay = ($(window).width()/2) - ($('#popup').width()/2);
				var topMarginMinusHeightHalfWay = ($(window).height()/2) - ($('#popup').height()/2);

				$('#popup').css({'left' : leftMarginMinusWidthHalfWay, 'top' : topMarginMinusHeightHalfWay});

				var width = $(document).width()+100;
				var height = $(document).height()+100;

				$('#popupback').width(width);
				$('#popupback').height(height);
			});
		},
		/**
		 * try to bind the tab index to the modal window. Requires jQuery UI.
		 * @return null
		 */
		tabTracker : function()
		{
			//The following try binds the tab index to the modal window, but requires jQuery UI to work.
			try {
				//Little known jQuery UI selector, :tabbable. Will find anything that's able to be selected with the tab key.
				var tabArray =  $('#popup').find(':tabbable');
				var tabPlace = -1;
				for(x=0; x<tabArray.length; x++)
				{
					if($(tabArray[x]).is(":focus"))
					{
						tabPlace = x;
					}
				}
				$(window).keydown(function(e) {
					var code = e.keyCode || e.which;
					if (code == '9') { //tab key
						e.preventDefault();
						if(e.shiftKey)
						{
							tabPlace--;
							if(tabPlace == -1)
							{
								tabPlace = (tabArray.length-1);
							}
						}
						else
						{
							tabPlace++;
							if(tabPlace == tabArray.length)
							{
								tabPlace = 0;
							}
						}
						tabArray[tabPlace].focus();
					}
				});
			}
			catch(e)
			{
				//console.log(e.message);
			}
		},
		/**
		 * Binds the selected element to close the popup window.
		 */
		closingSelectors : function( element )
		{
			$(element).click(function(e) {
				e.preventDefault();
				methods.close();
			});
		},
		/**
		 * Makes the darkened background
		 */
		modal : function( bgClose )
		{
			width = $(document).width()+100;
			height = $(document).height()+100;

			$('body').prepend('<div id="popupback"></div>');

			$('#popupback').hide();
			$('#popupback').fadeIn(300, function(){
				//Adds a click-to-close function on the background.
				if(bgClose)
				{
					methods.closingSelectors($('#popupback'));
				}
			});
			$('#popupback').width(width);
			$('#popupback').height(height);
		},

		close : function()
		{
			if($("#popup").length > 0) { $("#popup").fadeOut(300,function(){$('#popup').remove();}); }
			if($("#popupback").length > 0) { $("#popupback").fadeOut(300,function(){$('#popupback').remove();}); }
			$(window).unbind('keydown');

			$('#popup').trigger("close"); // trigger a close event
		}
	};

	$.fn.jqmodal = function( options, callback ) {
		//Initial settings
		var settings = {
			'modal'            : true,
			'backgroundStyle'  : 'default',
			'html'             : '',
			'className'        : '',
			'src'              : '',
			'closingSelectors' : [],
			'backgroundClose'  : true,
			'tabPlace'         : 0,
		};

		if(typeof options == 'object')
		{
			options = $.extend( settings, options );
		}
		return methods.init.apply( this, arguments, callback );
	};

	$.jqmodal = function( method, arguments ) {
		if(method == 'close')
		{
			methods.close();
		}
		else if(method == "tabTracker")
		{
			if(typeof arguments == 'object')
			{
				methods.tabTracker(arguments.window);
			}
			else
			{
				methods.tabTracker(arguments);
			}
		}
	};

	$.jqmodal.standalone = function(options, callback) {
		methods.generate(options, callback);
	};

})( jQuery );