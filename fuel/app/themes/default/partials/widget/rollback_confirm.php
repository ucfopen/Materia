<div ng-controller="qsetRollbackConfirmCtrl">
	<h3>Previewing Old Save</h3>
	<p>If you want to restore this saved version of the widget, select "Save". To go back to what you were working on, select "Cancel".
	<div class="actions">
		<button ng-click="closeDialog($event)">Cancel</button>
		<button>Save</button>
	</div>
</div>