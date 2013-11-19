/* Namespace function for defining namespaces */
Namespace = function(ns)
{
	var a = ns.split('.'), o = window, len = a.length;
	for(var i = 0; i < len; i++)
	{
		o[a[i]] = o[a[i]] || {};
		o = o[a[i]];
	}
	return o;
};
var API_LINK = '/api/json/';

var isMobile = {
	Android: function() {
		return navigator.userAgent.match(/Android/i);
	},
	BlackBerry: function() {
		return navigator.userAgent.match(/BlackBerry/i);
	},
	iOS: function() {
		return navigator.userAgent.match(/iPhone|iPad|iPod/i);
	},
	Opera: function() {
		return navigator.userAgent.match(/Opera Mini/i);
	},
	Windows: function() {
		return navigator.userAgent.match(/IEMobile/i);
	},
	any: function() {
		return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
	}
};

// this code ensures that Opera runs onload/ready js events when navigating foward/back.
// http://stackoverflow.com/questions/10125701/
if(typeof history !== 'undefined' && typeof history.navigationMode !== 'undefined')
{
	history.navigationMode = 'compatible';
}

var konami = '';

$(document).ready(function() {
	$(document).keydown(function(e) {
		switch(e.which)
		{
			case 38:
				konami += 'up';
			break;
			case 40:
				konami += 'down';
			break;
			case 37:
				konami += 'left';
			break;
			case 39:
				konami += 'right';
			break;
			case 66:
				konami += 'b';
			break;
			case 65:
				konami += 'a';
			break;
			default:
				konami = '';
			break;
		}
		if(konami == 'upupdowndownleftrightleftrightba')
		{
			var beards = new Array('dusty_full', 'black_chops', 'grey_gandalf', 'red_soul');

			var $icon = $('.icon');
			var	meta = {};
			if($icon.hasClass('bearded'))
			{
				meta.beardmode = 'off';
				BEARD_MODE = false;

				$('link[href="/assets/css/beard_mode.css"]').remove();

				$('.icon').removeClass('bearded');
				$('.icon_container').removeClass('big_bearded');

				$('.widget .icon').each(function(index){

					for (var j=0; j<beards.length; j++)
					{
						if ( $(this).hasClass('small_'+beards[j]) )
						{
							$(this).removeClass('small_'+beards[j]);
						}

						if ( $('.icon_container').hasClass('med_'+beards[j]) )
						{
							$('.icon_container').removeClass('med_'+beards[j]);
						}
					}
				});
			}
			else
			{
				meta.beardmode = 'on';
				BEARD_MODE = true;
				$('link:last').after('<link rel="stylesheet" href="/assets/css/beard_mode.css" type="text/css" data-src="page" />');

				// my widgets
				$('.widget .icon').addClass('bearded');
				$('.icon_container').addClass('big_bearded');
				$('.widget .icon').each(function(index) {

					var rand = Math.floor((Math.random()*beards.length)+1) - 1;

					$(this).addClass('small_'+beards[rand]);

					if ($(this).parent().hasClass('gameSelected'))
					{
						$('.icon_container').addClass('med_'+beards[rand]);
					}
				});
				/*
				// widget detail
				$('.widget_detail img:first-child').addClass('bigger_bearded').each(function() {
					var rand = Math.floor((Math.random()*beards.length)+1) - 1;
					$(this).addClass('xlarge_'+beards[rand]);
				});
				*/
			}
			$.post('/settings', meta);
			konami = '';
		}
	});
});