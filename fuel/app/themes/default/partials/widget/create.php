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

		<section id="action-bar" ng-show="showActionBar" ng-class="{'fullscreenMode' : inFullScreen}">
			<a id="returnLink" href="{{ returnUrl }}">&larr;Return to {{ returnPlace }}</a>
			<a id="importLink" ng-click="showQuestionImporter()">Import Questions...</a>
			<button id="creatorPublishBtn" class="edit_button green" type="button" ng-click="onPublishPressed()">{{ publishText }}</button>
			<span ng-hide="updateMode || nonEditable">
				<div class="dot"></div>
				<button id="creatorPreviewBtn" class="edit_button orange" type="button" ng-click="requestSave('preview')"><span>{{ previewText }}</span></button>
				<button id="creatorSaveBtn" class="edit_button orange" ng-class="saveStatus" type="button" ng-click="requestSave('save')"><span>{{ saveText }}</span></button>
			</span>
			<button id="creatorFullscreen" class="edit_button orange" type="button" ng-show="allowFullScreen" ng-click="goFullScreen()">Fullscreen</button>
		</section>

		<div ng-switch="type" class="center">
			<iframe ng-switch-when="html" ng-attr-src="{{ htmlPath }}" id="container" class="html"></iframe>
			<div ng-switch-when="swf" id="container"></div>
			<div ng-switch-when="noflash" id="container">
				<?= Theme::instance()->view('partials/noflash') ?>
			</div>
			<div ng-switch-default></div>
		</div>

		<div id="modal-cover" class="page" ng-show="modal"></div>

		<iframe ng-attr-src="{{ iframeUrl }}" ng-class="{ show: iframeUrl }" id="embed_dialog" frameborder=0 width=675 height=500></iframe>
	</section>
	<div ng-if="invalid">
		<?= Theme::instance()->view('partials/nopermission') ?>
	</div>
</div>
