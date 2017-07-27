app = angular.module 'materia'
# Ensures the user can only input numeric characters, '/', and ':' for the
# date and time inputs.
app.directive 'dateValidation', () ->
	require: 'ngModel',
	scope:
		validate: "&"
	link: (scope, element, attrs, modelCtrl) ->
		modelCtrl.$parsers.push((inputValue) ->
			# Dates can do 0-9 and '/'
			if attrs.validate is 'date'
				transformed = inputValue.replace(/[^\d\/]/g,'')
			# Times can do 0-9 and ':'
			else
				transformed = inputValue.replace(/[^\d:]/g,'')

			if transformed != inputValue
				modelCtrl.$setViewValue(transformed)
				modelCtrl.$render()
			return transformed
		)

