---
layout: page
title: Widget Developer Guide
tagline: Create your own widgets!
class: developers
---
{% include JB/setup %}

# Developing Widgets for the Materia Platform #

Materia is built to be customizable and infinitely expandable.  Since it is merely a platform for serving and distributing widgets, more can be added.  Widgets are packaged into a single file and easily installed with a single command. This page describes the widget development process and tools required to create a widget package that can be installed in any Materia distribution.  The following guide will walk you through the steps required to build or customize the existing widgets.

# Prerequisites #

* A Running <a href="{{BASE_PATH}}/develop/deploying-materia.html">Materia Dev Server</a>
* [Materia-Widget-Dev_Kit](https://github.com/ucfcdl/Materia-Widget-Dev-Kit) repository
* [Materia-Core-Widgets](https://github.com/ucfcdl/Materia-Core-Widgets) repository (for examples and prototype code)
* [Flex SDK](http://www.adobe.com/cfusion/entitlement/index.cfm?e=flex3sdk) (for Flash/Flex-based widgets like the core widgets)


<aside>
	Materia core widgets are built in Flash/Flex and are compiled by the <code>Flex 3.6 SDK.</code> Future development is headed in the direction of HTML widgets so our dev kit will change as we build more support for them.
</aside>

# The Anatomy of a Widget #

A widget is a little application that depends on the Materia platform for authentication, authorization, analytics, and distribution.

The simplest widgets can be simply static web pages; however Materia is designed to do so much more. You can create:

* **Custom Creators** that allow you to design the interface users interact with to customize widgets.
* **Question Sets** to store widget customizations and content.  Creators can be used to input customizable content for widgets into a data structure we call Question Sets or, qSets.  This custom data holds questions, content, and settings for each instructor's customized widget.
* **Scorable** widgets that can be used to determine a student's performance.  A 0-100% score is saved by the widget and is verified on the server using a **Score Module** built for each widget.
* **Statistical Storage** that allows widgets to save custom statistical data (such as reaction times or click coordinates) by using Materia's storage API. This is a great tool for statistical analysis and experiments.

## The Structure of a Widget ##

Widgets are made up of several files that get compressed into a single `.wigt` package for easy distribution.
A widget package (`.wigt`) is comprised of the following directories:

	widget-name/
			_assets/ #optional directory to store assest for the demo
			_creator/ # where all the creator files are
			_engine/ # where all the creator files are
			_icons/ # icons for display in Materia
			_output/ # .wigt file is compiled into this directory
			_score/ # score module located here
			_screen-shots/ # screen shots for the widget preview
			build.yaml # describes how to build the widget
			demo.yaml # builds a qset for the demo widget
			install.yaml # describes how to install the widget
			README

## Installation Config: install.yaml ##

Every widget needs an `install.yaml` file which describes the various settings that will be put into your Materia database.

Here is an example install.yaml file from the Crossword widget:

	---
	general:
	  name: Crossword
	  group: Materia
	  height: 573
	  width: 715
	  in_catalog: Yes
	  is_editable: Yes
	  is_playable: Yes
	  is_qset_encrypted: Yes
	  is_answer_encrypted: Yes
	  is_storage_enabled: No
	  api_version: 2
	  files:
	    creator: swf/Creator.swf
	    player: swf/Engine.swf
	  flash_version: 10
	  score:
	  	is_scorable: Yes
	    score_module: Crossword
	    score_type: SERVER-CLIENT
	  meta_data:
	    features:
	    - Customizable
	    - Scorable
	  supported_data:
	  - Question/Answer
	  about: 'In Crossword, fill in the blank squares with: (a) words based on the clues provided in the text and/or (b) by the letters overlapping from other words.'
	  excerpt: >
	    A quiz tool that uses words and clues to
	    randomly generate a crossword puzzle.

### General Settings ###

* **name:** The displayed name of the widget
* **group:** The group name for the widget.
* **height:** The height of the widget in pixels. Use 0 if the widget should expand to the full height available.
* **width:** The width of the widget in pixels. Use 0 if the widget should expand to the full width available.
* **in_catalog:** 'Yes' if the widget should be publicly displayed on the widget catalog for creation and use. Generally, widgets not displayed in the catalog are specialized and lack a creator and are only available for creation through command line.
* **is_editable:** Reserved for future
* **is_playable:** 'Yes' if widget instances can be played. 'No' to disable playing of instances. This is typically only used when developing a widget to prevent users from seeing an unfinished widget.
* **is_qset_encrypted:** Reserved for future use.
* **is_answer_encrypted:** Reserved for future use.
* **is_storage_enabled:** 'Yes' if this widget uses the storage API features. 'No' otherwise.
* **api_version:** Corresponds to which version of the widget instance object this widget expects. You should specify version 1 here.

<aside>
	Group is currently only for your organizational purposes. Later versions of Materia may use this property to help better organize the widget catalog.
</aside>

### Files Settings ###

* **creator:** Location of the creator swf or html file. Not required if <strong>is_editable</strong> is set to 'No.'
* **player:** Location of the player swf or html file.
* **flash_version:** Minimum flash version required to view the player (and creator).

### score ###

<aside>
	Widgets that don't record scores still require a score module, though scoring logic may be omitted.
</aside>

* **is_scorable:** 'Yes' if the widget collects scores. 'No' otherwise.
* **score_module:** Name of the score module class (in score_module.php).
* **score_type:** Specifies how a widget is graded. Accepted values are:
	* SERVER - means grading will be handled by a Score Module on the server. **Preferred**
	* CLIENT - means your widget will tell Materia what the widget score should be.
	* SERVER-CLIENT - utilizes both methods.

### meta_data ###

* **features:** A list of features which will be presented in the widget catalog.<aside>While your widget can specify any number of features, Materia specifically looks for two defined features. If your widget is scorable you'll want to include <em>Scorable</em> here. If your widget includes a creator you'll want to include <em>Customizable</em>. These features allow users to filter the catalog page to find the widget they're looking for.</aside>
* **supported_data:** A list of the types of data which this widget supports. This will be presented in the widget catalog.<aside>Similarly, Materia looks for a few specific features here: <em>Question/Answer</em> and/or <em>Multiple Choice</em>.</aside>
* **about:** The text displayed on the widget detail page.
* **excerpt:** The text displayed on the widget catalog page.


## Demo Question Set: demo.yaml ##

This file provides a title and qSet which will be used when installed to create a widget demo.  Again, some great examples can be seen in the [Materia Core Widgets](https://github.com/ucfcdl/Materia-Core-Widgets).

## Example ##

	---
	name: Math Quiz
	qset:
	  version: 1
	  data:
	    questions...

## Optional Demo Media Assets: _assets_ ##

If your demo has media assets, include them in the optional **assets** folder, and reference them in your demo.yaml file with `<%MEDIA="_assets/1.jpg"%>`, `<%MEDIA="_assets/2.jpg"%>`, and so on (replacing `1.jpg`, `2.jpg`, etc. with the name of your asset files). The install script will find any `MEDIA` tags, upload the assets, and replace the tags with the resulting asset IDs before creating and installing the demo.

## Optional Score Module: _score-modules_ ##

You'll need both a score module and unit test file if your widget is scorable.  The `score_module.php` file is a php class which extends `Score_Module`.  Your score module should override the `checkAnswer` method.  Your implementation of this method should return a number of 0-100 representing the score for the given question response.  The `$log` object contains any data saved to the server by your widget (usually question or performance data).

### Basic score module example ##

	<?php
	namespace Materia;

	class Score_Modules_MyWidget extends Score_Module
	{
		public function check_answer($log)
		{
			if (isset($this->questions[$log->item_id]))
			{
				$question = $this->questions[$log->item_id];
				foreach ($question->answers as $answer)
				{
					if ($log->text == $answer['text'])
					{
						return $answer['value'];
						break;
					}
				}
			}

			return 0;
		}
	}
	?>

This example uses `Score_Module's` `questions` property which contains a reference to this widget instances' `qSet`.

<aside>
	Look at the <code>Score_Module</code> class for all of the properties available to you.
</aside>

### Score Module Unit Tests ###

The `test_score_module.php` file is a unit test which should extend FuelPHP's `TestCase` class.  This file typically should create a widget instance, create play logs, save those logs, then test to make sure your score module's `checkAnswer` function returns the correct score on each log.

	<?php
	class Test_Score_Modules_MyWidget extends TestCase
	{
		protected function setup()
		{
			Config::set('errors.throttle', 5000);
			$_SERVER['REMOTE_ADDR'] = '127.0.0.1';

			// load the admin task
			require_once(PKGPATH.'/materia/tasks/admin.php');
			\Fuel\Tasks\Admin::clear_cache(true);
		}

		protected function tearDown()
		{
			\RocketDuck\Auth_Manager::logout();
		}

		protected function _get_qset()
		{
			return json_decode('{ ... a valid qSet for your widget ... }');
		}

		protected function _asAuthor()
		{
			// create a new user and login as them
			// (see Materia-Core-Widgets repository for details)
		}

		protected function _makeWidget()
		{
			// create a new widget instance with your qSet
			// (see Materia-Core-Widgets repository for details)
		}

		protected function test_check_answer()
		{
			$inst = $this->_makeWidget();

			$playSession = \Materia\Api::session_play_create($inst->id);
			$qset = \Materia\Api::question_set_get($inst->id, $playSession);

			$logs = [];

			// generate a few logs to mimic actual interaction
			$logs[] = json_decode('{
				"text":"50",
				"type":1004,
				"value":"",
				"item_id":"'.$qset->data['items'][0]['items'][0]['id'].'",
				"game_time":10
			}');
			$logs[] = json_decode('{
				"text":"ONE HUNDRED5",
				"type":1004,
				"value":"",
				"item_id":"'.$qset->data['items'][0]['items'][1]['id'].'",
				"game_time":10
			}');
			$logs[] = json_decode('{
				"text":"",
				"type":2,
				"value":"",
				"item_id":0,
				"game_time":12
			}');

			$output = \Materia\Api::play_logs_save($playSession, $logs);

			$scores = \Materia\Api::widget_instance_scores_get($inst->id);

			$thisScore = \Materia\Api::widget_instance_play_scores_get($playSession);

			$this->assertInternalType('array', $thisScore);
			$this->assertEquals(25, $thisScore[0]['perc']);
		}
	}
	?>

## Display Icons: _icons_ ##

This folder should contain the icons for your widget. A total of four icons at various pixel sizes should be provided: icon-60.png, icon-92.png, icon-275.png and icon-394.png.

## Overview Screen Shots: _screen-shots_

This folder should contain screen shots and corresponding thumbnails for your widget.  These will be used in the detail page for your widget.

<aside>
	You will need to provide three screen shots.
</aside>


# Building HTML Widgets

## Getting Started

Create a project directory by running [mako scaffold]({{BASE_PATH}}/develop/mako.html) in any directory.

	cd path/to/dev/area
	mako scaffold "WIDGET NAME"


## Developing with Javascript

We prefer to use the [Revealing Module Pattern](https://www.google.com/search?q=revealing+module+pattern) in our code, so you may wish to utilize the same pattern for consistency.  Materia widgets use require.js to make sure the required libraries are included.  

### Including Common Libraries

We use [requireJS](http://requirejs.org/) to manage loading javascript dependencies. We have a couple of defaults defined for common libraries, but you can easily add your own.  In the template, you can see how this is initiated in the head of `widget.html`.

	<script type="text/javascript">
		require(['enginecore', 'score', 'underscore', 'js/widget'], function(util) {
			Materia.Engine.start(MyWidget.Engine);
		});
	</script>

In the above code, `enginecore` is the required Materia.Engine code required to get your widget working.  To add scoring support, we added a `require` for `score`, `underscore` for templating, and the final require is the actual Widget Engine located at `widget_dir/_engine/js/widget.js`.

Once everything is loaded, Materia.Engine is started and passed a reference to your own Widget Engine.

Your Widget Engine: WidgetName.Engine

The Engine Core: Materia.Engine

We recommend you use our built-in namespace implementation for your main javascript file. This is easy; simply define your object using `Namespace('MyWidgetName').Engine = function() {}`

Your Widget.Engine will be passed to `Materia.Engine.start()` as a callback and all you need to do is define a `start()` method in your engine.  It will be called as soon as Materia has loaded all the required assets.

## Materia.Score ##

The following methods are available for submitting score logs related to events that occur in your widget:

* **setOverallScore**
* **addQuestionScoreToComposite**
* **adjustOverallScore**
* **setQuestionScore**
* **addQuestionScoreAsOverallModifier**
* **adjustQuestionScore**
* **submitQuestionForScoring**
* **submitAdjustmentForScoring**
* **submitOverallForScoring**
* **addGlobalScoreFeedback**

## Materia.Storage ##

Implementation incomplete, check back again.

# Building HTML Widget Creators #

Incomplete at this time

# Building Flash or Flex Widget Engines #

Your widget engine needs to reference the Flex 3.6 SDK and the `flash_widget_dev_core.swc` from the [Materia-Widget-Dev-Kit](https://github.com/ucfcdl/Materia-Widget-Dev-Kit) repository. You'll need an `Engine.as` file which extends `nm.gameServ.engines.EngineCore`. Your engine file should override the `startEngine` method which is called when Materia has initialized all variables and the engine can allow the user to begin interacting. If your widget is customizable you'll want to use the `EngineCore.qSetData` static property which will contain a reference to the available `QuestionSet` object. If your widget is scorable you'll want to utilize the EngineCore's `scoring` instance of the `ScoreManager` class.  You may want to utilize the EngineCore's `storage` instance of the `StorageManager` class as well. Typically any graphics you need should be compiled into a `swc` and placed in the libs directory. When interaction with a widget is complete, your widget should call EngineCore's `end` method.

## A basic customizable and scorable widget engine example: ##

	package
	{
		// import statements ...

		public class Engine extends EngineCore
		{
			public override function startEngine
			{
				// generate display
				for each(var question in EngineCore.qSetData.items)
				{
					// draw questions here, using data from the question object
					// (i.e.) var questionSprite:Sprite = new Sprite(); ...
					questionSprite.addEventListener('clickAnswer', clickAnswer);
				}
				// create quiz submit button here
				// ...
				submitButton.addEventListener(MouseEvent.CLICK, clickSubmit);
			}

			private function clickAnswer(event)
			{
				// ...
				scoring.submitQuestionForScoring(questionID, userAnswer);
			}

			private function clickSubmit(event:MouseEvent)
			{
				end();
			}
		}
	}

# qSet Structure #

The qSet, at minimum, contains the following:

<pre><code class="language-json">{
	version: 1,
	data: { ... }
}</code></pre>

The `version` property allows you to version qSets. If you later modify your widget engine you could then support a newer type of qSet structure. The `data` property is simply an arbitrary object which you can define with the information you need.

## Standard qSet Structures

The qSet data property doesn't enforce a schema but Materia defines a standard structure that defines Multiple Choice and Single Answer questions. Conforming to this standard structure allows Materia to add questions to the question bank. Users can then use the 'import question' functionality to re-use questions created with your widget creator. If possible it is recommended to conform to this standard structure.

### Question Template ###

<pre><code class="language-javascript">{
	// tells Materia this is a question
	materiaType: 'question',

	// id assigned by server (never send a value unless you are re-using a question)
	id: 0,

	// type of question. builtin options: [QA, MC], custom allowed
	type: 'QA',

	// question data is an array of objects
	// usually we only have one, each must have a *text* property
	questions: [
		{
			text: "2 + 2 = ?",
		}
	],

	// answer data is an array of objects
	// each answer must have *text* and *value* properties
	answers:[
		{
			text: "2",
			value: 0

			// Optional. Answer scoped properties, like feedback
			options:{
				feedback: "Try again!"
			}
		}
	],

	// Optional. Question scoped properties, like it's location on a map
	options:{
		x: 12,
		y: 234
	}

}</code></pre>

### Multiple Choice Example ###

A full qSet containing one Multiple Choice question.  This question has two possible answers, one worth 0 percent (wrong), and the other worth 100 percent (correct).

<pre><code class="language-javascript">{
	version: 1,
	data:
	{
		// this property's name is up to you
		myQuestions: [
			{
				/* question 1 */
				materiaType: 'question',
				id: 0,
				type: 'MC',
				questions:
				[
					{text: "2 + 2 = ?"}
				],
				answers:
				[
					{text: "2", value: 0},
					{text: "4", value: 100},
				]
			},
			{ /* question 2 */ },
			{ /* question 3 */ }
		]
		
	}
}</code></pre>

### Question/Answer Example ###

A Question/Answer question.  This question has one correct answer.

<pre><code class="language-javascript">{
	materiaType: 'question',
	id: 0,
	type: 'QA',
	questions:
	[
		{text: "2 + 2 = ?"}
	],
	answers:
	[
		{text: "4", value: 100}
	]
}</code></pre>

<aside>
	You can define additional data in your qSet and still conform to the standard structure as long as you provide the fields as shown in the example above.  For example, it's common to add an 'options' object either in the data object or in question or answer objects.
</aside>

## Asset Structure ##

<pre><code class="language-javascript">{
	materiaType: 'asset', // tells Materia this is an asset
	id: 'cd83Ss', // id assigned to asset by the server (never send empty)

	// Optional. Asset scoped properties, like a title
	// Applies to **this** asset in **this** qset (does not transfer to other widgets)
	options: {
		title : 'Rocket Duck'
	}
}</code></pre>

### Assets in a Question ###

Assets within the scope of the entire question.  Like an song that plays durring the question.

<pre><code class="language-javascript">{
	materiaType: 'question',
	id: 0,
	type: 'QA',
	questions: [ {text: "Who composed this song?"} ],
	answers: [ {text: "Daft Punk", value: 100} ],
	options: {
		// Asset saved in currentQuestion.options.audio
		audio:{
			materiaType: 'asset',
			id: 'R28ld3'
		}
	}
}</code></pre>

Assets within the scope of the question's answers. Like a multiple choice where you choose the matching image.

<pre><code class="language-javascript">{
	materiaType: 'question',
	id: 0,
	type: 'MC',
	questions: [ {text: "Which of the images is a duck?"} ],
	answers:
	[
		{
			text: "",
			value: 100,
			// Asset saved in currentQuestion.answers[0].options.asset
			options: { asset:{ materiaType: 'asset', id: 'cd83Ss' } }
		},
		{
			text: "",
			value: 0,
			options: { asset:{ materiaType: 'asset', id: 'xd3rvR' } }
		}

	]
}</code></pre>

Keep an array of assets that aren't associated with the questions at all (like theme backgrounds).

<pre><code class="language-javascript">{
	version: 1,
	data:
	{
		question:
		{
			materiaType: 'question',
			id: 0,
			type: 'QA',
			questions: [ {text: "2 + 2 = ?"} ],
			answers: [ {text: "4", value: 100} ]
		},
		backgrounds: [
			// Asset saved in qSet.backgrounds[0]
			{ materiaType: 'asset', id: 'cdd3fs' },
			{ materiaType: 'asset', id: '0pdejF' }
		]
	}
}</code></pre>

<aside>
Assets can be placed just about anywhere arbitrarily, but we advise you keep them linked with the data that makes the most sense.  If the image is part of the answer, place it in the options of each individual answer.  If the asset is not tied to a question at all, save it outside the scope of that question. 
</aside>

# Building Flash or Flex Widget Creators #

If you intend for your widget to be customizable then you'll want to develop a widget creator. Your widget creator should be a Flex 3.6 project which will provide a UI to help users create a qSet which your widget engine can use. Your default file should be of type `materia:CreatorBase`.

Some important methods you may want to override:

* init: Called when the interface is ready to be built.
* checkForSave: Called when a user attempts to save their work. Return `false` to prevent the save action, `true` to allow it.
* getQSetForPublish: Should return a valid qSet.
* addImportedQuestion: Called for every question added via the 'Import questions' feature.
* importableQuestionTestFunction: Allows you to determine if a given question can be imported successfully. Return `false` to prevent a question from being imported and `true` to allow it.

<aside>
	More functions are available - take a look at <code>CreatorBase.mxml</code> for more information.
</aside>

# Basic Widget Creator Example #

<pre><code>&lt;materia:CreatorBase xmlns:mx="http://www.adobe.com/2006/mxml"
	xmlns:components="materia.components.*"
	xmlns:materia="materia.*"
	xmlns:qaGrid="materia.components.questionAnswerDataGrid.*" xmlns:local="*"
	width="100%" height="100%"&gt;

	&lt;!-- Flex UI code for your Widget here --&gt;

	&lt;mx:Script&gt;
		public override function checkForSave():Boolean
		{
			if(myQuestionsList.numQuestions == 0)
			{
				Alert.show("You don't have any questions!");
				return false;
			}

			return true;
		}

		public override function getQSetForSave():Object
		{
			var qSet:Object = {version:1, data:{}};
			// generate qset ...
			return qSet;
		}
	&lt;/mx:Script&gt;
&lt;/materia:CreatorBase&gt;</code></pre>

# Compiling with Mako #

[Mako]({BASE_PATH}}/develop/mako.html) automates the process of building and compiling the `.wigt` files.

## build.yaml ##

build.yaml files are used by [Mako]({BASE_PATH}}/develop/mako.html) to understand how to compile a widget.  There's a top-level `build.yaml` of type 'package' which points to the individual build.yaml files of each portion of the widget. Finally, the engine and creator have build files of type 'compile' which describe how to compile that portion of the widget.

## Compiling for production ##

To compile a .wigt package navigate into the directory of the widget you want to build and run

<pre><code class="bash">mako build</code></pre>

This creates a .wigt file in the `_output` directory. You can then easily install the widget using via the [widget:install]({BASE_PATH}/develop/installing-widgets.html) task or use mako develop to quickly test your widget.

## Compiling for development &amp; testing ##

You can skip package creation using mako develop.

### Validating packages

You can validate your package structure and install.yaml and demo.yaml files by navigating to your Materia's root directory and running

<pre><code class="bash">php oil r widget:install --validate-only packages/your-widget.wigt</code></pre>

# How Widget Creators Work #

Widget creators are loaded by the Javascript creator wrapper (materia.creator.js) using SWFObject (a Javascript library) and Actionscript’s ExternalInterface library. Flash creators are loaded in the embed function of materia.creator.js, where some important variables are passed to the creator and received in the init function of CreatorBase.mxml. This init function also sets up the ExternalInterface functions that are made available to the creator wrapper. For example: the save function of the creator wrapper calls the function getQSetForSave() which is made available in the init function of the CreatorBase.

Every Flash creator in our library extends CreatorBase and most override the ExternalInterface methods. Below is a list of the main methods that should be overridden and their purposes. As always, make sure to call `super.methodName()` when overriding.

* `public function init():void`

	This is the first function called when the creator is loaded and it is called both when creating a new widget and when editing one.
* `public function initNewWidget():void`

	This function is called after `init()` and is only called when creating a new widget. This distinction is important because creators sometimes need to be set-up differently when creating a new widget than when editing an existing one.

* `public function initExistingWidget(qset:QuestionGroup):void`

	This function is also called after `init()` and is only called when editing an existing widget. The qset for the widget being edited is passed in so it should be stored for future reference.

* `public function getQSetForSave():Object`
	This function is called by the creator wrapper and the object returned is stored in the database as the qset for this widget. If this widget is ever edited, an exact copy of this object should be provided in the initExistingWidget function.

* `public function getQSetForPublish():Object`
	This function is also called by the creator wrapper and has the same purpose as getQSetForSave except that the object returned here is expected to be final and error-proof. If the widget is incomplete or has errors, this function should return null and possibly show an alert (using the alert function built into CreatorBase).

There are a few other functions creators should override that aren’t essential for basic functionality but are often needed for a finished widget ready to go into the catalog. For example:

* `public function startImportingSet():void`

	This function is called when imported questions are about to be sent. This function allows the creator to make any preparations for importing questions.
* `public function addImportedQuestion(question:Question):void`

	This function is called once for every question that will be imported. For example, if 20 questions are imported, startImportingSet() is called once, addImportedQuestions() is called 20 times, and doneImportingSet() is called once afterwards.

* `public function doneImportingSet():void`

	This function is called once all questions are imported and passed in through the addImportedQuestions() function.

That’s about it for functions that should be overloaded but there are some functions that are still necessary to call sometimes. `CreatorBase.openMediaScreen(callback:Function)` is used to open the media screen and load an image. The callback provided will be passed an array of media items loaded. To get the URL to the image, use `CreatorConfig.getKogneatoAssetLink(input[0].ASETID)`.

# How Widget Engines (Players) Work #

Similar to the creators, engines are loaded by a Javascript player wrapper using SWFObject and Actionscript’s ExternalInterface. Unlike the creator where there are many methods to override, engines typically only override one function and go the rest of the way by using inherited functions. First we’ll go over the one function that should be overridden:

* `private function initWidget(qset:Object, instance:Object):void`

	This is the first function that is called (apart from the constructor) when the engine is loaded. It passes in the qset that was saved from the creator.

The following functions should most likely be used in engine development (our utility functions):

* `public function alert(title, message, type):void`

	This alert function is used by many players to display a dialog. The type parameter specifies the type of alert it will be (See constants in the AlertWindow class). To listen for a confirmation click, add an event listener using the string "dialogClick". This will fire when "OK" or "YES" is clicked but not when "Cancel" or "No" is clicked.

* `public function getImageAssetSprite(assetId, callback, data):void`

	This function loads an asset into a DisplayObject and passes it into the callback function. The EngineCore.as file contains thorough documentation on this function.

* `public function end(showScoreScreen, feedback):void`

	This function ends the game, submits the scores to the server, and takes the student to the score screen to see the final score.

There are also several functions that facilitate scoring in an instance of the Scoring class held in EngineCore. If your engine extends EngineCore (as it should), these functions should be available by typing scoring.functionName(). Note that the functionality of some scoring functions depends on the score type set in the database for that particular widget. The Scoring class is extensively documented and a quick look-over of its source code will provide all the necessary details.
