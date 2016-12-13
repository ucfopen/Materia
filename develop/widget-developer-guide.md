---
layout: page
title: Widget Developer Guide
tagline: Create your own widgets!
class: developers
---
{% include JB/setup %}

# Developing Widgets for the Materia Platform

Materia is built to be customizable and infinitely expandable.  Since it is merely a platform for serving and distributing widgets, more can be added.  Widgets are packaged into a single file and easily installed with a single command. This page describes the widget development process and tools required to create a widget package that can be installed in any Materia distribution.  The following guide will walk you through the steps required to build or customize the existing widgets.

# Prerequisites

* A Running <a href="{{BASE_PATH}}/develop/deploying-materia.html">Materia Dev Server</a>


<aside>
	Materia widgets are written in HTML5 to be compliant and supported on all platforms, making the lives of students, faculty, and developers a bliss.
</aside>

# The Anatomy of a Widget

A widget is a little application that depends on the Materia platform for authentication, authorization, analytics, and distribution.

The simplest widgets can be simply static web pages; however Materia is designed to do so much more. You can create:

* **Custom Creators** that allow you to design the interface users interact with to customize widgets.
* **Question Sets** to store widget customizations and content.  Creators can be used to input customizable content for widgets into a data structure we call Question Sets or, qSets.  This custom data holds questions, content, and settings for each instructor's customized widget.
* **Scorable** widgets that can be used to determine a student's performance.  A 0-100% score is saved by the widget and is verified on the server using a **Score Module** built for each widget.
* **Statistical Storage** that allows widgets to save custom statistical data (such as reaction times or click coordinates) by using Materia's storage API. This is a great tool for statistical analysis and experiments.

## The Structure of a Widget

Widgets are made up of several files that get compressed into a single `.wigt` package for easy distribution.
A widget package (`.wigt`) is comprised of the following directories:

	widget-name/
			.build / _output/ # .wigt file is compiled into this directory
			src / assets/ # optional directory to store assest for the demo
			src / _icons/ # icons for display in Materia
			src / _score/ # score module located here
			src / _screen-shots/ # screen shots for the widget preview
			src / player.html # the player, or game, content that is presented to the student
			src / player.css # optional stylesheet for player-side application
			src / player.js # optional business logic for player-side application
			src / creator.html # the creator for the widget that is presented to faculty and staff
			src / creator.css # optional stylesheet for creator-side application
			src / creator.js # optional business logic for creator-side application
			src / demo.json # builds a qset for the demo widget
			src / install.yaml # describes how to install the widget
			tests / test.js # unit test file for application
			.eslintrc.json # linter configuration file for full unit testing
			.gitignore # ensures files and directories are skipped during git pushes
			gulpfile.js # build task runner instruction file
			karma-full-conf.js # full test configuration file -- naming depends on test framework used
			karma-conf.js # short test configuration file -- naming depends on test framework used
			package.json # metadata file for npm packages
			README

## Installation Config: install.yaml

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
	  creator: creator.html
	  player: player.html
	  flash_version: 10
	score:
	  is_scorable: Yes
	  score_module: Crossword
	meta_data:
	  features:
		- Customizable
		- Scorable
		- Mobile Friendly
	  supported_data:
		- Question/Answer
	  about: 'In Crossword, fill in the blank squares with: (a) words based on the clues provided in the text and/or (b) by the letters overlapping from other words.'
	  excerpt: >
		A quiz tool that uses words and clues to
		randomly generate a crossword puzzle.

### General Settings

* **name:** The displayed name of the widget
* **group:** The group name for the widget.
* **height:** The height of the widget in pixels. Use 0 if the widget should expand to the full height available.
* **width:** The width of the widget in pixels. Use 0 if the widget should expand to the full width available.
* **in_catalog:** 'Yes' if the widget should be publicly displayed on the widget catalog for creation and use. Generally, widgets not displayed in the catalog are specialized and lack a creator and are only available for creation through command line.
* **is_editable:** Instances can't be saved as drafts if not editable.
* **is_playable:** 'Yes' if widget instances can be played. 'No' to disable playing of instances. This is typically only used when developing a widget to prevent users from seeing an unfinished widget.
* **is_qset_encrypted:** Tells Materia whether to return an encrypted qset, or unchanged.
* **is_answer_encrypted:** Reserved for future use.
* **is_storage_enabled:** 'Yes' if this widget uses the storage API features. 'No' otherwise.
* **api_version:** Corresponds to which version of the widget instance object this widget expects. You should specify version 1 here.

<aside>
	Group is currently only for your organizational purposes. Later versions of Materia may use this property to help better organize the widget catalog.
</aside>

### Files Settings

* **creator:** Location of the creator html file. Not required if <strong>is_editable</strong> is set to 'No.'
* **player:** Location of the player html file.

### score

<aside>
	Widgets that don't record scores still require a score module, though scoring logic may be omitted.
</aside>

* **is_scorable:** 'Yes' if the widget collects scores. 'No' otherwise.
* **score_module:** Name of the score module class (in score_module.php).
* **score_type:** (Deprecated) Specifies how a widget is graded. Accepted values are:
	* SERVER - means grading will be handled by a Score Module on the server. **Preferred**
	* CLIENT - means your widget will tell Materia what the widget score should be.
	* SERVER-CLIENT - utilizes both methods.

### meta_data

