<section class="page">
	<div id="top">
		<h1><?= $name ?></h1>
		<div id="guide-tabs" class="<?= $type ?>-guide">
			<a href="./players-guide">Player Guide</a>
			<a href="./creators-guide">Creator Guide</a>
		</div>
	</div>
	<div id="guide-container">
		<iframe src="<?= $doc_path ?>" class="guide"></iframe>
	</div>
</section>
