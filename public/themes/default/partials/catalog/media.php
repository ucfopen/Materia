<div ng-controller="mediaImportCtrl">
	<div id="left-pane">
		<div id="file-type-filter">
			{{fileType.fileTypeText}}</br>
			<label ng-repeat="choice in fileType.choices">
				<label ng-show="{{choice.show}}">{{choice.text}}:</label>
				<input type="radio" name="response" ng-show="{{choice.show}}" ng-model="choice.isUserAnswer" ng-value="choice.isUserAnswer" ng-click="setChosenType(choice.text)">
			</label>
		</div>
		<div class="pane-header" ng-show="videoImport">
			Enter a YouTube embedded link
		</div>
		<form id="embed-link-form" ng-show="videoImport">
			<label class="main-video-labels">Title: </label><label id="title-error" data-ng-show="invalidTitle"> *You must enter a title for this upload.</label>
			<input id="embed-link-title" type="text" data-ng-model="title" placeholder="Electro Swing Collection">
			<label class="main-video-labels">Embed URL: </label><label id="link-error" data-ng-show="invalidLink"> *Not a valid YouTube embed link.</label>
			<input id="embed-link" type="text" data-ng-model="link" placeholder="https://www.youtube.com/embed/JxKR7BaitxM">
			<button id="btn-upload-video" type="submit" value="Upload" data-ng-click="submitVideoLink(title, link)">Upload</button>
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

	</form>	
</div>
