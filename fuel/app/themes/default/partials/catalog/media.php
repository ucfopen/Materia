<div ng-controller='MediaImportCtrl' class='media-importer'>
	<section id='left-pane'>
		<div class='pane-header'>
			Upload a new file
		</div>
		<div file-dropper
			file-on-change='uploadFile'
			id='drag-wrapper'>
			<div class='drag-text'>
				Drag a file here to upload
			</div>
		</div>
		<div class='drag-footer'>
			<label>
				<input type='file' file-on-change='uploadFile'/>
				<span class='action_button select_file_button'>Browse...</span>
			</label>
		</div>
	</section>

	<section id='right-pane'>
		<div class='pane-header darker'>
			Pick from your library
			<span class='close-button'
				ng-click='cancel()'>
			</span>
		</div>
		<div id='sort-bar'>
			<div id='sort-options'>
				<div class='sort-option'
					ng-repeat='option in sortOptions'
					ng-class="{
						'sort-asc': option.status == 'asc',
						'sort-desc': option.status == 'desc'
					}"
					ng-click='sortBy(option)'>
					{{option.name}}
				</div>
			</div>
			<div>
				<input ng-model='filter'
					ng-change='filterFiles()'/>
			</div>
		</div>

		<div id='file-display'>
			<div class='file-info'
				ng-if='displayFiles.length < 1'>
				No files available!
			</div>
			<div class='file-info'
				ng-click='select(file)'
				ng-repeat='file in displayFiles'>
				<span class='file-thumbnail'>
					<img ng-src="{{file.thumb}}">
				</span>
				<span class='file-name'>
					<strong>
						{{file.name}}
					</strong>
					{{file.type}}
				</span>
				<span class='file-date'>
					{{file.created}}
				</span>
			</div>
		</div>
	</section>
</div>
