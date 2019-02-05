<section class="page" ng-show="show" ng-controller="widgetDetailsController" ng-cloak>
	<article class="widget_detail">
		<div class="top">
			<img ng-src="{{ widget.icon }}" alt="" class="widget_icon">
			<h1>{{ widget.name }}</h1>
			<p>{{ widget.about }}</p>
		</div>
		<p class="widget-about">{{ widget.about }}</p>

		<div id="demo-container" ng-style="{'min-height': widget.height+'px', width: widget.width+'px'}" ng-if="demoFits" ng-class="{loaded: loaded}">
			<div id="demo-cover" ng-class="{hidden: !showDemoCover}" ng-click="showDemoClicked()" ng-style="{'background-image': demoScreenshot}">
				<button>
					<span class="arrow arrow_right"></span>
					Play a demo now!
				</button>
				<div id="demo-cover-background"></div>
			</div>
			<div ng-if="!showDemoCover">
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

		<div ng-show="!demoFits" class="pics">
			<button class="pic-arrow"ng-click="prevImage()">previous</button>
			<button class="pic-arrow" ng-click="nextImage()">next</button>
			<div id="pics-scroller-container">
				<div id="pics-scroller">
					<img ng-repeat="screenshot in widget.screenshots" ng-src="{{screenshot.full}}" ondragstart="return false">
				</div>
			</div>
			<div>
				<button class="pic-dot" ng-repeat="i in [0,1,2]" ng-class="{selected: selectedImage == i}" ng-click="selectImage(i)"></button>
			</div>
		</div>

		<section class="bottom">
			<dl id="metaData" class="inline_def">
				<dt ng-show='widget.features.length'>Features:</dt>
				<div>
					<dd ng-repeat='feature in widget.features'>
						<a class="feature" ng-mouseover="feature.show = true" ng-mouseout="feature.show = false">{{ feature.text }}</a>
						<div class="tooltip" style="display: {{ feature.show ? 'block' : 'none' }}">{{ feature.description }}</div>
					</dd>
				</div>
				<dt ng-show='widget.supported_data.length'>Supported Data:</dt>
				<div>
					<dd ng-repeat='data in widget.supported_data'>
						<a class="supported_data" ng-mouseover="data.show=true" ng-mouseout="data.show = false">{{ data.text }}</a>
						<div class="tooltip" style="display: {{ data.show ? 'block' : 'none' }}">{{ data.description }}</div>
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
				<h4 ng-if="!demoFits">Want to see it in action?</h4>
				<p ng-if="!demoFits">
					<a id="demoLink" class="action_button green circle_button" href='{{ widget.demourl }}'>
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
