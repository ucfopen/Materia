const app = angular.module('materia')

app.directive('fileDropper', () => ({
	restrict: 'AE',
	link(scope, element) {
		element.bind('drag dragstart dragend dragover dragenter dragleave drop', (event) => {
			event.preventDefault()
			switch (event.type) {
				case 'dragover': // intentional case fall-through
				case 'dragenter':
					element.addClass('drag-is-dragover')
					break

				case 'dragleave': // intentional case fall-through
				case 'dragend': // intentional case fall-through
				case 'drop': // intentional case fall-through
				default:
					element.removeClass('drag-is-dragover')
					break
			}
		})
	},
}))
