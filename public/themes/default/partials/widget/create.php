<section class="page" ng-controller="createCtrl">
	<div class="preview" ng-show="popup == 'blocked'">
		<p>Your browser blocked the preview popup, click below to preview the widget.</p>
		<div class="publish_container">
			<a href="#" class="cancel_button" ng-click="cancelPreview()">Close</a>
			<a href="#" class="action_button green">Open Preview</a>
		</div>
	</div>

	<div class="publish" ng-show="popup == 'update'">
		<h1>Update Widget</h1>
		<p>Updating this published widget will instantly allow your students to see your changes.</p>

		<div class="publish_container">
			<a href="#" class="cancel_button" ng-click="cancelPublish()">Cancel</a>
			<a href="#" class="action_button green" ng-click="onPublishPressed()">Yes, Save Updates</a>
		</div>
	</div>

	<div class="publish" ng-show="popup == 'publish'">
		<h1>Publish Widget</h1>
		<p>Publishing removes the "Draft" status of a widget, which grants you the ability to use it in your course and collect student scores &amp; data.</p>
		<div class="publish_container">
			<a href="#" class="cancel_button" ng-click="cancelPublish()">Cancel</a>
			<a href="#" class="action_button green">Yes, Publish</a>
		</div>
	</div>

	<section id="action-bar" style="visibility:hidden">
		<a id="returnLink" href="#">&larr;Return to your widgets</a>
		<a id="importLink" ng-click="showQuestionImporter()" href="#">Import Questions...</a>
		<button id="creatorPublishBtn" class="edit_button green" type="button" ng-click="onPublishPressed()">Publish...</button>
		<div class="dot"></div>
		<button id="creatorPreviewBtn" class="edit_button orange" type="button" ng-click="requestSave('preview')"><span id="previewBtnTxt">Preview</span></button>
		<button id="creatorSaveBtn" class="edit_button orange" type="button" ng-click="requestSave('draft')"><span id="saveBtnTxt">Save Draft</span></button>
	</section>

	<div class="center">
		<iframe src="{{ htmlPath }}" ng-if="type == 'html'" id="container" class="html"></iframe>
		<div id="container" ng-if="type =='noflash'">
			<?= Theme::instance()->view('partials/noflash') ?>
		</div>
	</div>

	<iframe src="{{ iframeUrl }}" id="embed_dialog" frameborder=0 width=675 height=500></iframe>
</section>
