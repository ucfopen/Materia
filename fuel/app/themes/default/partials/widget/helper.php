<div>
	<section class="page" ng-show="loaded">
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
