<section class="widget">
	<div class="center">
		<div id="container">
			<?= Theme::instance()->view('partials/noflash') ?>
		</div>
	</div>
</section>

<script type="text/javascript">
	Materia.Player.init(API_LINK, "<?= $inst_id ?>", "container", BASE_URL);
</script>