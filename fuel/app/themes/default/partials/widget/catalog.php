<div ng-controller="widgetCatalogCtrl" class="container">
	<section class="page">
		<div class="top">
			<h1>Widget Catalog</h1>
		</div>
		<div class="widgets" >
			<section ng-repeat="widget in widgets" class="widget {{widget.clean_name}}" >

				<div class="widgetMin {{widget.clean_name}}" ng-class="(widget.visible) ? '' : 'hidden'" data-id="{{widget.id}}">
					<a ng-href="/widgets/{{widget.id}}-{{widget.clean_name}}"><img ng-src='{{widget.icon}}'></a>
					<div class="header">
						<h1><a ng-href="/widgets/{{widget.id}}-{{widget.clean_name}}" >{{widget.name}}</a></h1>
					</div>
					<dl class="left inline_def blurb">
						<dt data-type="description">Description:</dt>
						<dd>{{widget.meta_data['excerpt']}}</dd>
					</dl>
					<dl class="left inline_def features_list">
						<dt data-type="features">Features:</dt>
						<dd ng-repeat="feature in widget.meta_data['features']">{{feature}}</dd>
						<dt ng-show="widget.meta_data['supported_data']" data-type="supported">Supported Data:</dt>
						<dd ng-repeat="supported in widget.meta_data['supported_data']">{{supported}}</dd>
					</dl>
				</div>

				<a class="infocard" ng-href="/widgets/{{widget.id}}-{{widget.clean_name}}">
					<div class="img-holder">
						<img ng-src='{{widget.icon}}'>
					</div>

					<div class="header widget-banner">
						<h1 class="infoHeader">{{widget.name}}</h1>
					</div>
					<div class="blurb-holder">
						<dl class="left inline_def blurb">
							<dt data-type="description">Description:</dt>
							<dd>{{widget.meta_data['excerpt']}}</dd>
						</dl>
						<dl class="left inline_def features_list">
							<dt data-type="features">Features:</dt>
							<dd ng-repeat="feature in widget.meta_data['features']">{{feature}}</dd>
							<dt ng-show="widget.meta_data['supported_data']" data-type="supported">Supported Data:</dt>
							<dd ng-repeat="supported in widget.meta_data['supported_data']">{{supported}}</dd>
						</dl>
					</div>
				</a>
			</section>
		</div>
	</section>

	<aside>
		<h1>Filter by Features:</h1>
		<dl class="features">
			<dt><input ng-model="filters.scorable" type="checkbox" id="filter-scorable" /><label for="filter-scorable">Collects Scores</label></dt>
			<dd>These widgets are well suited for gauging student performance.</dd>
			<dt><input ng-model="filters.mobile" type="checkbox" id="filter-mobile" /><label for="filter-mobile">Optimized for Mobile</label></dt>
			<dd>Widgets designed for viewing on mobile devices.</dd>
			<dt><input ng-model="filters.media" value="Media" type="checkbox" id="filter-media" /><label for="filter-media">Uploadable Media</label></dt>
			<dd>Show widgets that use custom uploaded images.</dd>
			<!-- <dt><input ng-click="hideFiltered()" ng-model="filters.customizable" value="Customizable" type="checkbox" id="filter-custom" /><label for="filter-custom">Customizable Content</label></dt>
			<dd><p>This means you supply the widget with data to make it relevant to your course.</p> -->
				<h2>Support Question Types:</h2>
				<ul class="supported-data">
					<li><input ng-model="filters.qa" value="Question/Answer" type="checkbox" id="filter-qa" /><label for="filter-qa">Question/Answer</label></li>
					<li><input ng-model="filters.mc" value="Multiple Choice" type="checkbox" id="filter-mc" /><label for="filter-mc">Multiple Choice</label></li>
				</ul>
			<!-- </dd> -->
			<h2>Additional Options:</h2>
			<dt><input type="checkbox" ng-model="displayAll" id="display-all-widgets" /><label for="display-all-widgets">Display All Widgets</label></dt>
			<dd>Displays the entire catalog, including specialized and non-customizable widgets.</dd>
		</dl>
	</aside>
</div>

