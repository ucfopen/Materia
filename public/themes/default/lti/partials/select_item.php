<header>
	<h1>Select a widget:</h1>
	<div id="logo"></div>
</header>
<section id="select-widget">
	<input type="text" id="search"></div>
	<a id="refresh" href="#">Refresh listing</a>
	<div id="list-container">
		<ul>
			<li class="template draft">
				<div class="widget-info">
					<img class="widget-icon"></img>
					<h2 class="searchable">_template_title</h2>
					<h3 class="searchable">_template_widget_name</h3>
					<span class="draft-label">Draft</span>
				</div>
				<a class="preview external" target="_blank" href="#">Preview</a>
				<a class="view-at-materia external" target="_blank" href="#">Edit at Materia</a>
			</li>
			<li class="template">
				<div class="widget-info">
					<img class="widget-icon"></img>
					<h2 class="searchable">_template_title</h2>
					<h3 class="searchable">_template_widget_name</h3>
				</div>
				<a class="preview external" target="_blank" href="#">Preview</a>
				<a role="button" class="button embed-button" href="#">Use this widget</a>
			</li>
		</ul>
		<div id="no-widgets-container">
			<div id="no-widgets">
				You don't have any widgets yet. Click this button to create a widget, then return to this tab/window and select your new widget.
				<a role="button" id="create-widget-button" class="button" target="_blank" href="<?= Uri::create('/widgets') ?>">Create a widget at Materia</a>
			</div>
		</div>
	</div>
	<a id="goto-new-widgets" class="external" target="_blank" href="<?= Uri::create('/widgets') ?>">Or, create a new widget at Materia</a>
	<a role="button" class="button cancel-button" href="#">Cancel changing widget</a>
</section>
<section id="progress">
	<div class="widget-info">
		<h1></h1>
		<img class="widget-icon"/>
	</div>
	<div class="progress-container">
		<span>Connecting your widget...</span>
		<div class="progressbar"></div>
	</div>
</section>
<div id="materia-lti-swf-bridge"></div>