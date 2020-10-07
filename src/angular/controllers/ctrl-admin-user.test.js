describe('AdminUserController', function () {
	var AdminSrv
	var _UserServ
	var sendMock
	var postMock
	var getMock
	var $controller
	var $window
	var mockPlease
	var $q
	var $rootScope

	let mockJsonPromiseOnce = (method, result) => {
		method.mockImplementationOnce((n, arg, cb) => {
			const deferred = $q.defer()
			deferred.resolve(result)
			return deferred.promise
		})
	}

	beforeEach(() => {
		_UserServ = {
			getAvatar: jest.fn(() => 'avatar'),
		}
		mockPlease = { $apply: jest.fn() }
		let app = angular.module('materia')
		app.factory('Please', () => mockPlease)
		app.factory('UserServ', () => _UserServ)

		// MOCK $window
		$window = {
			addEventListener: jest.fn(),
			location: {
				reload: jest.fn(),
			},
		}
		app.factory('$window', () => $window)

		require('../common/materia-namespace')
		require('../common/materia-constants')
		require('../services/srv-admin')
		require('./ctrl-admin-user')

		inject((_$controller_, _$q_, _AdminSrv_, _$rootScope_) => {
			$controller = _$controller_
			$q = _$q_
			AdminSrv = _AdminSrv_
			$rootScope = _$rootScope_
		})

		Namespace('Materia.Coms.Json').send = sendMock = jest.fn()
		Namespace('Materia.Coms.Json').post = postMock = jest.fn()
		Namespace('Materia.Coms.Json').get = getMock = jest.fn()
		Namespace('Materia.User').getCurrentUser = getCurrentUserMock = jest.fn()
		Namespace('Materia.Image').iconUrl = jest.fn(() => 'iconurl')
	})

	it('defines expected scope vars', () => {
		var $scope = { $watch: jest.fn() }
		var controller = $controller('AdminUserController', { $scope })

		expect($scope.inputs).toMatchObject({ userSearchInput: '' })
		expect($scope.searchResults).toMatchObject({
			none: true,
			show: false,
			searching: false,
			matches: [],
		})
		expect($scope.selectedUser).toBeNull()
		expect($scope.additionalData).toBeNull()
		expect($scope.errorMessage).toMatchObject([])
		expect(typeof $scope.searchMatchClick).toBe('function')
		expect(typeof $scope.save).toBe('function')
		expect(typeof $scope.deselectUser).toBe('function')
	})

	it('defines watches search input changes', () => {
		var $scope = { $watch: jest.fn() }
		var controller = $controller('AdminUserController', { $scope })

		expect($scope.$watch).toHaveBeenCalledWith('inputs.userSearchInput', expect.anything())
	})

	it('deselectUser resets scope vars', () => {
		var $scope = { $watch: jest.fn() }
		var controller = $controller('AdminUserController', { $scope })
		$scope.errorMessage = 'test'
		$scope.selectedUser = 'test'
		$scope.additionalData = 'test'
		$scope.deselectUser()

		expect($scope.errorMessage).toMatchObject([])
		expect($scope.selectedUser).toBe(null)
		expect($scope.additionalData).toBe(null)
	})

	it('searchMatchClick looks up a user and updates the scope', () => {
		let lookupUser = {
			instances_available: [{ icon: 3, widget: { dir: '999' } }],
			instances_played: [{ id: 9, name: 'test', widget: { dir: 'somedir' } }],
		}
		let instances_played = [
			{
				icon: 'iconurl',
				id: 9,
				name: 'test',
				plays: [
					{
						id: 9,
						name: 'test',
						widget: {
							dir: 'somedir',
						},
					},
				],
				widget: { dir: 'somedir' },
			},
		]

		var $scope = { $watch: jest.fn(), $apply: jest.fn() }
		var controller = $controller('AdminUserController', { $scope })

		mockJsonPromiseOnce(getMock, lookupUser)
		$scope.searchMatchClick({ id: 5 })
		$rootScope.$digest() // processes promise
		expect(getMock).toHaveBeenCalledWith('/api/admin/user/5')
		expect(mockPlease.$apply).toHaveBeenCalledTimes(1)
		expect($scope.additionalData.instances_played).toMatchObject(instances_played)
	})

	it('save sends args to service and updates scope', () => {
		var $scope = { $watch: jest.fn(), $apply: jest.fn() }
		var controller = $controller('AdminUserController', { $scope })

		$scope.selectedUser = {
			id: 1,
			email: 'email',
			is_student: 'false',
			profile_fields: {
				notify: 'notify',
				useGravatar: 'true',
			},
		}

		mockJsonPromiseOnce(postMock, { id: 1 })
		$scope.save()
		$rootScope.$digest() // processes promise
		expect(postMock).toHaveBeenCalledWith('/api/admin/user/1', {
			email: 'email',
			id: 1,
			is_student: false,
			notify: 'notify',
			useGravatar: true,
		})
		expect($scope.errorMessage).toMatchObject([1])
		expect(mockPlease.$apply).toHaveBeenCalledTimes(1)
	})

	it('save sets errors', () => {
		var $scope = { $watch: jest.fn(), $apply: jest.fn() }
		var controller = $controller('AdminUserController', { $scope })

		$scope.selectedUser = {
			id: 1,
			email: 'email',
			is_student: false,
			profile_fields: {
				notify: 'notify',
				useGravatar: 'true',
			},
		}

		mockJsonPromiseOnce(postMock, { id: 'this was an error' })
		$scope.save()
		$rootScope.$digest() // processes promise
		expect($scope.errorMessage).toMatchObject(['this was an error'])
		expect(mockPlease.$apply).toHaveBeenCalledTimes(1)
	})

	it('search sends args to service and updates scope', () => {
		var $scope = { $watch: jest.fn(), $apply: jest.fn() }
		var controller = $controller('AdminUserController', { $scope })

		mockJsonPromiseOnce(getMock, { id: 1 })

		$scope.jestTest._searchFor('one')
		expect(getMock).toHaveBeenCalledTimes(1)
		expect(getMock).toHaveBeenLastCalledWith('/api/admin/user_search/one')

		mockJsonPromiseOnce(getMock, { id: 1 })
		$scope.jestTest._searchFor('one two three')
		expect(getMock).toHaveBeenCalledTimes(2)
		expect(getMock).toHaveBeenLastCalledWith('/api/admin/user_search/one%20two%20three')
	})

	it('search sends doesnt search twice with the same input', () => {
		var $scope = { $watch: jest.fn(), $apply: jest.fn() }
		var controller = $controller('AdminUserController', { $scope })

		mockJsonPromiseOnce(getMock, { id: 1 })
		mockJsonPromiseOnce(getMock, { id: 1 })
		$scope.jestTest._searchFor('one')
		$scope.jestTest._searchFor('one')
		expect(getMock).toHaveBeenCalledTimes(1)
	})

	it('search responds to api errors with an alert and a location change', () => {
		global.alert = jest.fn()
		var $scope = { $watch: jest.fn(), $apply: jest.fn() }
		var controller = $controller('AdminUserController', { $scope })

		mockJsonPromiseOnce(getMock, { halt: true, msg: 'oh no' })
		$scope.jestTest._searchFor('one')
		$rootScope.$digest() // processes promise
		expect(alert).toHaveBeenCalledWith('oh no')
		expect($window.location.reload).toHaveBeenCalledWith(true)
	})

	it('search handles no matches', () => {
		var $scope = { $watch: jest.fn(), $apply: jest.fn() }
		var controller = $controller('AdminUserController', { $scope })

		mockJsonPromiseOnce(getMock, [])
		$scope.jestTest._searchFor('one')
		$rootScope.$digest() // processes promise
		expect($scope.searchResults.none).toBe(true)
		expect($scope.searchResults.show).toBe(true)
		expect($scope.searchResults.matches).toMatchObject([])
	})

	it('search short cuts empty string', () => {
		var $scope = { $watch: jest.fn(), $apply: jest.fn() }
		var controller = $controller('AdminUserController', { $scope })

		mockJsonPromiseOnce(getMock, [])
		$scope.jestTest._searchFor('one')
		$scope.jestTest._searchFor('')
		$rootScope.$digest() // processes promise
		expect($scope.searchResults.none).toBe(true)
		expect($scope.searchResults.show).toBe(false)
		expect($scope.searchResults.matches).toMatchObject([])
	})

	it('search shows sorted matches', () => {
		var $scope = { $watch: jest.fn(), $apply: jest.fn() }
		var controller = $controller('AdminUserController', { $scope })

		let expected = [
			{
				first: 'a',
				gravatar: 'avatar',
				last: 'a',
			},
			{
				first: 'z',
				gravatar: 'avatar',
				last: 'z',
			},
		]

		mockJsonPromiseOnce(getMock, [
			{ first: 'z', last: 'z' },
			{ first: 'a', last: 'a' },
		])
		$scope.jestTest._searchFor('one')
		$rootScope.$digest() // processes promise
		expect($scope.searchResults.none).toBe(false)
		expect($scope.searchResults.show).toBe(true)
		expect(mockPlease.$apply).toHaveBeenCalled()
		expect($scope.searchResults.matches).toMatchObject(expected)
	})
})
