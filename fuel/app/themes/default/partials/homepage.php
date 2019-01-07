<section class="page spotlight" ng-controller="spotlightCtrl">
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
	Easily create <span class="bold">games &amp; study tools</span> for your <span class="bold">online course</span> with <span class="bold">Materia.</span>
	</p>
	<p class="button_wrap">
	<a class="action_button" href="widgets">Get Started</a>
	</p>
</section>

<section class="front_bottom">
	<section class="wrapper">
		<div>
			<h2>Engage and Inspire Your Students</h2>
			<p>
				With a growing library of games, applications, study tools, &amp; learning aids, Materia is designed to help you diversify your students' online learning experience.
			</p>
			<p>
				Use game play mechanics to revitalize stale and boring questions, allow students to indulge in your content by delivering it in a fun and innovative way, and build interest by adding integrating concepts such as story-telling, competition, instant feedback, and instant reward systems.
			</p>
		</div>
		<img src="<?= \Config::get('materia.urls.static') ?>img/front1.png"/>
		<div>
			<h2>Easy to Use</h2>
			<p>
				Every step of creating and delivering content in Materia has been finely tuned to be as clear and useful as possible.
				Get started with a walking tour to familiarize yourself with each screen and to enhance your understanding of how each widget works.
				Tooltips are also included to help you navigate and tab enabled forms facilitate power users to enter data quickly.
			<p>
		</div>
		<img src="<?= \Config::get('materia.urls.static') ?>img/front2.png"/>
		<div>
			<h2>Superior Statistics</h2>
			<p>
				Materia keeps tabs on how each of your widgets is being utilized.
				Quickly view your students' performance by comparing scores and statistics visually in dynamically rendered charts.
				In keeping with Materia's core value that the learner is a first rate citizen, we make sure learners are able see their own progress and measure how they stack up against their peers.
			</p>
		</div>
		<img src="<?= \Config::get('materia.urls.static') ?>img/front3.png"/>
	</section>

	<section class="p_s">
		<h2>Built at UCF, for Everyone</h2>
		<p>
			Materia is an open source project built by the University of Central Florida's <a href="https://cdl.ucf.edu/" target="_blank">Center for Distributed Learning</a>. Our team melds interface usability, graphic design, instructional pedagogy, expert developers, and award winning distance learning expertise to deliver an innovative and usable platform for interactive learning content.
		</p>
		<p>
			We're committed to building a better tomorrow through better learning tools, so our team is constantly improving and re-inventing Materia. In fact, if you have an idea for a new widget or simply would like to give us feedback, we'd love to hear from you on <a href="https://github.com/ucfopen" target="_blank">Github</a>.
		</p>
		<p class="copyright">
			&copy; <?= date("Y") ?> University of Central Florida
		</p>
	</section>
</section>
