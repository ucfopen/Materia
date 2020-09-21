const app = angular.module('materia')
app.controller('AdminWidgetController', function ($scope, Please, AdminSrv) {
	const _save = (widget) => {
		const update = {
			id: widget.id,
			clean_name: widget.clean_name,
			in_catalog: widget.in_catalog,
			is_editable: widget.is_editable,
			is_scorable: widget.is_scorable,
			is_playable: widget.is_playable,
			restrict_publish: widget.restrict_publish,
			about: widget.meta_data.about,
			excerpt: widget.meta_data.excerpt,
			demo: widget.meta_data.demo,
		}

		AdminSrv.saveWidget(update).then((response) => {
			widget.errorMessage = []
			for (let prop in response) {
				const stat = response[prop]
				if (stat !== true) {
					widget.errorMessage.push(stat)
				}
			}
			if (widget.errorMessage.len === 0) {
				delete widget.errorMessage
			}
			Please.$apply()
		})
	}

	const _displayWidgets = () =>
		AdminSrv.getWidgets().then((widgets) => {
			widgets.forEach((w) => {
				w.icon = Materia.Image.iconUrl(w.dir, 60)
			})

			$scope.widgets = widgets
			Please.$apply()
		})

	const _onUploaderChange = (e) => {
		$scope.selectedFileName = 'No File Selected'
		if (e.target.files && e.target.files.length > 0) {
			$scope.selectedFileName = e.target.files[0].name
		}
		Please.$apply()
	}

	// Expose to scope

	$scope.selectedFileName = 'No File Selected'
	$scope.widgets = []
	$scope.save = _save

	// Initialize

	// since the file input is hidden, watch events on it so we can put selected filenames elsewhere
	const uploader = document.getElementById('widget_uploader')
	if (uploader) uploader.addEventListener('change', _onUploaderChange)

	_displayWidgets()
})
