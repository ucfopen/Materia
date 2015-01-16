<section class="widget" ng-controller="playerCtrl" ng-init="inst_id = '<?= $inst_id ?>'" ng-class="{ preview: isPreview }">
	<div class="center" ng-show="type == 'flash' || type == 'html'">
		<header ng-if="isPreview" class="preview-bar"></header>
		<iframe src="{{ htmlPath }}" ng-if="type == 'html'" id="container" class="html"></iframe>
		<div id="container" ng-if="type =='flash'"></div>
	</div>
	<div id="container" ng-if="type =='noflash'">
		<?= Theme::instance()->view('partials/noflash') ?>
	</div>
	<modal-dialog show="alert.msg" dialog-title="{{ alert.title }}" width="520px">
		{{ alert.msg }}
		<button ng-click="alert.msg = null" class="action_button">Okay</button>
	</modal-dialog>
</section>
