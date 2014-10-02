<section class="page" ng-show="show" ng-app="widgetDetails" ng-controller="widgetDetailsController">
	<a href="/widgets" class="action_button widget_catalog_button">
		<span class="arrow"></span>
		<span class="goBackText">Go back to the widget catalog</span>
	</a>

	<article class="widget_detail">
		<img src="{{ widget.icon }}" alt="" class="widget_icon">
		<hgroup class="detail">
			<h1>{{ widget.name }}</h1>
			<h2>{{ widget.subheader }}</h2>
		</hgroup>
		{{ widget.about }}

		<ul class="pics">
			<li ng-repeat="screenshot in widget.screenshots">
				<a class="grouped_elements" rel="group1" href="{{ screenshot.a }}"><img src="{{ screenshot.img }}" alt=""></a>
			</li>
		</ul>
		<p class="thumbnail_explination">Click on a thumbnail to view a screenshot</p>
		<dl id="metaData" class="left inline_def">
			<dt ng-show='widget.features.length'>Features:</dt>
			<dd ng-repeat='feature in widget.features'><a class="feature" ng-mouseover="showtooltip(feature, $index, '.feature')" ng-mouseout="hidetooltip()">{{ feature }}</a></dd>
			<dt ng-show='widget.supported_data.length'>Supported Data:</dt>
			<dd ng-repeat='data in widget.supported_data'><a class="supported_data" ng-mouseover="showtooltip(data, $index, '.supported_data')" ng-mouseout="hidetooltip()">{{ data }}</a></dd>
		</dl>
		<section class="right widget_right_selection">
			<h4>Want to see it in action?</h4>
			<p>
				<a id="demoLink" class="action_button green circle_button" href='{{ widget.demourl }}' target="_blank">
					<span class="arrow arrow_right"></span>
					Play a demo now!
				</a>
			</p>

			<h4>Want to use it in your course?</h4>
			<p><a id ="createLink" href='{{ widget.creatorurl }}' class="action_button green">Create your widget</a></p>
		</section>
	</article>
</section>
