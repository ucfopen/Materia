<div ng-controller="WidgetCatalogCtrl" class="container" id="widget-catalog-container">
	<section class="page">

		<div class="top">
			<h1>Widget Catalog</h1>
			<button class="filter-toggle cancel_button desktop-only" ng-click="isShowingFilters ? clearFilters() : showFilters()">{{isShowingFilters ? 'Clear Filters' : 'Filter by feature...'}}</button>
			<div class="search">
				<input ng-model="search" type="text">
				<div ng-class="['search-icon', {'not-empty': search != ''}]">
					<svg viewBox="0 0 250.313 250.313">
						<path d="m244.19 214.6l-54.379-54.378c-0.289-0.289-0.628-0.491-0.93-0.76 10.7-16.231 16.945-35.66 16.945-56.554 0-56.837-46.075-102.91-102.91-102.91s-102.91 46.075-102.91 102.91c0 56.835 46.074 102.91 102.91 102.91 20.895 0 40.323-6.245 56.554-16.945 0.269 0.301 0.47 0.64 0.759 0.929l54.38 54.38c8.169 8.168 21.413 8.168 29.583 0 8.168-8.169 8.168-21.413 0-29.582zm-141.28-44.458c-37.134 0-67.236-30.102-67.236-67.235 0-37.134 30.103-67.236 67.236-67.236 37.132 0 67.235 30.103 67.235 67.236s-30.103 67.235-67.235 67.235z" clip-rule="evenodd" fill-rule="evenodd"/>
					</svg>
				</div>
				<button ng-class="['search-close', {'not-empty': search != ''}]" tabindex="0" ng-click="search = ''" ng-show="search"></button>
			</div>
		</div>

		<div id="active-filters" class="mobile-only">
			<button id="add-filter" ng-class="{open: mobileFiltersOpen}" ng-click="mobileFiltersOpen = !mobileFiltersOpen">{{activeFilters.length ? "Filters" : "Filter by Feature"}}</button>
			<div>
				<span ng-repeat="filter in activeFilters">{{filter}}{{$last ? "" : ", "}}</span>
			</div>
		</div>

		<div id="filter-dropdown" ng-show="mobileFiltersOpen" ng-click="mobileFiltersOpen = !mobileFiltersOpen" class="mobile-only">
			<label ng-repeat="(id, filter) in filters">
				<input type="checkbox" class="filter-button" ng-checked="filter.isActive" ng-click="toggleFilter(id)">
				{{filter.text}}
			</label>
		</div>

		<div id="filters-container" ng-if="isShowingFilters" ng-class="{ready: ready}">
			<div class="filter-labels-container">
				<button class="feature-button" ng-repeat="(id, filter) in filters" ng-class="{selected: filter.isActive}" ng-click="toggleFilter(id)">
					{{filter.text}}
				</button>
			</div>
		</div>

		<div id="no-widgets-message" ng-if="widgets.length < 1">
			<span ng-if="isFiltered == true && count == 0">No widgets match the filters you set. <button class="cancel_button" ng-click="clearFiltersAndSearch()">Show All</button></span>
			<span ng-if="noWidgetsInstalled">No Widgets Installed</span>
			<span ng-if="!noWidgetsInstalled && totalWidgets == -1">Loading Widgets...</span>
		</div>

		<div class="widget-group" ng-if="totalWidgets > 0 && !isFiltered">
			<h1 class="container-label"><span>Featured Widgets</span></h1>
			<div class="widgets-container featured">
				<div ng-repeat="widget in featuredWidgets" class="widget" id="widget-{{widget.clean_name}}" ng-style="widget.style">
					<ng-include src="'widgetInfoCard'"></ng-include>
				</div>
			</div>
		</div>

		<div class="widgets-container">
			<div ng-repeat="widget in widgets" class="widget" id="widget-{{widget.clean_name}}" ng-style="widget.style" ng-class="{ready: ready}">
				<ng-include src="'widgetInfoCard'"></ng-include>
			</div>
		</div>

		<div id="hidden-count" ng-if="isFiltered && widgets.length > 0">
			{{totalWidgets - widgets.length }} hidden by filters. <button class="cancel_button" ng-click="clearFiltersAndSearch()">Show All</button>
		</div>
	</section>
</div>

<script type="text/ng-template" id="widgetInfoCard">
<a class="infocard" ng-href="/widgets/{{widget.id}}-{{widget.clean_name}}" target="_self">
	<div class="header">
		<div class="featured-label" ng-if="widget.in_catalog == '1'">
			<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><path d="M9 11.3l3.71 2.7-1.42-4.36L15 7h-4.55L9 2.5 7.55 7H3l3.71 2.64L5.29 14z"/><path fill="none" d="M0 0h18v18H0z"/></svg>
			Featured
		</div>
		<h1 class="infoHeader" ng-class="{featured: widget.in_catalog == '1'}">{{widget.name}}</h1>
	</div>

	<div class="img-holder">
		<img ng-src='{{widget.icon}}'>
	</div>

	<div class="widget-info">
		<div class="blurb">
			{{widget.meta_data['excerpt']}}
		</div>
		<ul class="inline_def features_list">
			<li ng-class="['supported-feature', {selected: filters[supported].isActive}]" ng-repeat="supported in widget.meta_data.supported_data">{{supported}}</li>
			<li ng-class="['supported-feature', {selected: filters[filter].isActive}]" ng-repeat="filter in widget.meta_data.features">{{filter}}</li>
		</ul>
	</div>
</a>
</script>
