<div ng-controller="widgetCtrl" class="container">
	<section class="page">
		<div class="top">
			<h1>Widget Catalog</h1>
		</div>
		<div class="widgets" >
			<section ng-repeat="widget in widgets" class="widget {{widget.clean_name}}" >

				<div class="widgetMin {{widget.clean_name}}" ng-class="(widget.visible) ? '' : 'hidden'" data-id="{{widget.id}}">
					<a ng-href="/widgets/{{widget.id}}-{{widget.clean_name}}"><img ng-src='{{widget.icon}}'></a>
					<div class="header">
						<h1><a ng-href="/widgets/{{widget.id}}-{{widget.clean_name}}" class="searchable">{{widget.name}}</a></h1>
					</div>
					<dl class="left inline_def blurb">
						<dt data-type="description">Description:</dt>
						<dd>{{widget.meta_data['excerpt']}}</dd>
					</dl>
					<dl class="left inline_def features_list">
						<dt data-type="features">Features:</dt>
						<dd ng-repeat="feature in widget.meta_data['features']" class="searchable">{{feature}}</dd>
						<dt ng-show="widget.meta_data['supported_data']" data-type="supported">Supported Data:</dt>
						<dd ng-repeat="supported in widget.meta_data['supported_data']" class="searchable">{{supported}}</dd>
				</div>

				<a class="infocard" ng-href="/widgets/{{widget.id}}-{{widget.clean_name}}">
					<img ng-src='{{widget.icon}}'>
					<div class="header">
						<h1 class="infoHeader">{{widget.name}}</h1>
					</div>
					<dl class="left inline_def blurb">
						<dt data-type="description">Description:</dt>
						<dd>{{widget.meta_data['excerpt']}}</dd>
					</dl>
					<dl class="left inline_def features_list">
						<dt data-type="features">Features:</dt>
						<dd ng-repeat="feature in widget.meta_data['features']" class="searchable">{{feature}}</dd>
						<dt ng-show="widget.meta_data['supported_data']" data-type="supported">Supported Data:</dt>
						<dd ng-repeat="supported in widget.meta_data['supported_data']" class="searchable">{{supported}}</dd>
					</dl>
				</a>
			</section>
		</div>
	</section>

	<aside>
		<h1>Features:</h1>
		<dl class="features">
			<dt><input ng-model="filters.scorable" type="checkbox" id="filter-scorable" /><label for="filter-scorable">Collects scores</label></dt>
			<dd>These widgets are well suited to gauge performance.</dd>
			<dt><input ng-model="filters.mobile" type="checkbox" id="filter-mobile" /><label for="filter-mobile">Optimized for mobile use</label></dt>
			<dd>These widgets are well suited to gauge performance.</dd>
			<dt><input ng-click="hideFiltered()" ng-model="filters.customizable" value="Customizable" type="checkbox" id="filter-custom" /><label for="filter-custom">Customizable Content</label></dt>
			<dd><p>This means you supply the widget with data to make it relevant to your course.</p>
				<h2>Supported data:</h2>
				<ul class="supported-data">
					<li><input ng-model="filters.qa" value="Question/Answer" type="checkbox" id="filer-qa" /><label for="filer-qa">Question/Answer</label></li>
					<li><input ng-model="filters.mc" value="Multiple Choice" type="checkbox" id="filter-mc" /><label for="filter-mc">Multiple Choice</label></li>
					<li><input ng-model="filters.media" value="Media" type="checkbox" id="filter-media" /><label for="filter-media">Media</label></li>
				</ul>
			</dd>
		</dl>
	</aside>
</div>

