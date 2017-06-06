---
layout: page
title: Adventure Guide
tagline: Details about using the Choose Your Own Adventure widget
class: instructors
---
{% include JB/setup %}

## Overview ##

Choose Your Own Adventure is a powerful widget that allows for the creation of branching decision trees. Students are scored based on where they end up.

While building your Adventure widget, keep in mind: with great power comes great responsibility. Adventure allows you to create decision trees that are as simple or as complicated as you like. Keep the user's experience in mind while building the various pathways they may take through your widget.

Each point on the tree, known as a *destination* or *node*, represents a screen and possible interaction.

![adventure creator screen]({{BASE_PATH}}/assets/img/create_widget_adventure_start.png "adventure creator screen")

0. Title of the widget
0. A blank destination
0. Zoom controls

## Details ##

### Creating a New Destination ###

Click a blank destination and select **"Edit"** to choose a destination type.

![adventure creator selection]({{BASE_PATH}}/assets/img/create_widget_adventure_selection.png "adventure creator selection")

### Destination Types ###

Each destination can be one of five different types:

0. **Multiple Choice:** Given a question, students select one of several possible answers.
0. **Short Answer:** Given a question, students input a word or phrase. This input will be matched against pre-determined responses you provide.
0. **Hotspot:** Students are provided with an image and optional label. They can then select one of several highlighted parts of the image.
0. **Narrative:** Students are provided some expository, explanatory, or narrative text, and then continue to the next Destination.
0. **End Point:** This destination provides a conclusion to the widget if the student ends up there. A score is provided and the student is sent to the score screen.

<aside>
	Note that End Points are omitted from the destination selection screen for the Start destination.
</aside>

Each destination type is identified by an icon. An example tree is shown below:

![adventure creator tree]({{BASE_PATH}}/assets/img/create_widget_adventure_tree.png "adventure creator tree")

0. Narrative
0. Multiple Choice
0. Short Answer
0. Hotspot
0. Ending
0. Blank (New) Destination

### Creating a Multiple Choice Destination ###

![adventure creator mc]({{BASE_PATH}}/assets/img/create_widget_adventure_screen_mc.png "adventure creator mc")

0. Question text field
0. Add an image to accompany the question
0. Answer text field
0. Optional feedback to accompany this answer
0. The destination this answer will point to
0. Delete this answer
0. Add an additional answer
0. Randomize the answer order

### Creating a Short Answer Destination ###

The Short Answer screen is very similar to the Multiple Choice screen, with the exception of how it handles answers. Users enter a response based on the question text or image.

![adventure creator shortanswer]({{BASE_PATH}}/assets/img/create_widget_adventure_screen_sa.png "adventure creator shortanswer")

0. Question text field
0. Add an image to accompany the question
0. Add a new word or phrase to match
0. Set of words or phrases that can be matched for this answer
0. Optional feedback to accompany this set of answers
0. The destination this answer set will point to
0. Delete this answer set
0. Add an additional answer set
0. The catch-all answer set if a user's response does not match any provided answers

<aside>
	The widget will attempt to match the user's response to all possible answers provided across all answer sets. If no match is made, the <em>Unmatched Answers</em> choice is selected.
</aside>

### Adding Short Answers ###

In the "Add possible answer" input box, you can enter a word or phrase to be matched against what the user will enter in the Short Answer input box when playing the widget. Type Enter or select "Add Match" to add it to the answer set. To remove a possible answer from the answer set, simply click on it.

![adventure creator shortanswer answers]({{BASE_PATH}}/assets/img/create_widget_adventure_screen_sa_answers.png "adventure creator shortanswer answers")

0. Add a new possible answer
0. Set of additional possible answers

<aside>
	If the user response matches any of these possible answers, the user will be sent to the destination associated with this set.
</aside>

**Note:** Single words or simple phrases are best for Short Answer responses. While the matches are not case sensitive, spaces and punctuation count.

### Creating a Hotspot Destination ###

The Hotspot creation screen provides tools to highlight and label parts of an image. Depending on the hotspot the user selects, they will be taken to a specified destination.

![adventure creator hotspot]({{BASE_PATH}}/assets/img/create_widget_adventure_screen_hotspot.png "adventure creator hotspot")

0. Optional instructions associated with the hotspot image
0. The hotspot image
0. Hotspot creation tools (rectangle, ellipse, or polygon)
0. Hotspot visibility settings
0. Change the hotspot image
0. Example elliptical hotspot
0. Example rectangular hotspot
0. Example polygon hotspot

<aside>
	Elliptical and rectangular hotspots have a drag handle on the lower-right; you can use it to resize the hotspot once placed.
</aside>

### Drawing a Polygon Hotspot ###

To draw a polygon, select the **+Polygon Hotspot** button. Click anywhere on the image to begin drawing the polygon. Once the first point is placed, each additional click on the image will add a new side to the polygon. Once you've drawn the polygon to your satisfaction, click near the very first point to "close" the polygon and create the hotspot.

![adventure creator hotspot]({{BASE_PATH}}/assets/img/create_widget_adventure_screen_hotspot_polygon.png "adventure creator hotspot polygon")

### Hotspots ###

Once a hotspot is drawn on the image, selecting it brings up the hotspot dialog. To relocate the hotspot, click and drag it.

![adventure creator hotspot dialog]({{BASE_PATH}}/assets/img/create_widget_adventure_screen_hotspot_dialog.png "adventure creator hotspot dialog")

0. The optional mouse-over label to accompany this hotspot
0. Optional feedback to associate with this hotspot
0. Color selection: clicking this will open a small drawer to select the color you'd like the hotspot to be.
0. Change the vertical arrangement of the hotspot (relative to other hotspots that overlap)
0. The destination this hotspot will point to

