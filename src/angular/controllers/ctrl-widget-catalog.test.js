describe('WidgetCatalogCtrl', () => {
	let $controller
	let $q
	let $scope
	let $location
	let location
	let mockIconUrl
	let mockWidgetSrv
	let mockLocationSearch
	let widgetsToReturn

	const mockUrl = 'http://localhost/widgets?customizable&search=widget&fake_feature'
	const widget1 = {
		id: 1,
		dir: 'mockDir1',
		in_catalog: '1',
		meta_data: {
			about: 'information about the widget',
			demo: '1',
			excerpt: 'more information about the widget',
			features: ['feature1', 'feature3'],
			supported_data: ['supported1', 'supported_three', 'SuPpOrTeD FoUr!!'],
		},
		name: 'widget1',
	}
	const widget2 = {
		id: 2,
		dir: 'mockDir2',
		in_catalog: '0',
		meta_data: {
			about: 'information about the widget',
			demo: '2',
			excerpt: 'more information about the widget',
			features: ['feature2', 'feature3'],
			supported_data: ['supported1', 'supported2'],
		},
		name: 'widget2',
	}
	const widget3 = {
		id: 3,
		dir: 'mockDir3',
		in_catalog: '0',
		meta_data: {
			about: 'information about the widget',
			demo: '3',
			excerpt: 'more information about the widget',
			features: [],
			supported_data: [],
		},
		name: 'widget3',
	}

	const widgetWithoutFeatures = {
		id: 4,
		dir: 'mockDir4',
		in_catalog: '0',
		meta_data: {
			about: 'information about the widget',
			demo: '4',
			excerpt: 'more information about the widget',
			// features and supported_data are null!!
		},
		name: 'widgetWithoutFeatures',
	}

	beforeEach(() => {
		widgetsToReturn = [widget1, widget2, widget3, widgetWithoutFeatures]
		// mocks getWidgetsByType promise with a synchronous implementation
		// why? because it's an internal private method and getting a handle
		// to wait for it to finish is difficult
		let getWidgetsByTypeImmediately = jest.fn().mockReturnValue({
			then: (cb) => {
				cb(widgetsToReturn)
			},
		})
		// mock all the required services
		mockWidgetSrv = { getWidgetsByType: getWidgetsByTypeImmediately }
		let app = angular.module('materia')
		app.factory('Please', () => ({ $apply: jest.fn() }))
		app.factory('SelectedWidgetSrv', () => ({}))
		app.factory('DateTimeServ', () => ({}))
		app.factory('WidgetSrv', () => mockWidgetSrv)

		// mock Materia.Image.iconUrl
		mockIconUrl = jest.fn().mockReturnValue('widget.jpg')
		window.Materia = { Image: { iconUrl: mockIconUrl } }

		// mock window.location
		let mockWindow = {}
		let mockLocationSet = jest.fn((l) => (location = l))
		let mockLocationGet = jest.fn(() => location)
		Object.defineProperty(mockWindow, 'location', {
			get: mockLocationGet,
			set: mockLocationSet,
		})
		app.factory('$window', () => mockWindow)

		// manually set the url
		window.history.pushState({}, '', mockUrl)

		// build a mock $scope
		$scope = {
			$watch: jest.fn(),
			$on: jest.fn(),
		}

		mockLocationSearch = { search: '' }

		require('angular-animate')
		require('./ctrl-widget-catalog')

		inject((_$controller_, _$location_, _$q_) => {
			$controller = _$controller_
			$location = _$location_
			$q = _$q_

			// mock to get/set url params
			$location.search = jest.fn((key, val) => {
				if (!key) {
					return mockLocationSearch
				}
				return {
					replace: jest.fn(),
				}
			})
		})
	})

	it('defines expected scope vars', () => {
		$controller('WidgetCatalogCtrl', { $scope })
		expect(Object.keys($scope)).toMatchSnapshot()
	})

	it('loads widgets from the widget service', () => {
		$controller('WidgetCatalogCtrl', { $scope })
		expect(mockWidgetSrv.getWidgetsByType).toHaveBeenCalledTimes(1)
		expect(mockWidgetSrv.getWidgetsByType).toHaveBeenCalledWith('all')
	})

	it('uses Materia.Image.iconUrl to get each widget icon', () => {
		$controller('WidgetCatalogCtrl', { $scope })
		expect(mockIconUrl).toHaveBeenCalledTimes(4)
		expect(mockIconUrl).toHaveBeenCalledWith('mockDir1', 275)
		expect(mockIconUrl).toHaveBeenCalledWith('mockDir2', 275)
		expect(mockIconUrl).toHaveBeenCalledWith('mockDir3', 275)
		expect(mockIconUrl).toHaveBeenCalledWith('mockDir4', 275)
	})

	it('handles no widgets', () => {
		widgetsToReturn = []
		$controller('WidgetCatalogCtrl', { $scope })

		expect($scope.widgets).toHaveLength(0)
		expect($scope.featuredWidgets).toHaveLength(0)
		expect($scope.count).toEqual(0)
		expect($scope.noWidgetsInstalled).toBe(true)
		expect($scope.isFiltered).toBe(false)
		expect($scope.activeFilters).toHaveLength(0)
	})

	it('initializes with no filters and search on initial load', () => {
		$controller('WidgetCatalogCtrl', { $scope })

		expect(Object.keys($scope)).toMatchSnapshot()
		expect($scope.search).toBe('')
		expect($scope.activeFilters).toEqual([])
		expect($scope.isShowingFilters).toBe(false)
		expect($scope.isFiltered).toBe(false)

		expect($scope.count).toBe(4)

		expect($scope.featuredWidgets).toHaveLength(1)
		expect($scope.featuredWidgets).toContain(widget1)

		expect($scope.widgets).toHaveLength(3)
		expect($scope.widgets).toContain(widget2)
		expect($scope.widgets).toContain(widget3)
		expect($scope.widgets).toContain(widgetWithoutFeatures)

		expect($scope.filters).toMatchSnapshot()
	})

	it('implements url based filters and search on initial load', () => {
		mockLocationSearch = {
			feature1: true,
			search: 'widget',
			invalid_feature: true,
			supported_three: true,
		}
		$controller('WidgetCatalogCtrl', { $scope })

		expect(Object.keys($scope)).toMatchSnapshot()
		expect($scope.search).toBe('widget')
		expect($scope.activeFilters).toEqual(['feature1', 'supported_three'])
		expect($scope.isShowingFilters).toBe(true)
		expect($scope.isFiltered).toBe(true)

		expect($scope.count).toBe(1)

		// note: featuredWidgets is not altered by filters or search
		expect($scope.featuredWidgets).toHaveLength(1)
		expect($scope.featuredWidgets).toContain(widget1)

		// only one widget matches the search and filter options
		expect($scope.widgets).toHaveLength(1)
		expect($scope.widgets).toContain(widget1)

		expect($scope.filters).toMatchSnapshot()
	})

	it('properly generates clean filter names', () => {
		$controller('WidgetCatalogCtrl', { $scope })
		const mapCleanToFilter = $scope.jestTest.getLocalVar('mapCleanToFilter')
		expect(Object.keys(mapCleanToFilter)).toMatchSnapshot()
	})

	it('toggling on a filter updates scope', () => {
		$controller('WidgetCatalogCtrl', { $scope })
		expect($scope.isFiltered).toBe(false)
		expect($scope.activeFilters).toHaveLength(0)
		expect($scope.filters['feature1'].isActive).toBe(false)
		expect($scope.widgets).toHaveLength(3)
		expect($scope.count).toBe(4)

		$scope.toggleFilter('feature1') // toggle on

		expect($scope.isFiltered).toBe(true)
		expect($scope.activeFilters).toHaveLength(1)
		expect($scope.filters['feature1'].isActive).toBe(true)
		expect($scope.widgets).toHaveLength(1)
		expect($scope.widgets).toMatchSnapshot()
		expect($scope.count).toBe(1)
	})

	it('will filter widgets based on a search query', () => {
		$controller('WidgetCatalogCtrl', { $scope })
		const _onSearch = $scope.jestTest.getLocalVar('_onSearch')

		expect($scope.count).toBe(4)

		// search for widget 4
		$scope.search = 'widgetWithoutFeatures'
		_onSearch()

		expect($scope.count).toBe(1)
		expect($scope.widgets).toHaveLength(1)
		expect($scope.widgets).toContain(widgetWithoutFeatures)

		// search for widget 3
		$scope.search = 'widget3'
		_onSearch()

		expect($scope.count).toBe(1)
		expect($scope.widgets).toHaveLength(1)
		expect($scope.widgets).toContain(widget3)
	})

	it('can toggle whether the filters are showing', () => {
		$controller('WidgetCatalogCtrl', { $scope })
		$scope.showFilters()
		expect($scope.isShowingFilters).toBe(true)
		$scope.clearFilters()
		expect($scope.isShowingFilters).toBe(false)
	})

	it('can clear filters and search', () => {
		$controller('WidgetCatalogCtrl', { $scope })
		const _onSearch = $scope.jestTest.getLocalVar('_onSearch')
		$scope.search = 'widget1'
		_onSearch() // enable search
		$scope.toggleFilter('feature1') // toggle on
		expect($scope.activeFilters).toHaveLength(1)
		expect($scope.search).toBe('widget1')
		expect($scope.count).toBe(1)
		expect($scope.widgets).toHaveLength(1)

		// clear everything
		$scope.clearFiltersAndSearch()

		expect($scope.activeFilters).toHaveLength(0)
		expect($scope.search).toBe('')
		expect($scope.count).toBe(4)
		expect($scope.widgets).toHaveLength(3)
	})

	it('handles no widgets having features', () => {
		widgetsToReturn = [widgetWithoutFeatures]
		$controller('WidgetCatalogCtrl', { $scope })
		// $scope.toggleFilter('feature1') // toggle on
		expect($scope.count).toEqual(1)
	})

	it('omits widgets with null features when a feature filter is enabled', () => {
		widgetsToReturn = [widget1, widgetWithoutFeatures]
		$controller('WidgetCatalogCtrl', { $scope })
		expect($scope.count).toEqual(2)
		$scope.toggleFilter('feature1') // toggle on
		expect($scope.count).toEqual(1)
	})
})
