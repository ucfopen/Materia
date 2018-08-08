var genericCreator;

genericCreator = genericCreator || angular.module('genericCreator', []);

genericCreator.controller('genericCreatorCtrl', [
	'$scope', '$window', function($scope, $window) {
		$scope.title = ''
		$scope.icon ='';
		$scope.initNewWidget = function(widget) {
			$scope.$apply(function() {
				$scope.engineName = widget.name;
				$scope.icon = $window.origin + '/widget/' + widget.dir + 'img/icon-92.png';
			})
		}

		$scope.initExistingWidget = function(title, widget) {
			$scope.$apply(function() {
				$scope.engineName = title;
			})
		}

		$scope.onSaveClicked = function() {
			if ($scope.title) {
				return Materia.CreatorCore.save($scope.title);
			} else {
				return Materia.CreatorCore.cancelSave('Widget has no title!')
			}
		}
		return Materia.CreatorCore.start($scope);
	}
]);