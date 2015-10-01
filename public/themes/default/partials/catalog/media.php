<div ng-controller="mediaImportCtrl">
	<div id="left-pane">
		<div id="file-type-filter">
			{{fileType.fileTypeText}}</br>
			<label data-ng-repeat="choice in fileType.choices">
				{{choice.text}}:
				<input type="radio" name="response" ng-model="choice.isUserAnswer" data-ng-value="true" ng-click="setChosenType(choice.text)">
			</label>
			</br>Chosen Type: {{fileType.chosenType}}
		</div>
		<div class="pane-header" ng-hide="video">
			Enter a YouTube embedded link
		</div>
		<form id="embed-link-form" ng-hide="video">
			<div id="uploader"></div>
		</form>
		<div class="pane-header" ng-hide="imageAndAudioImport">
			Upload a new file
		</div>
		<form id="uploader-form" ng-hide="imageAndAudioImport">
			<div id="uploader"></div>
		</form>
	</div>
	<form id="import-form" class="right-pane">
		<div class="pane-header">
			Pick from your library
			<a href="#" id="close-button"></a>
		</div>
		<div id="sort-bar">
			<div id="sort-cols">
				<div class="col-cont" ng-repeat="col in cols">
					<label id='sort-{{col}}' class="dt-sorting">{{col}}</label>
					<div class='arrows'></div>
				</div>
			</div>
		</div>

		<table id="question-table">
			<thead>
				<tr>
					<th ng-repeat="col in dt_cols"></th>
				</tr>
			</thead>
		</table>
		<div id="modal-cover"></div>
	</form>	
	
</div>
