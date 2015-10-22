<div ng-controller="mediaImportCtrl">
	<div id="left-pane">
		<div id="file-type-filter">
			{{fileType.fileTypeText}}</br>
			<label data-ng-repeat="choice in fileType.choices">
				<label ng-show="choice.show">{{choice.text}}:</label>
				<input type="radio" name="response" ng-show="choice.show" ng-model="choice.isUserAnswer" data-ng-value="choice.isUserAnswer" ng-click="setChosenType(choice.text)">
			</label>
		</div>
		<div class="pane-header" ng-show="videoImport">
			Enter a YouTube embedded link
		</div>
		<form id="embed-link-form" ng-show="videoImport">
			<label>Title:</label>
			<input id="embed-link-title" type="text" placeholder="Electro Swing Collection">
			<label>Embed URL:</label>
			<input id="embed-link" type="text" placeholder="https://youtu.be/BDOiHSZ9g0E">
			<button id="btn-upload-video" type="submit" value="Upload" data-ng-click="">Upload</button>
		</form>
		<div class="pane-header" ng-show="imageAndAudioImport">
			Upload a new file
		</div>
		<form id="uploader-form" ng-show="imageAndAudioImport">
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
