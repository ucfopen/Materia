app = angular.module('materia')
app.service 'adminSrv', ->

	getWidgets = (callback) ->
		Materia.Coms.Admin.setGateway '/api/admin/'
		Materia.Coms.Admin.send 'widgets_get', [], callback

	saveWidget = (obj, callback) ->
		Materia.Coms.Admin.setGateway '/api/admin/'
		Materia.Coms.Admin.send 'widget_update', [obj], callback

	getWidgets: getWidgets
	saveWidget: saveWidget