$(document).ready ->
	Materia.Widget.Catalog.prepare ($widgets) ->
		# default sorting (skipping animations):
		Materia.Sorter.Filter.sort $widgets, false, 'title'

		filterType   = $('.features input[type="checkbox"]')
		programSort  = $('.program-department')
		filterButton = $('a.feature')

		filterType.click ->
			Materia.Sorter.Filter.filter(programSort)
		
		$('.feature').click ->
			featureName = $(this).text()
			featureChoice = $('.features').find('[value='+featureName+']')
			featureChoice.click()
			Materia.Sorter.Filter.filter(programSort)
			return false

