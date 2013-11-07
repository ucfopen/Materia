---
layout: page
title: Embedding Widgets in Canvas
tagline: Using Materia as an Instructor
class: instructors
---
{% include JB/setup %}

# Overview #
Materia integrates into any LMS that supports LTI assignments. This page provides a step-by-step guide on using a Materia widget in your [Instructure Canvas](http://www.instructure.com/) course.

## Using a widget as a graded assignment ##
This method will put your Materia widget directly into your Canvas course as an assignment. Students will click on the assignment, complete the widget, and scores will pass to your course automatically without students needing to log into Materia.

<figure>
	<a href="{{BASE_PATH}}/assets/img/lti-assignment-1.png" class="fancybox">
		<img src="{{BASE_PATH}}/assets/img/lti-assignment-1-thumb.png">
	</a>
	<figcaption>
		<a href="{{BASE_PATH}}/assets/img/lti-assignment-1.png" class="fancybox">
			<span class="icon-zoom-in"></span>
		</a> Creating a new External Tool assignment
	</figcaption>
</figure>

0. Navigate to the *Assignments* section and create a new assignment.
0. Set the type to **External Tool**.
0. Set the number of points for the assignment.
0. Click **Update**.

<aside>
	Materia Scores range from 0%-100%, which is multiplied by the points you assign here. (example: If a student scores a 50% and you specify 20 points for this assignment in Canvas then they will receive 10 out of a possible 20 points).
</aside>

<figure>
	<a href="{{BASE_PATH}}/assets/img/lti-assignment-2.png" class="fancybox">
		<img src="{{BASE_PATH}}/assets/img/lti-assignment-2-thumb.png">
	</a>
	<figcaption>The External Tool shown on the Assignments page.</figcaption>
</figure>

<ol>
	<li value="5">Click on your newly created assignment</li>
</ol>

<figure>
	<a href="{{BASE_PATH}}/assets/img/lti-assignment-3.png" class="fancybox">
		<img src="{{BASE_PATH}}/assets/img/lti-assignment-3-thumb.png">
	</a>
	<figcaption>The Edit Assignment button will allow you to make the assignment a Materia widget.</figcaption>
</figure>

<ol>
	<li value="6">Click on <strong>Edit Assignment</strong></li>
</ol>

<figure>
	<a href="{{BASE_PATH}}/assets/img/lti-assignment-4.png" class="fancybox">
		<img src="{{BASE_PATH}}/assets/img/lti-assignment-4-thumb.png">
	</a>
	<figcaption>
		<a href="{{BASE_PATH}}/assets/img/lti-assignment-4.png" class="fancybox"><span class="icon-zoom-in"></span></a> Setting up your assignment to be a Materia widget
	</figcaption>
</figure>

<ol>
	<li value="7">Select the Materia option (in our example, <strong>Interactive Materia Widget</strong>)</li>
	<li>Click <strong>Select</strong></li>
	<li>Now with the popup dismissed click on <strong>Update Assignment</strong> to save your changes</li>
</ol>

<aside>
	If you don't see Materia in this list, then it hasn't been installed into your Canvas instance. If you're managing your own Materia instance then read <a href="{{BASE_PATH}}/develop/system-integrations.html">Systems Integrations</a> to set this up. Otherwise, you'll need to help from your Materia system administrators.
</aside>

<figure>
	<a href="{{BASE_PATH}}/assets/img/lti-assignment-5.png" class="fancybox">
		<img src="{{BASE_PATH}}/assets/img/lti-assignment-5-thumb.png">
	</a>
	<figcaption></figcaption>
</figure>

<ol>
	<li value="10">Click <strong>View assignment</strong></li>
</ol>

<figure>
	<a href="{{BASE_PATH}}/assets/img/lti-assignment-6.png" class="fancybox">
		<img src="{{BASE_PATH}}/assets/img/lti-assignment-6-thumb.png">
	</a>
	<figcaption>
		<a href="{{BASE_PATH}}/assets/img/lti-assignment-6.png" class="fancybox"><span class="icon-zoom-in"></span></a> Selecting which widget to use
	</figcaption>
</figure>

<ol id="step11">
	<li value="11">Now select the Materia widget you’d like to use by clicking <strong>Use this widget</strong> next to the desired widget. If you need to create a widget, you can click on  <strong>create a new widget at Materia</strong> at the bottom of the page, then return to this page to select it.</li>
</ol>

<aside>
	If the course containing the linked Materia Widget is copied or moved, the LMS may reset this selection.
</aside>

<figure>
	<a href="{{BASE_PATH}}/assets/img/lti-assignment-7.png" class="fancybox">
		<img src="{{BASE_PATH}}/assets/img/lti-assignment-7-thumb.png">
	</a>
	<figcaption>
		<a href="{{BASE_PATH}}/assets/img/lti-assignment-7.png" class="fancybox"><span class="icon-zoom-in"></span></a> The widget selected screen
	</figcaption>
</figure>

Once you’ve selected your widget you’re done with creating your assignment.  You can easily change the linked widget at any time.

## Using a widget in a module ##

There is another way to use Materia in Canvas if don't want to pass scores back as an assignment. This is perfect for situations where you just want to add a study tool into the content of your course.

<figure>
	<a href="{{BASE_PATH}}/assets/img/lti-module-1.png" class="fancybox">
		<img src="{{BASE_PATH}}/assets/img/lti-module-1-thumb.png">
	</a>
	<figcaption>
		<a href="{{BASE_PATH}}/assets/img/lti-module-1.png" class="fancybox"><span class="icon-zoom-in"></span></a> Creating a new Materia widget module
	</figcaption>
</figure>

0. First, navigate to the Modules section and click **Add item to module** (you may need to create a module first).
0. Select **External Tool**
0. Select the Materia option (in our example, **Interactive Materia Widget**)
0. Click **Add Item**

<aside>
	If you don't see Materia in this list, then it hasn't been installed into your Canvas instance. If you're managing your own Materia instance then read <a href="{{BASE_PATH}}/develop/system-integrations.html">Systems Integrations</a> to set this up. Otherwise, you'll need to help from your Materia system administrators.
</aside>

<figure>
	<a href="{{BASE_PATH}}/assets/img/lti-module-2.png" class="fancybox">
		<img src="{{BASE_PATH}}/assets/img/lti-module-2-thumb.png">
	</a>
</figure>

<ol>
	<li value="5">Click on your module.</li>
</ol>

The rest of the process is identical to creating an assignment [starting from step 11](#step11).