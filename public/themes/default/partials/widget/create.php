<section class="page">
	<section id="action-bar" style="visibility:hidden">
		<a id="returnLink" href="#">&larr;Return to your widgets</a>
		<a id="importLink" href="#">Import Questions...</a>
		<button id="creatorPublishBtn" class="edit_button green" type="button">Publish...</button>
		<div class="dot"></div>
		<button id="creatorPreviewBtn" class="edit_button orange" type="button"><span id="previewBtnTxt">Preview</span></button>
		<button id="creatorSaveBtn" class="edit_button orange" type="button"><span id="saveBtnTxt">Save Draft</span></button>
	</section>

	<div class="center">
		<div id="container">
			<?= Theme::instance()->view('partials/noflash') ?>
		</div>
	</div>
</section>

<script type="text/template" id="t-publish-dialog">
<div class="publish">
	<h1>Publish Widget</h1>
	<p>Publishing removes the "Draft" status of a widget, which grants you the ability to use it in your course and collect student scores &amp; data.</p>
	<div class="publish_container">
		<a href="#" class="cancel_button">Cancel</a>
		<a href="#" class="action_button green">Yes, Publish</a>
	</div>
</div>
</script>

<script type="text/template" id="t-update-dialog">
<div class="publish">
	<h1>Update Widget</h1>
	<p>Updating this published widget will instantly allow your students to see your changes.</p>

	<div class="publish_container">
		<a href="#" class="cancel_button">Cancel</a>
		<a href="#" class="action_button green">Yes, Save Updates</a>
	</div>
</div>
</script>

<script type="text/javascript">
	// Initialize the Creator
	Materia.Creator.init('container', <?= $widget->id ?>, <?= isset($inst_id) ? "\"$inst_id\"" : 'null' ?>);
</script>

<script type="text/template" id="t-popup-blocked">
<div class="preview">
	<p>Your browser blocked the preview popup, click below to preview the widget.</p>
	<div class="publish_container">
		<a href="#" class="cancel_button">Close</a>
		<a href="#" class="action_button green">Open Preview</a>
	</div>
</div>
</script>