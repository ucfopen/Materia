<div class="container" ng-controller="helpCtrl">
	<section class="page">
		<h1>Help &amp; Support</h1>
		<section class="bordered">
			<h2 id="getting-started-link">Getting Started</h2>
			<p>Check out the <a href="http://online.ucf.edu/support/materia/materia-quick-start-guide/" class="external">Materia Quickstart Guide</a>.</p>
		</section>

		<section class="bordered">
			<h2 id="flash-required">Requirements</h2>
			<p class="flash-version">Materia requires that you have the latest Flash Player plug-in installed.</p>
			<div ng-if='hasFlash'>
				<p class="flash_installed">Sweet! We've detected you have Flash installed. You should be good to go.</p>
			</div>
			<div ng-if='!hasFlash' class="no_flash" >
				<p><strong>Oh no!</strong> Looks like you don't have the latest version of Flash installed.</p>
				<a class="get_flash" href="http://www.adobe.com/go/getflashplayer">Get the latest Adobe Flash &reg; Player</a>
			</div>
		</section>

		<section class="float left">
			<h2 id="login-issues">Login Issues</h2>
			<p>In many cases, problems logging in are a result of one of the following:</p>
			<h3>Expired Password</h3>
			<p>NID passwords expire every 30 days for security purposes. You may need to <a href="http://mynid.ucf.edu" class="external">reset your NID password</a> if it has expired.</p>
			<h3>Students missing Knights E-Mail address</h3>
			<p>Students must have a Knights Email address to log into Materia. If you do not currently have a Knights Email account, set one up as soon as possible. You should be able to access Materia after 24 hours of creating an account.</p>
			<p>Faculty members are not required to have a Knights Email account. However, faculty members are required to have an email address associated with MyUCF.</p>
			<h3>Faculty not currently employed</h3>
			<p>Faculty must be categorized as currently employed to gain access.</p>
		</section>

		<section class="float right bordered">
			<h2 id="faq-link">FAQs</h2>
			<p>The Webcourses@UCF Support website provides a fequently asked questions section for help with Materia.</p>
			<p><a href="http://online.ucf.edu/support/materia/" class="external">View the FAQs</a></p>
		</section>

		<section class="float right">
			<h2 id="support">Support</h2>
			<p>If you need help beyond what has been provided here, please contact Webcourses@UCF Support using one of the following:</p>
			<dl>
				<dt>Webcourses@UCF Support</dt>
					<dd><a href="http://online.ucf.edu/support/">http://online.ucf.edu/support/</a></dd>
				<dt>Email</dt>
					<dd><a href="mailto:webcourses@ucf.edu">webcourses@ucf.edu</a></dd>
				<dt>Phone</dt>
					<dd>(407) 823-0407</dd>
			</dl>
		</section>
	</section>
</div>