### Hotspot Visibility ###

Selecting "Edit Visibility" lets you change the default visibility of hotspots. The options are:

0. Always show hotspots (this is the default)
0. Reveal hotspots on mouseover
0. Don't show hotspots (the cursor will still change to indictate a part of the image can be selected)

### Creating a Narrative Destination ###

Narrative screens do not have any sort of interaction, but rather provide transitional text or images between one destination and another.

![adventure creator narrative]({{BASE_PATH}}/assets/img/create_widget_adventure_screen_narr.png "adventure creator narrative")

0. Narrative text field
0. Add an image to accompany the narrative
0. The destination this narrative will point to

### Creating an End Destination ###

Endings are functionally identical to Narrative Destinations. Instead of selecting a destination to point to, endings provide a final score and end the widget.

![adventure creator end]({{BASE_PATH}}/assets/img/create_widget_adventure_screen_end.png "adventure creator end")

0. Ending text field
0. Add an image to accompany the ending text
0. The final score associated with this ending

<aside>
	Remember that regardless of the path a user takes through your widget, every path must terminate in an end point. Take care in the design of your widget to ensure every route ends in a sensible and logical manner.
</aside>

### Adding Images to Destinations ###

For any destination type, selecting the **Add Media** button changes the layout of the destination to associate an image with the destination's text. You can upload images from your computer, or select an image you've previously uploaded to Materia. Once you've selected an image, you can use the **Swap with Question** button below the image to switch the arrangement of the image and question text. Narrative and End Point destinations allow you to choose between vertical as well as horizontal arrangements.

## Advanced Decision Tree Design ##

### Options for Selecting a Destination ###

With the exception of End Points, every answer for every destination in your tree will point to another destination. By default, when creating a new answer, Adventure will create a new, blank destination to which that answer will point. You can change where the answer points to by selecting the answer's destination button.

![adventure creator destination selection]({{BASE_PATH}}/assets/img/create_widget_adventure_destination_selection.png "adventure creator destination selection")

0. Clicking this destination button brings up the dialog to select the destination type
0. The destination is a new, blank node (this is the default)
0. Link to an existing destination, allowing the user to travel to another point on the decision tree
0. The user will be "looped back" to this same destination

Depending on which of these three types is selected, the tree will change to indicate where the answer will point.

![adventure creator link types]({{BASE_PATH}}/assets/img/create_widget_adventure_link_types.png "adventure creator link types")

0. Indicates the parent's answer points to the child destination (this is the default)
0. Indicates the parent's answer points to another destination on the tree that isn't a child of the parent
0. The parent's answer loops back and points to itself

<aside>
	NOTE: Keep in mind that changing the destination of an answer may remove child destinations. For example, if your answer originally pointed to destination B, and destination B had its own answers with child destinations, changing the target destination of that answer would remove destination B and any children.
</aside>

### Adding In-Between Destinations ###

It's possible to add a new destination along a link in between two existing destinations. Simply hover your cursor over the midpoint of the link and select the "+" icon that appears.

In the example below, an in-between destination, **I**, was added between **A** and **B**:

![adventure creator in between node]({{BASE_PATH}}/assets/img/create_widget_adventure_in_between_node.png "adventure creator in between node")

Note that a link exists between I and B, despite B being blank. When editing destination I, upon selecting a destination type, the first answer will automatically point to destination B.

### Resetting, Converting, and Copying Destinations ###

When you select a destination, a small dialog provides a number of options in addition to simply editing it. Namely, **Reset**, **Convert**, and **Copy**.

**Resetting** a destination reverts it to a blank destination *and removes all answers, including associated child destinations.* A warning dialog will appear to inform you that the destination's sub-tree will be erased.

**Converting** a destination allows you to convert a destination to another type, with some caveats. Multiple Choice and Short Answer destinations can be converted to one another; the same with Narratives and End Points. Hotspot destinations cannot be converted.

**Copying** a destination will make a complete copy of the destination, *including all of its answers and child destinations*. In effect, the destination and its entire sub-tree are copied. Once the copy option is selected, you will be prompted to select another blank destination on the tree to be the copy target. The blank destination will be replaced by the copied destination and its sub-tree.

There are a few things to keep in mind when copying a destination:

0. Making changes to the copied sub-tree will not affect the original. If you copy destination B, and the copy becomes destination N, making changes to destination N will not affect B.
0. Answers that point to their default child destinations will point to the copied child destination, not the original, *with the exception of answers that point to an existing destination, represented by a dashed line.* These will point to their *original targets*, even if that target was copied as well. As an example, consider the tree below:

![adventure creator before copying a destination]({{BASE_PATH}}/assets/img/create_widget_adventure_before_copy.png "adventure creator before copying a destination")

For this tree, we will make a copy of **destination A**, targeting **destination F** as the destination to be replaced.

![adventure creator after copying a destination]({{BASE_PATH}}/assets/img/create_widget_adventure_after_copy.png "adventure creator after copying a destination")

Note that destination F has become a copy of destination A, *including destination all of destination A's child destinations.* B, C, D, F, and G have become I, K, J, L, and M, respectively. Their answers point to the respective copies of the originals, with the exception of destination B's answer that originally pointed to destination F. The copied answer for destination I will continue to point to the original target, F.

<aside>
	Copying destinations and sub-trees can have a number of uses in the design of your widget: for example, you can create two sub-trees with subtlely different details and endings by creating one version of the sub-tree, copying it, and making edits to the copied sub-tree to reflect the different consequences of that path.
</aside>




