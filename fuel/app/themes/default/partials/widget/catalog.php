<div ng-controller="widgetCatalogCtrl" class="container" id="widget-catalog-container">
	<section class="page">
		<div class="top">
			<h1>Widget Catalog</h1>
			<div class="search">
				<div class="textbox-background"></div>
				<input class="textbox" ng-model="query" type="text">
				<div class="search-icon"></div>
				<div class="search-close" ng-click="query = ''" ng-show="query">x</div>
			</div>
		</div>
		<div id="active-filters" class="mobile-only">
			<button id="add-filter" ng-class="{open: mobileFiltersOpen}" ng-click="mobileFiltersOpen = !mobileFiltersOpen">{{activeFilters.length ? "Filters" : "Add Filters"}}</button>
			<div>
				<span ng-repeat="feature in activeFilters">{{feature}}{{$last ? "" : ", "}}</span>
			</div>
		</div>
		<div id="filter-dropdown" ng-show="mobileFiltersOpen" ng-click="mobileFiltersOpen = !mobileFiltersOpen" class="mobile-only">
			<label ng-repeat="(id, feature) in filters">
				<input type="checkbox" class="feature-button" ng-checked="feature.active" ng-click="toggleFeature(id)">
				{{feature.text}}
			</label>
		</div>

		<div id="filters-container">
			<legend>Filters</legend>
			<div class="filter-labels-container">
				<button class="feature-button" ng-repeat="(id, feature) in filters" ng-class="{selected: feature.active}" ng-click="toggleFeature(id)">
					{{feature.text}}
				</button>
			</div>
		</div>

		<div id="featured-first">
			<button ng-click="toggleDisplayAll()">
				Show Featured Widgets First
				<div ng-class="{on: !displayAll}"></div>
			</button>
		</div>

		<div id="no-widgets-message" ng-if="count < 1">
			<span ng-if="count == 0">No widgets match the filters you set.</span>
			<span ng-if="count == -1">Loading...</span>
		</div>

		<div id="widgets-container">
			<div ng-repeat="widget in widgets" class="widget" id="widget-{{widget.clean_name}}" ng-style="widget.style" ng-show="widget.visible" ng-class="{ready: ready}">
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
							<dd class="supported-feature" ng-repeat="feature in widget.meta_data['features']">{{feature}}</dd>
							<dd class="supported-feature" ng-repeat="supported in widget.meta_data['supported_data']">{{supported}}</dd>
						</dl>
					</div>
				</a>
			</div>
		</div>

		<div id="hidden-count" ng-if="count > 0 && widgets.length - count > 0">
			+{{widgets.length - count}} widgets hidden by filters
		</div>
	</section>
</div>