* **features:** A list of features which will be presented in the widget catalog.<aside>While your widget can specify any number of features, Materia specifically looks for two defined features. If your widget is scorable you'll want to include <em>Scorable</em> here. If your widget includes a creator you'll want to include <em>Customizable</em>. These features allow users to filter the catalog page to find the widget they're looking for.</aside>
* **supported_data:** A list of the types of data which this widget supports. This will be presented in the widget catalog.<aside>Similarly, Materia looks for a few specific features here: <em>Question/Answer</em> and/or <em>Multiple Choice</em>.</aside>
* **about:** The text displayed on the widget detail page.
* **excerpt:** The text displayed on the widget catalog page.


## Demo Question Set: demo.json

This file provides a title and qSet which will be used when installed to create a widget demo.
## Example

	---
	name: Math Quiz
	qset:
	  version: 1
	  data:
	    questions...

## Optional Demo Media Assets:

If your demo has media assets, include them in the optional **assets** folder, and reference them in your demo.json file with `<%MEDIA="assets/1.jpg"%>`, `<%MEDIA="assets/2.jpg"%>`, and so on (replacing `1.jpg`, `2.jpg`, etc. with the name of your asset files). The install script will find any `MEDIA` tags, upload the assets, and replace the tags with the resulting asset IDs before creating and installing the demo.

## Optional Score Module: ```_score-modules```

You'll need both a score module and unit test file if your widget is scorable.  The `score_module.php` file is a php class which extends `Score_Module`.  Your score module should override the `checkAnswer` method.  Your implementation of this method should return a number of 0-100 representing the score for the given question response.  The `$log` object contains any data saved to the server by your widget (usually question or performance data).

### Basic score module example

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

### Score Module Unit Tests

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

## Display Icons: _icons_

This folder should contain the icons for your widget. A total of four icons at various pixel sizes should be provided: icon-60.png, icon-92.png, icon-275.png and icon-394.png, as well as their times two multiples icon-60x2.png, icon-92x2.png, icon-275x2.png and icon-394x2.

## Overview Screen Shots: _screen-shots_

This folder should contain screen shots and corresponding thumbnails for your widget.  These will be used in the detail page for your widget.

<aside>
	You will need to provide three screen shots.
</aside>

# Building Widget Code

## Getting Started

[Download](https://clu.cdl.ucf.edu/materia/template-widget/repository/archive.zip?ref=master) the Template Widget from Clu

Extract this folder to `materia-docker/app/fuel/app/tmp/widget_packages/`

This template has the bare minimum a widget requires to function, and often will require more to be considered useful. Use this as a place to start building your widget, while using the [Hello World Widget](https://clu.cdl.ucf.edu/materia/hello-world-widget/repository/archive.zip?ref=master) as an example of a simple, complete widget.

<aside>
	Be careful when editing files:

	"materia-docker/app/fuel/app/tmp/widget_packages/"" is where compiled widgets are installed from in the sandbox environment

	Installed widget files are not typically accessible without alterations to the "docker-compose.yml" file.
</aside>

Edit `install.yaml` to your desired widget name, and rename the `template-widget` folder to match a dash separated, all lowercase version of the widget's name.

The `player.html` is the code that is loaded into Materia for the student-facing game, whereas `creator.html` is loaded for the instructor to build the question data in each widget instance.

Read through each and use them as a barebones example of how to develop your own widget

## Materia.Score

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

## Materia.Storage

Implementation incomplete, check back again.

# qSet Structure

The qSet, at minimum, contains the following:

<pre><code class="language-json">{
	version: 1,
	data: { ... }
}</code></pre>

The `version` property allows you to version qSets. If you later modify your widget engine you could then support a newer type of qSet structure. The `data` property is simply an arbitrary object which you can define with the information you need.

## Standard qSet Structures

The qSet data property doesn't enforce a schema but Materia defines a standard structure that defines Multiple Choice and Single Answer questions. Conforming to this standard structure allows Materia to add questions to the question bank. Users can then use the 'import question' functionality to re-use questions created with your widget creator. If possible it is recommended to conform to this standard structure.

### Question Template

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

### Multiple Choice Example

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

### Question/Answer Example

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

## Asset Structure

<pre><code class="language-javascript">{
	materiaType: 'asset', // tells Materia this is an asset
	id: 'cd83Ss', // id assigned to asset by the server (never send empty)

	// Optional. Asset scoped properties, like a title
	// Applies to **this** asset in **this** qset (does not transfer to other widgets)
	options: {
		title : 'Rocket Duck'
	}
}</code></pre>

### Assets in a Question

Assets within the scope of the entire question.  Like an song that plays during the question.

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

# Compiling with Grunt

Grunt automates the process of building and compiling the `.wigt` files.

## Development sandbox

To test your widget's player and creator live, open a terminal to `static/sandbox` and run:

`grunt --widget=hello-world-widget --minify-assets=false watch`

where `hello-world-widget` is your widget's name.

Grunt will automatically rebuild the widget for the sandbox environment whenever a file is changed.

To access the widget, navigate to:

`http://localhost:8080/sandbox/hello-world-widget/`

### Caveats

<aside>
	Because the widget is being run in a sandbox, only the demo qset can be used, scoring will not run, and widgets cannot be saved. To test that functionality, see the compiling section below.
</aside>

## Compiling for production

To compile a .wigt package, run:

`grunt --widget=hello-world-widget package`

This creates a .wigt file in the `_output` directory. You can then easily install the widget using via the [widget:install]({BASE_PATH}/develop/installing-widgets.html).

**Or** run:

`grunt --widget=hello-world-widget install`

which will package and install into the current Materia instance in a single step. This is useful for testing scoring modules and creators.

### Validating packages

You can validate your package structure and install.yaml and demo.yaml files by navigating to your Materia's root directory and running

<pre><code class="bash">php oil r widget:install --validate-only packages/your-widget.wigt</code></pre>

