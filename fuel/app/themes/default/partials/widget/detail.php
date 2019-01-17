<section class="page" ng-show="show" ng-controller="widgetDetailsController">
	<div class="top">
		<img ng-src="{{ widget.icon }}" alt="" class="widget_icon">
		<h1>{{ widget.name }}</h1>
	</div>

	<article class="widget_detail">
		<div>{{ widget.about }}</div>

		<div id="demo-container" ng-style="{height: widget.height+'px', width: widget.width+'px'}" ng-if="demoFits">
			<div ng-if="showDemoCover" id="demo-cover">
				<div>
					<a class="action_button green circle_button" ng-click="showDemoClicked()">
						<span class="arrow arrow_right"></span>
						Play a demo now!
					</a>
				</div>
			</div>
			<div>
				<section class="widget" ng-controller="playerCtrl" ng-init="inst_id = '<?= $inst_id ?>'" ng-class="{ preview: isPreview }">
					<header ng-if="isPreview" class="preview-bar"></header>
					<div class="center" ng-show="type == 'flash' || type == 'html'">
						<iframe ng-attr-src="{{ htmlPath }}" ng-if="type == 'html'" id="container" class="html" scrolling="yes" fullscreen-dir></iframe>
						<div id="container" ng-if="type =='flash'"></div>
					</div>
					<div id="container" ng-if="type =='noflash'">
						<?= Theme::instance()->view('partials/noflash') ?>
					</div>
				</section>
			</div>
		</div>

		<ul class="pics">
			<li ng-repeat="screenshot in widget.screenshots">
				<a class="grouped_elements" data-fancybox="group1" href="{{ screenshot.a }}" fancybox>
					<img ng-src="{{ screenshot.img }}" alt="">
				</a>
			</li>
		</ul>
		<div class="thumbnail_explanation">
			<img src="../../../img/mag_glass.png">
			<p>Click on a screenshot to enlarge</p>
		</div>

		<section class="bottom">
			<dl id="metaData" class="inline_def">
				<dt ng-show='widget.features.length'>Features:</dt>
				<div>
					<dd ng-repeat='feature in widget.features'>
						<a class="feature" ng-mouseover="feature.show = true" ng-mouseout="feature.show = false">{{ feature.text }}</a>
						<div class="tooltip" style="display: {{ feature.show ? 'inline-block' : 'none' }}">{{ feature.description }}</div>
					</dd>
				</div>
				<dt ng-show='widget.supported_data.length'>Supported Data:</dt>
				<div>
					<dd ng-repeat='data in widget.supported_data'>
						<a class="supported_data" ng-mouseover="data.show=true" ng-mouseout="data.show = false">{{ data.text }}</a>
						<div class="tooltip" style="display: {{ data.show ? 'inline-block' : 'none' }}">{{ data.description }}</div>
					</dd>
				</div>
				<dt>Guides:</dt>
				<div>
					<dd><a class="guide" href="#">Player</a></dd>
					<dd><a class="guide" href="#">Creator</a></dd>
				</div>
				<span id="last-updated">Widget Last Updated {{ widget.created }}</span>
			</dl>

			<div class="widget-action-buttons">
				<h4>Want to see it in action?</h4>
				<p>
					<a id="demoLink" class="action_button green circle_button" href='{{ widget.demourl }}' target="_blank">
						<span class="arrow arrow_right"></span>
						Play a demo now!
					</a>
				</p>

				<h4>Want to use it in your course?</h4>
				<p><a id ="createLink" href='{{ widget.creatorurl }}' class="action_button green">Create your widget</a></p>
			</div>
		</section>
	</article>
</section>
