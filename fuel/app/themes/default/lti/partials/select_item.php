<div ng-controller="LTIResourceSelectionCtrl">
	<header>
		<h1>{{strHeader}}</h1>
		<div id="logo"></div>
	</header>
	<section id="select-widget" ng-show="section == 'selectWidget'">
		<input type="text" id="search" ng-model="query.searchCache">
		<a id="refresh" href="javascript:;" ng-click="refreshListing()">Refresh listing</a>
		<div id="list-container">
			<ul>
				<li ng-repeat="widget in widgets | filter:query" ng-class="{ draft: widget.draft, selected: widget.selected, guest: widget.guest_access }" ng-click="highlight(widget)">
					<div class="widget-info">
						<img class="widget-icon" ng-src="{{ widget.img }}">
						<h2 class="searchable">{{ widget.name }}</h2>
						<h3 class="searchable">{{ widget.widget.name }}</h3>
						<h3 class="guest-notice" ng-show="widget.guest_access">Guest widgets cannot be embedded in courses.</h3>
						<span ng-show="widget.is_draft" class="draft-label">Draft</span>
						<span ng-show="widget.guest_access && !widget.is_draft" class="draft-label">Guest</span>
					</div>
					<a class="preview external" target="_blank" href="{{ widget.preview_url }}">Preview</a>
					<a ng-show="widget.is_draft || widget.guest_access" class="button embed-button" target="_blank" href="{{ widget.edit_url }}">Edit at Materia <div></div></a>
					<a ng-hide="widget.is_draft || widget.guest_access" role="button" class="button embed-button" ng-class="{ first: $index==0 }" ng-click="embedWidget(widget)">Use this widget</a>
				</li>
			</ul>
			<div ng-show="widgets.length < 1" id="no-widgets-container">
				<div id="no-widgets">
					You don't have any widgets yet. Click this button to create a widget, then return to this tab/window and select your new widget.
					<a role="button" id="create-widget-button" ng-click="calloutRefreshLink()" class="button" target="_blank" href="<?= Uri::create('/widgets') ?>">Create a widget at Materia</a>
				</div>
			</div>
		</div>
		<a id="goto-new-widgets" ng-show="widgets.length > 0" ng-click="calloutRefreshLink()" class="external" target="_blank" href="<?= Uri::create('/widgets') ?>">Or, create a new widget at Materia</a>
		<a role="button" class="button cancel-button" href="javascript:;">Cancel changing widget</a>
	</section>
	<section id="progress" ng-show="section == 'progress'">
		<div class="widget-info">
			<h1>{{ selectedWidget.name }}</h1>
			<img class="widget-icon" ng-src="{{ selectedWidget.img }}" />
		</div>
		<div class="progress-container">
			<span>{{ !easterMode ? "Connecting your widget..." : "Reticulating splines..." }}</span>
			<div class="progressbar">
				<div class="fill"></div>
			</div>
		</div>
	</section>
	<div ng-show="showRefreshArrow" class="qtip right lti">Click to see your new widget</div>
</div>
