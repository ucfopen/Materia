<div ng-controller="qsetHistoryCtrl">
	
	<form id="import-form">
		<h1>Previous Saves</h1>
		<table id="qset-table" width="100%">
			<thead width="100%">
				<tr>
					<th>Question Count</th>
					<th>Saved At</th>
				</tr>
			</thead>
			<tr ng-repeat="save in saves" ng-click="loadSaveData(save.id)">
				<td>{{save.count}} Question{{save.count > 1 ? 's' : ''}}</td>
				<td>{{save.created_at}}</td>
			</tr>
		</table>
	</form>
	<div class="no-saves" ng-show="saves.length == 0">
		<h3>No previous saves for this widget.</h3>
		If you publish or a save a draft of your widget and then come back, you can view and restore previous saves from here.
	</div>

	<div class="actions">
		<a id="cancel-button" href="#" ng-click="closeDialog($event)">Cancel</a>
		<!-- <input id="submit-button" type="button" class="action_button" value="Import Selected"> -->
	</div>
</div>