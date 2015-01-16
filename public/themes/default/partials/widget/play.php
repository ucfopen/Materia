<section class="widget" ng-controller="playerCtrl" ng-init="inst_id = '<?= $inst_id ?>'">
	<header ng-if="isPreview" ng-class="preview-bar"></header>
	<div class="center" ng-show="type == 'flash' || type == 'html'">
		<iframe src="{{ htmlPath }}" ng-if="type == 'html'" id="container" class="html"></iframe>
		<div id="container" ng-if="type =='flash'"></div>
	</div>
	<div id="container" ng-if="type =='noflash'">
		<?= Theme::instance()->view('partials/noflash') ?>
	</div>
</section>
