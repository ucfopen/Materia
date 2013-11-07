---
layout: page
title: LTI Client Side Extensions
tagline: Embedding Materia in your Javascript App
class: developers
---
{% include JB/setup %}

# Materia Javascript Events #

If you're embedding Materia into another application using LTI, there are a few javascript events that can help your parent application know more about what is happing in the Materia UI. These events are broadcast using [postMessage](https://developer.mozilla.org/en-US/docs/DOM/window.postMessage) so that your application can listen to them. Awesome, right?

## Widget Display Screen ##
An event is fired when a widget is completed and the student is shown their score.  The object sent by the event has the following properties:

* **type**: "materiaScoreRecorded"
* **widget**: a widget instance object, view the Widget_Instance PHP class for properties
* **score**: the percentage score received (0-100)

Here is an example you would use to embed and listen to the widget selection screen:

	<html>
		<head>
			<script type="text/javascript">
				$(function() {
					$('#form').submit();
				});

				// (cross browser code left out)
				addEventListener('message', onPostMessage, false);
				function onPostMessage(event)
				{
					var data = $.parseJSON(event.data);
					if(data.type == "materiaScoreRecorded")
					{
						alert('For ' + data.widget.title + ' you got ' + data.score + '%');
					}
				}
			</script>
		</head>
		<body>
			<form name="form" id="form" action="http://materia/lti/assignment" method="POST" target="tool-form">
				<input name="..." id="..." value="..." hidden="true" />
			<iframe name="tool-form" id="tool-form"></iframe>
		</body>
	</html>

## Widget Selection Screen ##
Take a look at the example below for embedding the selection screen into your application. The object sent by the event is a widget instance object.

	<html>
		<head>
			<script type="text/javascript">
				$(function() {
					// submit the form as soon as we can
					// this will populate the iframe with the selection screen
					$('#form').submit();
				});

				// we use postMessage to listen to the selection screen
				// (note: IE7 and below doesn't support postMessage!):
				if(typeof window.addEventListener !== 'undefined')
				{
					window.addEventListener('message', onWidgetSelected, false);
				}
				else if(typeof window.attachEvent !== 'undefined')
				{
					window.attachEvent('onmessage', onWidgetSelected);
				}

				function onWidgetSelected(result)
				{
					// The widget has been selected - now we can respond to it.
					alert("You selected " + result.data.title);

					// Assuming this is a popup window, we can close the window.
					window.close();
				}
			</script>
		</head>
		<body>
			<form name="form" id="form" action="http://materia/lti/assignment" method="POST" target="tool-form">
				<input name="..." id="..." value="..." hidden="true" />
			</form>
			<iframe name="tool-form" id="tool-form"></iframe>
		</body>
	</html>

Here's an example of how we've implemented this in one of our own tools:

0. Create a form with the action set to ```http://materia/lti/assignment``` via post. This form should include the necessary LTI paramaters as hidden1. ts. Typically you will need to generate those parameters on the server due to the oauth signing security.
0. Create an iframe and set the form's target to this iframe.
0. Submit the form to populate the iframe with the Materia selection page
0. Optionally listen to the iFrame to hear the message event when a widget is selected. The ```data``` property in the object returned is an object detailing information about the selected widget.