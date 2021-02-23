<div ng-controller="qsetHistoryCtrl">
	
	<form id="import_form">
		<h1>Save History</h1>
		<table id="qset_table" width="100%">
			<thead width="100%">
				<tr>
					<th>Save Count</th>
					<th>Saved At</th>
				</tr>
			</thead>
			<tr ng-repeat="save in saves" ng-click="loadSaveData(save.id)">
				<td>Save #{{saves.length - $index}}</td>
				<td>{{save.created_at}}</td>
			</tr>
		</table>
	</form>
	<div class="no_saves" ng-show="saves.length == 0">
		<h3>No previous saves for this widget.</h3>
		If you publish or a save a draft of your widget and then come back, you can view and restore previous saves from here.
	</div>

	<div class="actions">
		<a id="cancel_button" href="#" ng-click="closeDialog($event)">Cancel</a>
	</div>
</div>