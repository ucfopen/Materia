$(document).ready(function()
{
	Materia.Widget.Catalog.prepare(function($widgets) {
		// default sorting (skipping animations):
		Materia.Sorter.Filter.sort($widgets, false, 'title');
	});

	var filterType   = $('.features input[type="checkbox"]');
	var programSort  = $('.program-department');
	var filterButton = $('a.feature');

	filterType.click(function() {
		Materia.Sorter.Filter.filter(programSort);
	});
	
	$('.feature').click(function() {
		var featureName = $(this).text();
		featureChoice = $('.features').find('[value='+featureName+']');
		featureChoice.click();
		Materia.Sorter.Filter.filter(programSort);
		return false;
	});
});