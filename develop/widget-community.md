---
layout: page
title: Widget Community
tagline:
class: developers
---
{% include JB/setup %}

# Discussion #

If you're interested in developing widgets please check out the [Materia Widget Developers Google Group](https://groups.google.com/d/forum/materia-widget-developers) to get together and discuss with other developers.

# Sharing Widgets #

Widgets can be shared in one of two ways:

* The easiest option is to distribute the .wigt file. Installing a widget is as simple as `php oil r widget:install myWidget.wigt` (read <a href="{{BASE_PATH}}/develop/installing-widgets.html">Installing Widgets</a> for more information).
* Distribute your widget package source with ant build scripts. Other developers can then build your widget with `ant prod` and install it as above. Full detail on developing widget packages can be found in the [Widget Developer Guide]({{BASE_PATH}}/develop/widget-developer-guide.html).