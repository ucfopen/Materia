<section class="widget" ng-controller="playerCtrl" ng-init="inst_id = '<?= $inst_id ?>'">
	<header ng-if="isPreview" ng-class="preview-bar"></header>
	<div class="center">
		<iframe src="{{ htmlPath }}" ng-if="type == 'html'" id="container" class="html"></iframe>
		<div id="container" ng-if="type =='noflash'">
			<?= Theme::instance()->view('partials/noflash') ?>
		</div>
	</div>
</section>
