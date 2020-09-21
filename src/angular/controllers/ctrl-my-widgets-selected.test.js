describe('MyWidgetSelectedController', () => {
	var AdminSrv
	var $controller
	var mockPlease
	var $q
	var $rootScope
	var $scope

	beforeEach(() => {
		mockPlease = { $apply: jest.fn() }
		let app = angular.module('materia')
		app.factory('Please', () => mockPlease)

		require('../common/materia-namespace')
		require('../common/materia-constants')
		require('../services/srv-admin')
		require('../services/srv-widget')
		require('../services/srv-selectedwidget')
		require('../services/srv-datetime')
		require('../services/srv-user')
		require('./ctrl-alert')
		require('ngmodal/dist/ng-modal')
		require('./ctrl-my-widgets-selected')

		inject((_$controller_, _$q_, _AdminSrv_, _$rootScope_) => {
			$controller = _$controller_
			$q = _$q_
			AdminSrv = _AdminSrv_
			$rootScope = _$rootScope_
		})

		$scope = {
			$watch: jest.fn(),
			$on: jest.fn(),
		}

		Namespace('Materia.Coms.Json').send = jest.fn()

		var controller = $controller('MyWidgetsSelectedController', { $scope })
	})

	it('defines expected scope vars', () => {
		expect($scope.hideModal).toBeDefined()
		expect($scope.removeExpires).toBeDefined()
		expect($scope.setupPickers).toBeDefined()
		expect($scope.showCollaboration).toBeDefined()
		expect($scope.showDelete).toBeDefined()
		expect($scope.showCopyDialog).toBeDefined()
		expect($scope.getEmbedLink).toBeDefined()
		expect($scope.editWidget).toBeDefined()
		expect($scope.popup).toBeDefined()
		expect($scope.hideModal).toBeDefined()
		expect($scope.exportPopup).toBeDefined()
		expect($scope.copyWidget).toBeDefined()
		expect($scope.deleteWidget).toBeDefined()
		expect($scope.enableOlderScores).toBeDefined()
		expect($scope.alert).toBeDefined()
	})

	it('hideModal uses a flexible scope', () => {
		expect($scope.hideModal).toBeDefined()

		this.$parent = {
			hideModal: jest.fn(),
		}

		// calling hideModal should call the hideModal we provide in this scope
		// this will not pass if $scope.hideModal is an arrow function
		$scope.hideModal.bind(this)()
		expect(this.$parent.hideModal).toHaveBeenCalled()
	})

	it('does nothing if a widget is not editable', () => {
		$scope.selected = {
			editable: false,
		}

		$scope.editWidget()

		expect(Materia.Coms.Json.send).not.toHaveBeenCalled()
	})

	it('sets an alert message if the widget is locked already', () => {
		$scope.selected = {
			editable: true,
			widget: {
				id: 1,
			},
		}

		Namespace('Materia.Coms.Json').send = jest.fn().mockResolvedValueOnce({
			is_locked: true,
			can_publish: true,
		})

		return $scope.jestTest._editWidgetPromise().then(() => {
			expect(Materia.Coms.Json.send).toHaveBeenCalledWith('widget_instance_edit_perms_verify', [1])
			expect($scope.alert.msg).toBe(
				'This widget is currently locked, you will be able to edit this widget when it is no longer being edited by somebody else.'
			)
		})
	})
})
