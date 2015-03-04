<main id="widget-details" role="main" ng-show="show" ng-controller="widgetDetailsController">
	<div class="content-container">
		<aside class="content aside-content hidden-md hidden-sm hidden-xs">
			<a href="{{ goback.url }}" class="action-button orange block">
				<span class="fa fa-arrow-left"></span> {{ goback.text }}
			</a>

			<img ng-src="{{ widget.icon }}" alt="{{ widget.name }} icon" class="icon">
		</aside>

		<section class="content left">
			<div class="top">
				<h1 class="left">{{ widget.name }} {{ widget.subheader }}</h1>

				<a href="{{ goback.url }}" class="action-button orange small right visible-md-block visible-sm-block visible-xs-block">
					<span class="fa fa-arrow-left"></span> {{ goback.textMobile }}
				</a>
			</div>
			<p>{{ widget.about }}</p>

			<ul class="pics">
				<li ng-repeat="screenshot in widget.screenshots">
					<a class="grouped_elements img-bg" rel="group1" href="{{ screenshot.a }}" fancybox><img ng-src="{{ screenshot.img }}" alt=""></a>
				</span>
				</li>
			</ul>
			<p class="thumbnail_explination">Click on a thumbnail to view a screenshot</p>

			<div class="action text-center">
				<h4>Want to see it in action?</h4>
				<p>
				<a id="demoLink" class="action-button green" href='{{ widget.demourl }}' target="_blank">
					<span class="arrow arrow_right"></span>
					Play a demo now!
				</a>
				</p>
			</div>

			<hr>

			<dl id="metaData">
				<dt ng-show='widget.features.length'>Features:</dt>
				<dd>
					<span ng-repeat='feature in widget.features'>
					<a class="feature" ng-mouseover="feature.show = true" ng-mouseout="feature.show = false">{{ feature.text }}</a>
					<div class="tooltip" style="display: {{ feature.show ? 'inline-block' : 'none' }}">{{ feature.description }}</div>
					</span>
				</dd>
				<dt ng-show='widget.supported_data.length'>Supported Data:</dt>
				<dd>
					<span ng-repeat='data in widget.supported_data'>
					<a class="supported_data" ng-mouseover="data.show=true" ng-mouseout="data.show = false">{{ data.text }}</a>
					<div class="tooltip" style="display: {{ data.show ? 'inline-block' : 'none' }}">{{ data.description }}</div>
					</span>
				</dd>
			</dl>

			<hr>

			<div class="action text-center">
				<h4>Want to use it in your course?</h4>
				<p><a id ="createLink" href='{{ widget.creatorurl }}' class="action-button blue">Create your widget</a></p>
			</div>
		</section>
	</div>
</main>
