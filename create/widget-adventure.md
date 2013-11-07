---
layout: page
title: Adventure Guide
tagline: Details about using the Choose Your Own Adventure widget
class: instructors
---
{% include JB/setup %}

## Overview ##

Choose Your Own Adventure is a powerful widget that allows for the creation of branching decision trees. Students are scored based on where they end up.

![adventure creator screen]({{BASE_PATH}}/assets/img/create_widget_adventure.png "adventure creator screen")

0. Title of the widget
0. Example Destination Tree

## Details ##

### Destination Types ###

![adventure creator tree]({{BASE_PATH}}/assets/img/create_widget_adventure_tree.png "adventure creator tree")

0. Narrative
0. Multiple Choice
0. Short Answer
0. Hotspot
0. Ending
0. Shortcut
0. Blank (New) Destination

### Creating a New Destination ###

Select a blank destination to choose a destination type.

![adventure creator selection]({{BASE_PATH}}/assets/img/create_widget_adventure_selection.png "adventure creator selection")

<aside>
	Note that endings are omitted from the destination selection screen for the Start destination.
</aside>

### Creating a Multiple Choice Destination ###

![adventure creator mc]({{BASE_PATH}}/assets/img/create_widget_adventure_screen_mc.png "adventure creator mc")

0. The selected destination
0. Question text field
0. Add an image to accompany the question
0. Answer text field
0. Optional feedback to accompany this answer
0. The destination this answer will point to
0. Add an additional answer
0. Delete this answer
0. Randomize the answer order

### Creating a Short Answer Destination ###

The Short Answer screen is very similar to the Multiple Choice screen, with the exception of how it handles answers. Users enter a response based on the question text or image.

![adventure creator shortanswer]({{BASE_PATH}}/assets/img/create_widget_adventure_screen_sa.png "adventure creator shortanswer")

0. The selected destination
0. Question text field
0. Add an image to accompany the question
0. Set of possible answers
0. Optional feedback to accompany this set of answers
0. The destination this answer set will point to
0. Add an additional answer set
0. Delete this answer set
0. The catch-all answer set if a user's response does not match any provided answers

<aside>
	The widget will attempt to match the user's response to all possible answers provided across all answer sets. If no match is made, the <em>Unmatched Answers</em> choice is selected.
</aside>

### Adding Short Answers ###

Selecting an answer row brings up the Add Answers dialog. Here you can add possible answers to be matched to the user's response.

![adventure creator shortanswer answers]({{BASE_PATH}}/assets/img/create_widget_adventure_screen_sa_answers.png "adventure creator shortanswer answers")

0. Add a new possible answer
0. Set of additional possible answers

<aside>
	If the user response matches any of these possible answers, the user will be sent to the destination associated with this set.
</aside>

### Creating a Hotspot Destination ###

The Hotspot creation screen provides tools to highlight and label parts of an image. Depending on the hotspot the user selects, they will be taken to a specified destination.

![adventure creator hotspot]({{BASE_PATH}}/assets/img/create_widget_adventure_screen_hotspot.png "adventure creator hotspot")

0. The selected destination
0. Optional instructions associated with the hotspot image
0. Hotspot creation tools (rectangle, ellipse, or polygon)
0. Hotspot color selection
0. Hotspot visibility settings (by default, the hotspots are visible immediately)
0. The hotspot image
0. Example rectangular hotspot
0. Example elliptical hotspot
0. Change the hotspot image

### Hotspots ###

Once a hotspot is drawn on the image, selecting it brings up the hotspot dialog.

![adventure creator hotspot dialog]({{BASE_PATH}}/assets/img/create_widget_adventure_screen_hotspot_dialog.png "adventure creator hotspot dialog")

0. Hotspot label
0. Optional feedback to associate with this hotspot
0. The destination this hotspot will point to
0. Change the vertical arrangement of the hotspot (relative to other hotspots that overlap)
0. Redraw the hotspot

### Creating a Narrative Destination ###

Narrative screens do not have any sort of interaction, but rather provide transitional text or images between one destination and another.

![adventure creator narrative]({{BASE_PATH}}/assets/img/create_widget_adventure_screen_narr.png "adventure creator narrative")

0. The selected destination
0. Narrative text field
0. Add an image to accompany the narrative
0. The destination this narrative will point to

### Creating an End Destination ###

Endings are functionally identical to Narrative Destinations. Instead of selecting a destination to point to, endings provide a final score and end the widget.

![adventure creator end]({{BASE_PATH}}/assets/img/create_widget_adventure_screen_end.png "adventure creator end")

0. The selected destination
0. Ending text field
0. Add an image to accompany the ending text
0. The final score associated with this ending

### Options for Selecting a Destination ###

When choosing a destination to point to, a popup provides the following three options:

![adventure creator destination selection]({{BASE_PATH}}/assets/img/create_widget_adventure_destination_selection.png "adventure creator destination selection")

0. The user will be "looped back" to this same destination
0. The destination is a new, blank node (this is the default)
0. Link to an existing destination, allowing the user to travel to another point on the decision tree.

### Adding Images to Destinations ###

For any destination type, selecting the <em>Add Image</em> button changes the layout of the destination to associate an image with the destination's text. Clicking the camera icon opens the Media Catalog, from which an image can be uploaded or selected.

![adventure creator uploading images]({{BASE_PATH}}/assets/img/create_widget_adventure_uploading.png "adventure creator uploading images")

