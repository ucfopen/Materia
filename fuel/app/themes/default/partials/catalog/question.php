<div style="width:100%" ng-controller="QuestionImporterCtrl">
	<form id="import-form">
		<h1>Question Catalog</h1>
		<table id="question-table" width="100%">
			<thead width="100%">
				<tr>
					<th>Question Text</th>
					<th>Type</th>
					<th>Date</th>
					<th>Used</th>
				</tr>
			</thead>
		</table>
		<div class="actions">
			<a id="cancel-button" href="#" onClick="self.close();">Cancel</a>
			<input id="submit-button" type="button" class="action_button" value="Import Selected">
		</div>
	</form>
</div>
