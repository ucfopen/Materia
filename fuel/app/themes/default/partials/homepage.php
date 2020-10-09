<section class="page spotlight" ng-controller="HomePageSpotlightCtrl">
	<section class="main_container">
		<span class="spotlight-wrapper">
			<?= $spotlight ?>
		</span>
	</section>
	<div class="cycler">
	</div>
</section>

<section class="get_started">
	<p class="desc">
	Easily embed <span class="bold">engaging</span> apps in your online course.
	</p>
	<p class="button_wrap">
	<a class="action_button" href="widgets">Get Started</a>
	</p>
</section>

<section class="front_bottom">
	<section class="wrapper">
		<div>
			<h2>Engage Your Students</h2>
			<p>
				Re-imagine your course filled with diverse and interesting experiences. It can bring life to content modules, practice, study activities, and even assessments. Engage students with game mechanics like: story-telling, competition, instant feedback, and instant reward systems.
			</p>
		</div>
		<img src="<?= \Config::get('materia.urls.static') ?>img/front1.png" alt="screen shot of a labeling widget"/>
		<div>
			<h2>Create Quickly and Easily</h2>
			<p>
				Materia's design philosophy is to be incredibly easy to use.  Every step of customizing and delivering apps has been finely tuned to be as clear and simple as possible. Players are greeted with clean and simple interfaces. We aim to get out of the way so your content can engage with students as quickly and clearly as possible.
			<p>
		</div>
		<img src="<?= \Config::get('materia.urls.static') ?>img/front2.png" alt="screen shot of creating a crossword widget"/>
		<div>
			<h2>Integrate with Your Course</h2>
			<p>
				Materia integrates into Canvas seamlessly.  As an assignment, student's scores can automatically sync to the grade book. Thanks to the magic of LTI, Students are logged in automatically!
			</p>
		</div>
		<img src="<?= \Config::get('materia.urls.static') ?>img/front3.png" alt="screen shot of a widget score page"/>
	</section>

	<section class="get_started" style="background: #f2824c;">
		<p class="desc">
			Use Materia at <span class="bold">your</span> organization.
		</p>
		<p class="button_wrap">
			<a class="action_button" href="https://ucfopen.github.io/Materia-Docs/">
				Get Materia
				<span class="little-button-text" style="font-size: 18px; display:block;">(It's open source!)</span>
			</a>
		</p>
	</section>

	<section class="p_s" style="">
		<h2>Built at UCF, for Everyone</h2>
		<p>
			Materia is an open source project built by the University of Central Florida's <a href="https://cdl.ucf.edu/" target="_blank">Center for Distributed Learning</a>. Our team is a truly unique group of experts working directly with faculty <b>and</b> students to build enjoyable tools for teaching and learning.
		</p>
		<p>
			We're committed to building a better tomorrow through better learning tools, so our team is constantly improving and re-inventing Materia. If you have an idea for a new widget or simply would like to give us feedback, we'd love to hear from you on <a href="https://github.com/ucfopen" target="_blank">Github</a>.
		</p>
		<p class="copyright">
			&copy; <?= date("Y") ?> University of Central Florida
		</p>
	</section>
</section>
