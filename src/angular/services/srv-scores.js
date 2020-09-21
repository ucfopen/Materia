const app = angular.module('materia')
app.service('ScoreSrv', function () {
	return {
		getWidgetInstanceScores(inst_id, token, callback) {
			Materia.Coms.Json.send('widget_instance_scores_get', [inst_id, token]).then(callback)
		},

		getWidgetInstancePlayScores(play_id, preview_inst_id, callback) {
			Materia.Coms.Json.send('widget_instance_play_scores_get', [play_id, preview_inst_id]).then(
				callback
			)
		},

		getGuestWidgetInstanceScores(inst_id, play_id, callback) {
			Materia.Coms.Json.send('guest_widget_instance_scores_get', [inst_id, play_id]).then(callback)
		},

		getWidgetInstanceQSet(play_id, widget_id, timestamp, callback) {
			Materia.Coms.Json.send('question_set_get', [widget_id, play_id, timestamp]).then(callback)
		},

		getWidgetInstanceScoreSummary(inst_id, callback) {
			Materia.Coms.Json.send('score_summary_get', [inst_id]).then(callback)
		},

		getScoreDistribution(inst_id, callback) {
			Materia.Coms.Json.send('score_raw_distribution_get', [inst_id]).then(callback)
		},
	}
})
