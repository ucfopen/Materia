<div class="container">
	<section class="page">
		<? if ($msg = Session::get_flash('notice')): /* Incorrect Login Error */ ?>
			<div class="error">
				<p><?= $msg ?></p>
			</div>
		<? endif ?>
		<div class="top">
			<h1>Widget Uploader</h1>
		</div>
		<div class="widgets" data-container="catalog-wiget"></div>
		<form enctype="multipart/form-data" method="POST" action="/upload/widgets">
			<input type="file" name="file"><br>
			<input type="submit" value="Submit">
		</form>
	</section>
</div>
