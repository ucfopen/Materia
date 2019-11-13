<div class="dialog" ng-controller="qsetRollbackConfirmCtrl">
	<h3>Previewing Old Save</h3>
	<p>To return to the version you were working on, select <span class="bold">Cancel.</span> If you want to keep this version of the widget, select <span class="bold">Keep.</span> You will still have to save the widget afterwards by selecting <span class="bold">Update.</span>
	<div class="actions">
		<button ng-click="closeDialog($event, false)">Cancel</button>
		<button class="commit" ng-click="closeDialog($event, true)">Keep</button>
	</div>
</div>