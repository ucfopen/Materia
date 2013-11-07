(function( $ ){
	// Make the tab number a constant
	var TAB = '9';
	var tabArray = new Array();
	var methods = {
		/**
		 * Default init function, called with $(selector).tablock();
		 */
		init : function( options ) 
		{
			//The following try binds the tab index to the modal window, but requires jQuery UI to work.
			try {
				//Little known jQuery UI selector, :tabbable. Will find anything with a tab index.
				tabArray =  $(this).find(':tabbable');

				// Keep track of where tab is.
				var tabPlace = -1;

				// Loop through the array, and if one of those elements is currently focused, make the tabPlace 
				for(x=0; x<tabArray.length; x++)
				{
					if($(tabArray[x]).is(":focus"))
					{
						tabPlace = x;
					}
				}

				// Capture the tab key, and go through our custom tab array
				$(window).on("keydown.tablock", function(e) {
					var code = e.keyCode || e.which;
					//If they pressed the tab key
					if (code == TAB) {
						$(tabArray[tabPlace]).off("blur.resetTab");
						e.preventDefault();
						// and they have the shift button down
						if(e.shiftKey)
						{
							// Go back one
							tabPlace--;

							// if you're at the beginning of the array, go to the end
							if(tabPlace == -1)
							{
								tabPlace = (tabArray.length-1);
							}
						}
						// But if they don't have the shift key down
						else
						{
							// Go forward one
							tabPlace++;
							// If they're at the end of the array go to the beginning.
							if(tabPlace == tabArray.length)
							{
								tabPlace = 0;
							}
						}

						$(tabArray[tabPlace]).on("blur.resetTab", function() {
							tabPlace = -1;
						});
						tabArray[tabPlace].focus();
					}
				});
			}
			catch(e)
			{
				$.error("This plugin requires the jQuery UI Core ");
			}
		},
		/**
		 * Releases the lock on the tab and makes the default tabbing work
		 */
		release : function(options) {
			$(window).off("keydown.tablock");
		},

		/**
		 * Rebuilds the tab array to capture any dynamically inserted focusable elements
		 */
		reset : function(options) {
			try 
			{
				tabArray =  $(this).find(':tabbable');
			}
			catch(e)
			{
				$.error("This plugin requires the jQuery UI Core ");
			}

		}
	};

	$.fn.tablock = function( method ) {
		//Initial settings
		var settings = {};

		if ( methods[method] ) {
			options = $.extend( settings, Array.prototype.slice.call( arguments, 1 )[0] );
			return methods[method].apply( this, [options]);
		}
		else if ( typeof method === 'object' || ! method ) {
			options = $.extend( settings, arguments[0] );
			return methods.init.apply( this, [options] );
		}
		else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.tablock' );
		}
	};

})( jQuery );