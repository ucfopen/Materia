<section class="widget" ng-controller="WidgetPlayerCtrl" ng-init="inst_id = '<?= $inst_id ?>'" ng-class="{ preview: isPreview }">
	<header ng-if="isPreview" class="preview-bar"></header>
	<div class="center" ng-show="type == 'flash' || type == 'html'">
		<iframe ng-attr-src="{{ htmlPath }}" ng-if="type == 'html'" id="container" class="html" scrolling="yes" fullscreen-dir></iframe>
		<div id="container" ng-if="type =='flash'"></div>
	</div>
	<div id="container" ng-if="type =='noflash'">
		<?= Theme::instance()->view('partials/noflash') ?>
	</div>
</section>
