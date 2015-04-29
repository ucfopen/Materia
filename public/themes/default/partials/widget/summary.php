<div class="widget-info">
	<div class="widget-icon">
		<img src="<?= $icon ?>" alt="">
	</div>
	<ul class="widget-info">
		<?= isset($name)  ? "<li class=\"widget-name\">$name</li>" : '' ?>
		<?= isset($avail) ? "<li class=\"widget-availability\">$avail</li>" : '' ?>
	</ul>
</div>
