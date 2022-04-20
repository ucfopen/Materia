<section class="page">
	<div id="top">
		<h1><?= $name ?></h1>
		<div id="guide-tabs" class="<?= $type ?>-guide">
			<?php if ($has_player_guide): ?>
			<a href="./players-guide">Player Guide</a>
			<?php endif; ?>
			<?php if ($has_creator_guide): ?>
			<a href="./creators-guide">Creator Guide</a>
			<?php endif; ?>
		</div>
	</div>
	<div id="guide-container">
		<iframe src="<?= $doc_path ?>" class="guide"></iframe>
	</div>
</section>
