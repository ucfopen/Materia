<div ng-controller="mediaImportCtrl">
	<form id="import-form">
		<h1>Media Catalog</h1>
		<table id="question-table">
			<thead>
				<tr>
					<th></th>
					<th></th>
					<th>Name</th>
					<th>Type</th>
					<th>Size</th>
					<th>Uploaded</th>
				</tr>
			</thead>
		</table>
		<div id="modal-cover"></div>
		<a id="upload-cancel-button" href="#" onClick="toggleUploader(); return false;" class="action_button gray">Upload...</a>
		<div class="actions">
			<a id="cancel-button" href="#" onClick="self.close();">Cancel</a>
			<input id="submit-button" type="button" class="action_button" value="Import Selected">
		</div>
	</form>
	<form id="uploader-form" style="display:none;">
		<div id="uploader"></div>
	</form>
</div>
