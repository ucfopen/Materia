app = angular.module('materia')
app.service 'scoreSrv', ->
	getWidgetInstanceScores: (inst_id, callback) ->
		Materia.Coms.Json.send 'widget_instance_scores_get', [inst_id], callback

	getWidgetInstancePlayScores: (params, callback) ->
		Materia.Coms.Json.send 'widget_instance_play_scores_get', params, callback

	getGuestWidgetInstanceScores: (inst_id, play_id, callback) ->
		Materia.Coms.Json.send 'guest_widget_instance_scores_get', [inst_id, play_id], callback

