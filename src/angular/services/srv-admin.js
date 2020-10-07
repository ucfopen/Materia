const app = angular.module('materia')
app.service('AdminSrv', function () {
	const getWidgets = () => Materia.Coms.Json.get('/api/admin/widgets')
	const saveWidget = (widget) =>
		Materia.Coms.Json.post(`/api/admin/widget/${encodeURIComponent(widget.id)}`, widget)
	const searchUsers = (str) =>
		Materia.Coms.Json.get(`/api/admin/user_search/${encodeURIComponent(str)}`)
	const lookupUser = (userId) =>
		Materia.Coms.Json.get(`/api/admin/user/${encodeURIComponent(userId)}`)
	const saveUser = (obj) =>
		Materia.Coms.Json.post(`/api/admin/user/${encodeURIComponent(obj.id)}`, obj)

	return {
		getWidgets,
		saveWidget,
		searchUsers,
		lookupUser,
		saveUser,
	}
})
