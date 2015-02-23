<div ng-controller="createCtrl">
	<section class="page" ng-show="loaded">
		<div class="preview animate-show" ng-show="popup == 'blocked'">
			<p>Your browser blocked the preview popup, click below to preview the widget.</p>
			<div class="publish_container">
				<a class="cancel_button" ng-click="cancelPreview()">Close</a>
				<a href="{{ previewUrl }}" target="_blank" ng-click="cancelPreview()" class="action_button green">Open Preview</a>
			</div>
		</div>

		<div class="publish animate-show" ng-show="popup == 'update'">
			<h1>Update Widget</h1>
			<p>Updating this published widget will instantly allow your students to see your changes.</p>

			<div class="publish_container">
				<a class="cancel_button" ng-click="cancelPublish()">Cancel</a>
				<a class="action_button green" ng-click="requestSave('publish')">Yes, Save Updates</a>
			</div>
		</div>

		<div class="publish animate-show" ng-show="popup == 'publish'">
			<h1>Publish Widget</h1>
			<p>Publishing removes the "Draft" status of a widget, which grants you the ability to use it in your course and collect student scores &amp; data.</p>
			<div class="publish_container">
				<a class="cancel_button" ng-click="cancelPublish()">Cancel</a>
				<a class="action_button green" ng-click="requestSave('publish')">Yes, Publish</a>
			</div>
		</div>

		<section id="action-bar" ng-show="showActionBar">
			<a id="returnLink" href="{{ returnUrl }}">&larr;Return to {{ returnPlace }}</a>
			<a id="importLink" ng-click="showQuestionImporter()">Import Questions...</a>
			<button id="creatorPublishBtn" class="edit_button green" type="button" ng-click="onPublishPressed()">{{ publishText }}</button>
			<div class="dot" ng-hide="updateMode"></div>
			<button id="creatorPreviewBtn" class="edit_button orange" type="button" ng-click="requestSave('preview')" ng-hide="updateMode"><span>{{ previewText }}</span></button>
			<button id="creatorSaveBtn" class="edit_button orange" ng-class="saveStatus" type="button" ng-click="requestSave('save')" ng-hide="updateMode"><span>{{ saveText }}</span></button>
		</section>

		<div class="center">
			<iframe ng-attr-src="{{ htmlPath }}" ng-if="type == 'html'" id="container" class="html"></iframe>
			<div id="container" ng-if="type == 'swf'"></div>
		</div>
		<div id="container" ng-if="type == 'noflash'">
			<?= Theme::instance()->view('partials/noflash') ?>
		</div>

		<iframe src="{{ iframeUrl }}" ng-class="{ show: iframeUrl }" id="embed_dialog" frameborder=0 width=675 height=500></iframe>
	</section>
	<div ng-if="invalid">
		<?= Theme::instance()->view('partials/nopermission') ?>
	</div>
</div>
