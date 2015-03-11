<section class="widget" ng-controller="playerCtrl" ng-init="inst_id = '<?= $inst_id ?>'" ng-class="{ preview: isPreview }">
	<div class="center" ng-show="type == 'flash' || type == 'html'">
		<header ng-if="isPreview" class="preview-bar"></header>
		<iframe ng-attr-src="{{ htmlPath }}" ng-if="type == 'html'" id="container" class="html" scrolling="no"></iframe>
		<div id="container" ng-if="type =='flash'"></div>
	</div>
	<div id="container" ng-if="type =='noflash'">
		<?= Theme::instance()->view('partials/noflash') ?>
	</div>
	<modal-dialog show="alert.msg" dialog-title="{{ alert.title }}" width="520px">
		{{ alert.msg }}
		<button ng-click="alert.msg = null" class="action_button">Okay</button>
	</modal-dialog>
	<modal-dialog show="fatal.msg" dialog-title="{{ fatal.title }}" width="520px">
		<div>{{ fatal.msg }}</div>
	</modal-dialog>
</section>
