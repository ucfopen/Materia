Namespace('Materia.MyWidgets').Tasks = do ->

	init = (gateway) ->

	copyWidget = (inst_id, newName) ->
		Materia.Coms.Json.send 'widget_instance_copy', [inst_id, newName], (inst_id) ->
			Materia.Widget.addWidget inst_id

	deleteWidget = (inst_id) ->
		Materia.Coms.Json.send 'widget_instance_delete', [inst_id], (results) ->
			Materia.MyWidgets.Sidebar.removeWidget inst_id if results

	init : init
	copyWidget : copyWidget
	deleteWidget : deleteWidget
