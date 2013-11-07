$(function() {
	var SEARCH_DELAY_MS = 200;
	var REFRESH_FAKE_DELAY_MS = 500;
	var CHANGE_SECTION_FADE_DELAY_MS = 250;

	var $widgetList = $('#list-container ul');
	var selectedWidget;
	var widgetsLoaded = false;

	var h1String = 'Select a Widget' + (system === '' ? '' : ' for use in ' + system) + ':';

	$('h1').html(h1String);
	$('#goto-new-widgets').click(function(event) {
		calloutRefreshLink();
	});
	$('#create-widget-button').click(function(event) {
		calloutRefreshLink();
	});
	$('#refresh').click(function(event) {
		event.preventDefault();
		hideRefreshLinkCallout();
		loadWidgets(REFRESH_FAKE_DELAY_MS);
	});
	$('.cancel-button').click(function(event) {
		event.preventDefault();

		setDisplayState('widgetSelected');
	});
	$('#search').keyup(function(event) {
		if(event.keyCode === 13) //enter
		{
			var $selected = $('#list-container li.selected');
			if($selected.length == 1)
			{
				var inst_id = $($selected[0]).attr('data-inst_id');
				Materia.Widget.getWidget(inst_id, function(widget) {
					selectWidget(widget);
				});
			}
		}
		else if(event.keyCode === 27) //esc
		{
			clearSearch();
		}
	});
	if(system !== '')
	{
		$('#success-message li:first-child').html('Students can interact with this widget in ' + system + '.');
		$('#success-message li:nth-child(2)').html('Any scores will be passed to ' + system + '.' );
	}

	Materia.TextFilter.setupInput($('#search'), search, SEARCH_DELAY_MS);

	setDisplayState('selectWidget');

	function hideRefreshLinkCallout()
	{
		if($('#refresh').attr('showing-qtip') === 'true')
		{
			$('#refresh').qtip('api').hide();
		}
	}

	function calloutRefreshLink()
	{
		if($('#refresh').attr('showing-qtip') !== 'true')
		{
			$('#refresh').attr('showing-qtip', 'true');

			$('#refresh').qtip({
				content: 'Click here to see your new widget',
				position: {
					corner: {
						target: 'leftMiddle',
						tooltip: 'rightMiddle'
					},
					adjust: {
						x: -10
					}
				},
				style: {
					background: '#b944cc',
					color: '#ffffff',

					padding: 10,
					border: {
						width: 2,
						radius: 5,
						color: '#b944cc'
					},
					tip:{
						corner: 'rightMiddle',
						size: {
							width: 10,
							height: 10
						}
					}
				},
				show: {
					ready: true
				}
			});
			$('#refresh').qtip('api').onHide = function(event) {
				$('#refresh').qtip('destroy');
				$('#refresh').attr('showing-qtip', 'false');
			};
		}
	}

	function search()
	{
		$('#list-container li').removeClass('selected');

		Materia.Widget.getWidgets(function(widgets) {
			var searchString = $.trim($('#search').val().toLowerCase().replace(/,/g, ' '));

			var hits = [];
			var misses = [];
			var terms = searchString.split(' ');
			var len = widgets.length;
			var len2 = terms.length;
			var match;
			var $hits;
			for(var i = 0; i < len; i++)
			{
				match = false;
				for(var j = 0; j < len2; j++)
				{
					if(widgets[i].searchCache.indexOf(terms[j]) > -1)
					{
						match = true;
					}
					else
					{
						match = false;
						break;
					}
				}
				if(match)
				{
					hits.push(widgets[i].element);
				}
				else
				{
					misses.push(widgets[i].element);
				}
			}

			$hits = $(hits);
			Materia.TextFilter.renderSearch($hits, $(misses), 'slide');

			Materia.TextFilter.clearHighlights($('#list-container li'));
			$hits.each(function() {
				Materia.TextFilter.highlight(searchString, $(this));
			});

			if(hits.length === 1)
			{
				$(hits[0]).addClass('selected');
			}
		});
	}

	function clearSearch()
	{
		$('#search').val('');
		Materia.TextFilter.clearSearch('#list-container li');
	}

	function loadWidgets(fakeDelay)
	{
		$('#list-container li:not(.template)').remove();
		clearSearch();

		$('#refresh').hide();
		$('#no-widgets-container').hide();
		$('#goto-new-widgets').hide();

		Materia.Set.Throbber.startSpin('#list-container', {withBackground:false, withDelay:false});
		if(typeof fakeDelay === 'undefined')
		{
			fakeDelay = 1;
		}

		setTimeout(function() {
			Materia.Widget.getWidgets(function(widgets)
			{
				$('#refresh').show();

				widgetsLoaded = true;

				Materia.Set.Throbber.stopSpin('#list-container');

				var len = widgets.length;
				var curWidget;

				if(len === 0)
				{
					$('#no-widgets-container').show();
					$('#goto-new-widgets').hide();
				}
				else
				{
					$('#no-widgets-container').hide();
					$('#goto-new-widgets').show();

					for(var i = 0; i < len; i++)
					{
						addWidgetToList(widgets[i]);
					}

					$('.embed-button').click(function(event) {
						event.preventDefault();

						var inst_id = $(this).parents('#list-container li').attr('data-inst_id');
						Materia.Widget.getWidget(inst_id, function(widget) {
							selectWidget(widget);
						});
					});

					$('#list-container li').click(function(event) {
						$('#list-container li').removeClass('selected');
						$(this).addClass('selected');
					});
				}
			}, {
				ignoreCache: true,
				sort: 'alpha'
			});
		}, fakeDelay);
	}

	function addWidgetToList(instance)
	{
		if(instance.is_draft)
		{
			$newItem = $('.template.draft').clone();
			$newItem.removeClass('template');
			$newItem.find('.view-at-materia').attr('href', BASE_URL + 'my-widgets/#' + instance.id);
		}
		else
		{
			$newItem = $('.template:not(.draft)').clone().removeClass('template');
		}

		$newItem.find('h2').html(instance.name);
		$newItem.find('h3').html(instance.widget.name);
		$newItem.find('.preview').attr('href', BASE_URL + 'preview/' + instance.id);
		$newItem.attr('data-inst_id', instance.id);

		$newItem.find('img').attr('src', Materia.Image.iconUrl(instance.widget.dir, 60));

		$widgetList.append($newItem);

		instance.element = $newItem.get(0);
	}

	function selectWidget(widget)
	{
		if(typeof selectedWidget !== 'undefined' && typeof selectedWidget.state !== 'undefined' && selectWidget.state === 'pending')
		{
			return;
		}

		selectedWidget = widget;
		selectedWidget.state = 'pending';

		setDisplayState('progress');
	}

	function finishProgressBarAndSetLocation()
	{
		$('.progress-container').addClass('success');
		$('.progress-container').find('span').html('Success!');
		$('.progressbar').progressbar('value', 100);
		setTimeout(function() {
			announceChoice();
			//setDisplayState('widgetSelected');
			//Materia.Set.Throbber.stopSpin('html');
			if(typeof RETURN_URL !== 'undefined' && RETURN_URL !== null)
			{
				var widgetURL = BASE_URL + 'lti/assignment?widget=' + selectedWidget.id;
				window.location = RETURN_URL + '?embed_type=basic_lti&url=' + encodeURI(widgetURL);
			}
		}, 1000);
	}

	function setDisplayState(newSection)
	{
		$('body')
			.removeClass('selectWidget')
			.removeClass('widgetSelected')
			.removeClass('progress')
			.addClass(newSection);

		if(newSection === 'selectWidget')
		{
			$('#list-container li').removeClass('selected');
			$('h1').html(h1String);
			if(typeof selectedWidget !== 'undefined')
			{
				$('.cancel-button').show();
			}
			clearSearch();
			if(!widgetsLoaded)
			{
				loadWidgets();
			}
			$('#select-widget').fadeIn(CHANGE_SECTION_FADE_DELAY_MS);
		}
		else if(newSection === 'progress')
		{
			$('#select-widget').fadeOut(CHANGE_SECTION_FADE_DELAY_MS, function() { $('#progress').fadeIn(CHANGE_SECTION_FADE_DELAY_MS); });
			$('.progressbar').progressbar();
			$('#progress h1').html(selectedWidget.name);
			startProgressBar();
			$('#progress').find('.widget-icon').attr('src', Materia.Image.iconUrl(selectedWidget.widget.dir, 92));
		}
	}

	function getRandInt(min, max)
	{
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function startProgressBar()
	{
		// create a random number of progress bar stops
		var availStops = [1,2,3,4,5,6,7,8,9];
		var stops = { tick:0 };
		for(var i = 0, len = getRandInt(3, 5); i < len; i++)
		{
			stops[availStops.splice(getRandInt(0, availStops.length), 1)] = true;
		}

		var intervalId = setInterval(function() {
			stops.tick++;
			if(typeof stops[stops.tick] !== 'undefined')
			{
				$('.progressbar').progressbar('value', stops.tick * 10);
			}
			if(stops.tick >= 10)
			{
				clearInterval(intervalId);
				finishProgressBarAndSetLocation();
			}
		}, 200);

		$(document).on('keyup', function(event) {
			if(event.keyCode === 16) // shift
			{
				$('.progress-container').find('span').html('Reticulating splines...');
				$(document).off('keyup');
			}
		})
	}

	function getAvailabilityStr(startDate, endDate)
	{
		var availability = Materia.Set.Availability.get(startDate, endDate);

		if(endDate < 0 && startDate < 0)
		{
			return 'Anytime';
		}
		else if(startDate < 0 && endDate > 0)
		{
			return 'Open until ' + availability.end.date + ' at ' + availability.end.time;
		}
		else if(startDate > 0 && endDate < 0)
		{
			return 'Anytime after ' + availability.start.date + ' at ' + availability.start.time;
		}
		else
		{
			return 'From ' + availability.start.date + ' at ' + availability.start.time + ' until ' + availability.end.date + ' at  ' + availability.end.time;
		}
	}

	function announceChoice()
	{
		var widgetData = $.extend({}, selectedWidget);
		delete widgetData.element;
		delete widgetData.searchCache;

		// the host system can listen for this postMessage "message" event:
		if(JSON.stringify)
		{
			if(parent.postMessage)
			{
				parent.postMessage(JSON.stringify(widgetData), '*');
			}
		}
	}
});