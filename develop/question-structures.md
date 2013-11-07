---
layout: page
title: Question Structures
tagline: Standardized question structures for use in Materia
class: developers
---
{% include JB/setup %}

# About Materia's Question Sets #

Materia stores all customized widget data in Question Sets.  A Question Set is an arbitrary data structure that widget developers use to organize any data needed to store, display and customize widget content.  We intentionally removed all restrictions on this data structure to allow widgets freedom in design and implementation.

# Structured Question Data #

Inherently Materia's widgets often contain some abstract notion of a question. To help users reuse existing work, and help our system understand how to interpret these "questions", we have developed a standard structure that is required for Materia to understand them natively.

## Question Data Structure ##

* **id**: _(String, length:32)_ The question's id. These will be assigned automatically on the server when saved.  Do not set this value when saving a new question.
* **type**: _(String, length:255)_ The question type.  The type is used to indicate compatability with other widget engines so that they may import your your questions. Pretty awesome right!
* **questions**: _(Array)_ Array of question objects.  This was originally set up to be an array for flexibility, but we've never been able to come up with a reason to have multiple questions
	* **text**: _(String, length:MySQL MediumText)_ Each question must have this property, this is the text of the question itself.  It will be used on the score screen records for this question.
* **answers**: _(Array)_ Array of answer objects.
	* **id**: _(String, length:32)_ This answer's id.  These will be assigned automatically on the server when saved.  Do
	* **text**: _(String, length: MySQL MediumText)_ Each answer must have this property, it is the text of this answer.  It is also used on the score screen records.
	* **value**: _(Number, 0-100)_ The value that this answer will reward the student with when chosen or matched.
	* **options**: _(Object)_ Optional. For arbitrary optional properties
		* **feedback**: _(String)_ Optional. If present this property will be used to display feedback about this chosen answer.
		* **insert your property here**: Add any property here to store data about this specific answer