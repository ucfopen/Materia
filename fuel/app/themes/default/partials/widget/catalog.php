<div ng-controller="widgetCatalogCtrl" class="container" id="widget-catalog-container">
	<section class="page">

		<div class="top">
			<h1>Widget Catalog</h1>
			<button class="filter-toggle cancel_button desktop-only" ng-click="isShowingFilters ? clearFilters() : showFilters()">{{isShowingFilters ? 'Clear Filters' : 'Filter by feature...'}}</button>
			<div class="search">
				<div class="textbox-background"></div>
				<input class="textbox" ng-model="search" type="text">
				<div class="search-icon"></div>
				<div class="search-close" ng-click="search = ''" ng-show="search">x</div>
			</div>
		</div>

		<div id="active-filters" class="mobile-only">
			<button id="add-filter" ng-class="{open: mobileFiltersOpen}" ng-click="mobileFiltersOpen = !mobileFiltersOpen">{{activeFilters.length ? "Filters" : "Filter by Feature"}}</button>
			<div>
				<span ng-repeat="filter in activeFilters">{{filter}}{{$last ? "" : ", "}}</span>
			</div>
		</div>

		<div style="position:absolute; left: 10px; top: 60px">
			<div id="filter-dropdown" ng-show="mobileFiltersOpen" ng-click="mobileFiltersOpen = !mobileFiltersOpen" class="mobile-only">
				<label ng-repeat="(id, filter) in filters">
					<input type="checkbox" class="filter-button" ng-checked="filter.isActive" ng-click="toggleFilter(id)">
					{{filter.text}}
				</label>
			</div>
		</div>

		<div id="filters-container" class="animate-if" ng-if="isShowingFilters" >
			<div class="filter-labels-container">
				<button class="feature-button" ng-repeat="(id, filter) in filters" ng-class="{selected: filter.isActive}" ng-click="toggleFilter(id)">
					{{filter.text}}
				</button>
			</div>
		</div>

		<div id="no-widgets-message" ng-if="widgets.length < 1">
			<span ng-if="count == 0">No widgets match the filters you set. <button class="cancel_button" ng-click="clearFiltersAndSearch()">Show All</button></span>
			<span ng-if="count == -1">Loading Widgets..</span>
		</div>

		<div class="widget-group" ng-if="ready && !isFiltered">
			<h1 class="container-label"><span>Featured Widgets</span></h1>
			<div class="widgets-container featured">
				<div ng-repeat="widget in featuredWidgets" class="widget" id="widget-{{widget.clean_name}}" ng-style="widget.style" ng-class="{ready: ready}">
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

						<div class="blurb-holder">
							<dl class="inline_def blurb">
								<dd>{{widget.meta_data['excerpt']}}</dd>
							</dl>
							<dl class="inline_def features_list">
								<dd ng-class="['supported-feature', {selected: filters[supported].isActive}]" ng-repeat="supported in widget.meta_data.supported_data">{{supported}}</dd>
								<dd ng-class="['supported-feature', {selected: filters[filter].isActive}]" ng-repeat="filter in widget.meta_data.features">{{filter}}</dd>
							</dl>
						</div>
					</a>
				</div>
			</div>
		</div>

		<div class="widgets-container">
			<div ng-repeat="widget in widgets" class="widget" id="widget-{{widget.clean_name}}" ng-style="widget.style" ng-class="{ready: ready}">
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

					<div class="blurb-holder">
						<dl class="inline_def blurb">
							<dd>{{widget.meta_data['excerpt']}}</dd>
						</dl>
						<dl class="inline_def features_list">
							<dd ng-class="['supported-feature', {selected: filters[supported].isActive}]" ng-repeat="supported in widget.meta_data.supported_data">{{supported}}</dd>
							<dd ng-class="['supported-feature', {selected: filters[filter].isActive}]" ng-repeat="filter in widget.meta_data.features">{{filter}}</dd>
						</dl>
					</div>
				</a>
			</div>
		</div>

		<div id="hidden-count" ng-if="isFiltered && widgets.length > 0">
			{{totalWidgets - widgets.length }} hidden by filters. <button class="cancel_button" ng-click="clearFiltersAndSearch()">Show All</button>
		</div>
	</section>
</div>
