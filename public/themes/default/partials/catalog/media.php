<div ng-controller="mediaImportCtrl">
	<div id="left-pane">
		<input className="upload-input" type="file" title=" " file-on-change="uploadFile" accept={this.props.allowedTypes.join(',')} />
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
