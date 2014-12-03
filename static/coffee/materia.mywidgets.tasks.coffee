Namespace('Materia.MyWidgets').Tasks = do ->

	init = (gateway) ->

	copyWidget = (inst_id, newName, callback) ->
		Materia.Coms.Json.send 'widget_instance_copy', [inst_id, newName], callback

	deleteWidget = (inst_id) ->
		Materia.Coms.Json.send 'widget_instance_delete', [inst_id], (results) ->
			Materia.Widget.removeWidget inst_id if results

	init : init
	copyWidget : copyWidget
	deleteWidget : deleteWidget
