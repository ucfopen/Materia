<section class="page">
	<div id="top">
		<h1><?= $name ?></h1>
		<div id="guide-tabs" class="<?= $type ?>-guide">
			<? if ($has_player_guide): ?>
			<a href="./players-guide">Player Guide</a>
			<? endif; ?>
			<? if ($has_creator_guide): ?>
			<a href="./creators-guide">Creator Guide</a>
			<? endif; ?>
		</div>
	</div>
	<div id="guide-container">
		<iframe src="<?= $doc_path ?>" class="guide"></iframe>
	</div>
</section>
