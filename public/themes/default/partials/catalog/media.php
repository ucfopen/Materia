<div ng-controller="mediaImportCtrl">
	<div id="left-pane">
		<div class="box-drag-area">
			<form>
			<div className="upload-input." type="file" title=" " file-on-change="uploadFile" accept={this.props
			   .allowedTypes.join(',')}  />
			<label file-on-change="uploadFile" for="file"><strong>Choose a file</strong><span class="box-drag-mainarea"> or
				drag it here</span>.</label>
			</form>
		</div>
		<input className="upload-input" type="file" title=" " file-on-change="uploadFile" accept={this.props.allowedTypes.join(',')}  />
		<label file-on-change="uploadFile" for="file"><strong>Choose a file</strong><span class="box-drag-mainarea"> or
				drag it here</span>.</label>
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
