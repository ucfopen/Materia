app = angular.module('materia')
app.service 'scoreSrv', ->
	getWidgetInstanceScores: (inst_id, play_id, callback) ->
		Materia.Coms.Json.send 'widget_instance_scores_get', [inst_id, play_id], callback

	getWidgetInstancePlayScores: (params, callback) ->
		Materia.Coms.Json.send 'widget_instance_play_scores_get', params, callback

