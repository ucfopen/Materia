import toSnakeCase from 'js-snakecase'

const app = angular.module('materia')

// when the current url matches the widget catalog
// then use html5Mode to allow the filters and search to update the url
// and add ng-animate
// ex: /widgets or /widgets/1-adventure
if (window.location.href.match(/\/widgets($|\/\D|\?)/g)) {
	app.config(function ($locationProvider) {
		$locationProvider.html5Mode({
			enabled: true,
			requireBase: false,
		})
	})

	app.requires.push('ngAnimate')
}

app.controller('WidgetCatalogCtrl', function (Please, $scope, $window, $location, WidgetSrv) {
	const filterList = {} // key is raw filter name, value is filter object
	const mapCleanToFilter = {} // key is clean name, value is filter object
	const displayedWidgets = []
	let allWidgets = []

	const resetFilters = () => {
		for (i in filterList) delete filterList[i]
		for (i in mapCleanToFilter) delete mapCleanToFilter[i]
	}

	const showFilters = () => {
		$scope.isShowingFilters = true
	}

	const clearFilters = (hideFilters = true) => {
		// set all filters to false
		for (let filter in filterList) {
			setFilter(filterList[filter], false)
		}

		if (hideFilters) $scope.isShowingFilters = false
		_updateWidgetDisplay()
	}

	const clearFiltersAndSearch = (hideFilters = true) => {
		$scope.search = ''
		clearFilters(hideFilters)
	}

	const toggleFilter = (filterName) => {
		const filter = filterList[filterName]
		setFilter(filter, !filter.isActive)
		_updateWidgetDisplay()
	}

	const setFilter = (filter, value) => {
		filter.isActive = value
		const cleanName = filter.clean
		const val = filter.isActive || null
		$location.search(cleanName, val).replace()
	}

	const _registerFilter = (name, appendLabel = '') => {
		const clean = toSnakeCase(name)
		const filter = {
			isActive: false,
			text: `${name}${appendLabel}`,
			clean,
		}
		filterList[name] = filter
		mapCleanToFilter[clean] = filter
	}

	const _getFiltersFromWidgets = (widgets) => {
		widgets.forEach((widget) => {
			if (widget.meta_data.hasOwnProperty('features')) {
				widget.meta_data.features.forEach((feature) => {
					if (!filterList.hasOwnProperty(feature)) _registerFilter(feature)
				})
			}

			if (widget.meta_data.hasOwnProperty('supported_data')) {
				widget.meta_data.supported_data.forEach((data) => {
					if (!filterList.hasOwnProperty(data)) _registerFilter(data, ' Questions')
				})
			}
		})
	}

	// checks filters and returns true if the widget should be shown, false if filtered out
	const _isWidgetVisible = (widget) => {
		const wFeatures = widget.meta_data.features
		const wSupport = widget.meta_data.supported_data

		// check for filter matches
		for (let filterName in filterList) {
			// this filter is active
			if (filterList[filterName].isActive) {
				// widget has features/support and the feature isn't in either
				if (
					(!wFeatures || !wFeatures.includes(filterName)) &&
					(!wSupport || !wSupport.includes(filterName))
				) {
					return false
				}
			}
		}

		// check for search matches
		if ($scope.search.length) {
			const re = new RegExp($scope.search, 'i')
			return re.test(widget.name)
		}

		return true
	}

	const _updateWidgetDisplay = () => {
		const widgets = allWidgets.filter((w) => _isWidgetVisible(w))
		$scope.count = widgets.length
		$scope.activeFilters = Object.keys(filterList).filter((key) => filterList[key].isActive)
		$scope.isFiltered = widgets.length != allWidgets.length

		if ($scope.isFiltered) {
			// don't display featured - place everything in widgets
			$scope.widgets = widgets
		} else {
			// no filters active - show the featured list
			$scope.widgets = widgets.filter((w) => w.in_catalog != '1')
		}

		Please.$apply()
	}

	const _onSearch = () => {
		const val = $scope.search || null
		$location.search('search', val).replace()
		_updateWidgetDisplay()
	}

	const _loadWidgets = () => {
		// load list of widgets
		WidgetSrv.getWidgetsByType('all').then((loaded) => {
			if (!loaded || !loaded.length || !loaded.length > 0) {
				resetFilters()
				loaded = []
			}
			allWidgets = loaded

			$scope.noWidgetsInstalled = allWidgets.length == 0

			_getFiltersFromWidgets(allWidgets)

			// memoize icon paths
			allWidgets.forEach((widget) => {
				widget.icon = Materia.Image.iconUrl(widget.dir, 275)
			})

			$scope.totalWidgets = allWidgets.length
			$scope.featuredWidgets = allWidgets.filter((w) => w.in_catalog == '1')

			// start watching search input
			$scope.$watch('search', _onSearch)

			// load the filters now because they come from the widgets
			_getFiltersFromURL()

			_updateWidgetDisplay()

			// prevents animation on initial load; set after initial $apply
			$scope.ready = true
		})
	}

	const _getFiltersFromURL = () => {
		$scope.isShowingFilters = false
		for (let key in $location.search()) {
			if (key == 'search') {
				$scope.search = $location.search().search
			} else if (mapCleanToFilter[key]) {
				mapCleanToFilter[key].isActive = true
				$scope.isShowingFilters = true
			}
		}
	}

	$scope.search = ''
	$scope.totalWidgets = -1
	$scope.count = -1
	$scope.noWidgetsInstalled = false
	$scope.isShowingFilters = false
	$scope.ready = false
	$scope.activeFilters = []
	$scope.showFilters = showFilters
	$scope.clearFilters = clearFilters
	$scope.clearFiltersAndSearch = clearFiltersAndSearch
	$scope.featuredWidgets = []
	$scope.toggleFilter = toggleFilter
	$scope.widgets = []
	$scope.filters = filterList
	$scope.isFiltered = false

	// with html mode on, angular processes location changes
	// We have to manually change url when needed
	$scope.$on('$locationChangeStart', (e, newUrl) => {
		if (!newUrl.match(/\/widgets($|\/\D|\?)/g)) {
			$window.location = newUrl
		} else if ($scope.totalWidgets != -1) {
			// handles the "Widget Catalog" link in the header
			const urlParamCount = Object.keys($location.search()).length
			if (urlParamCount == 0) {
				clearFiltersAndSearch(false)
			}
		}
	})

	_loadWidgets()

	/* develblock:start */
	// these method are exposed for testing
	$scope.jestTest = {
		getLocalVar: (name) => eval(name),
	}
	/* develblock:end */
})
