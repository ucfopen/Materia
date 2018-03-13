<section class="widget" ng-controller="playerCtrl" ng-init="inst_id = '<?= $inst_id ?>'" ng-class="{ preview: isPreview }">
	<header ng-if="isPreview" class="preview-bar"></header>
	<div class="center" ng-show="type == 'flash' || type == 'html'" style="width:{{widgetWidth}}px; height:{{widgetHeight}}px">
		<iframe ng-attr-src="{{ htmlPath }}" ng-if="type == 'html'" id="container" class="html" scrolling="yes" fullscreen-dir></iframe>
		<div id="container" ng-if="type =='flash'"></div>	
	</div>
	<div class="fullscreen-prompt" ng-show="allowFullScreen" style="width:{{widgetWidth - 20}}px;">
		<h3>This widget supports fullscreen mode. Do you want to enable it?</h3>
		<button class="fullscreen-toggle" ng-click="goFullScreen()">Fullscreen</button>
	</div>
	<div id="container" ng-if="type =='noflash'">
		<?= Theme::instance()->view('partials/noflash') ?>
	</div>
</section>
