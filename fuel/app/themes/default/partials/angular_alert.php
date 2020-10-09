<div ng-controller="AlertCtrl">
	<modal-dialog show="alert.msg"
		class="alert"
		ng-class="{ fatal: alert.fatal }"
		dialog-title="{{ alert.title }}"
		width="520px"
		z-index="1000000">
		<p>{{ alert.msg }}</p>
		<button ng-hide="alert.fatal" ng-click="alert.msg = null" class="action_button">Okay</button>
		<button ng-show="alert.enableLoginButton" ng-click="reloadPage()" class="action_button">Click Here to Login</button>
	</modal-dialog>
</div>
