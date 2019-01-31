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
		<div id="filters-container">
			<div>
				<legend>Filter by Features</legend>
				<div class="filter-labels-container">
					<button class="feature-button" ng-class="{selected: filters.scorable}" ng-click="filters.scorable = !filters.scorable">
						Collects Scores
					</button>
					<button class="feature-button" ng-class="{selected: filters.mobile}" ng-click="filters.mobile = !filters.mobile">
						Mobile Friendly
					</button>
					<button class="feature-button" ng-class="{selected: filters.media}" ng-click="filters.media = !filters.media">
						Uploadable Media
					</button>
				</div>
			</div>
			<div>
				<legend>Filter by Supported Data</legend>
				<div class="filter-labels-container">
					<button class="type-button" ng-class="{selected: filters.qa}" ng-click="filters.qa = !filters.qa">
						Question/Answer
					</button>
					<button class="type-button" ng-class="{selected: filters.mc}" ng-click="filters.mc = !filters.mc">
						Multiple Choice
					</button>
				</div>
			</div>
		</div>

		<div id="no-widgets-message" ng-if="count < 1">
			<span ng-if="count == 0">No widgets match the filters you set.</span>
			<span ng-if="count == -1">Loading...</span>
		</div>

		<div id="widgets-container">

			<div ng-repeat="widget in widgets" class="widget" id="widget-{{widget.clean_name}}" ng-style="widget.style" ng-show="widget.visible">

				<a class="infocard" ng-href="/widgets/{{widget.id}}-{{widget.clean_name}}">
					<div class="header">
						<h1 class="infoHeader">{{widget.name}}</h1>
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
							<dd class="supported-data" ng-repeat="supported in widget.meta_data['supported_data']">{{supported}}</dd>
						</dl>
					</div>
				</a>
			</div>
		</div>
	</section>
</div>
