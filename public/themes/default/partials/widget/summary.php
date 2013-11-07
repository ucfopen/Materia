<div class="widget_info">
	<div class="widget_icon">
		<img src="<?= $icon ?>" alt="">
	</div>
	<ul class="widget_info">
		<?= isset($name)  ? "<li class=\"widget_name\">$name</li>" : '' ?>
		<?= isset($avail) ? "<li class=\"widget_availability\">$avail</li>" : '' ?>
	</ul>
</div>