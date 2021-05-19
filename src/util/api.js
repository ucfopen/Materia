import { useEffect } from 'react'
import fetchOptions from './fetch-options'
import { useQueryClient } from 'react-query'

// checks response for errors and decodes json
const handleErrors = async resp => {
	if (!resp.ok) throw Error(resp.statusText)
	const data = await resp.json()
	if (data?.errorID) {
		throw Error(data.message)
	}
	return data
}

const fetchGet = (url, options = null) => fetch(url, fetchOptions(options)).then(handleErrors)

export const apiGetWidget = (instId) => {
	return fetch(`/api/json/widget_instances_get/${instId}`)
		.then(resp => {
			if (resp.status == 502) return []
			return resp.json()
		})
		.then(widget => {
			return widget
		})
}

export const apiGetWidgets = () => {
	return fetch(`/api/json/widget_instances_get/`, fetchOptions({ body: 'data=' + encodeURIComponent(`[]`) }))
		.then(resp => {
			if (resp.status == 502) return []
			return resp.json()
		})
		.then(resp => {
			resp.sort(_compareWidgets)
			writeToStorage('widgets', resp)
			return resp
		})
}

// Sorts widgets by creation date
const _compareWidgets = (a, b) => {
	return (new Date(a.created_at) <= new Date(b.created_at))
}

export const apiGetWidgetsByType = () => {
	const options = {
		"headers": {
			"cache-control": "no-cache",
			"pragma": "no-cache",
			"content-type": "application/x-www-form-urlencoded; charset=UTF-8"
		},
		"body": "data=%5B%22all%22%5D",
		"method": "POST",
		"mode": "cors",
		"credentials": "include"
	}

	return fetch('/api/json/widgets_get_by_type/', options)
		.then(resp => resp.json())
		.then(widgets => widgets)
}

export const apiCopyWidget = (values) => {
	return fetchGet(`/api/json/widget_instance_copy`, { body: 'data=' + encodeURIComponent(`["${values.instId}","${values.title}","${values.copyPermissions.toString()}"]`) })
		.then(widget => {
			return widget
		})
}

export const apiDeleteWidget = (instId) => {
	return fetchGet(`/api/json/widget_instance_delete/`, { body: `data=%5B%22${instId}%22%5D` })
}

export const apiGetUser = () => {
	return fetchGet('/api/json/user_get', { body: `data=${encodeURIComponent('[]')}` })
		.then(user => {
			if (user.halt) {
				sessionStorage.clear()
				return null
			}

			writeToStorage('user', user)
			return user
		})
}

export const apiAuthorSuper = () => {
	return fetchGet('/api/json/session_author_verify/', { body: `data=${encodeURIComponent(JSON.stringify(['super_user']))}` })
		.then(user => user)
		.catch(error => false)
}

export const apiAuthorSupport = () => {
	return fetchGet('/api/json/session_author_verify/', { body: `data=${encodeURIComponent(JSON.stringify(['support_user']))}` })
		.then(user => user)
		.catch(error => false)
}

export const apiGetNotifications = () => {
	return fetch('/api/json/notifications_get/')
		.then(resp => {
			if (resp.status == 502) return []
			return resp.json()
		})
		.then(notifications => notifications)
}

export const apiGetExtraAttempts = (instId) => {
	return fetch(`/api/admin/extra_attempts/${instId}`)
		.then(resp => {
			if (resp.status != 200) return []
			return resp.json()
		})
		.then(attemps => {
			const map = new Map()
			for (const i in attemps) {
				map.set(parseInt(attemps[i].id),
					{
						id: parseInt(attemps[i].id),
						user_id: parseInt(attemps[i].user_id),
						context_id: attemps[i].context_id,
						extra_attempts: parseInt(attemps[i].extra_attempts)
					})
			}
			//const userIds = Array.from(attemps, user => user.user_id)
			return map
		})
}

export const apiGetUsers = (arrayOfUserIds) => {
	return fetchGet('/api/json/user_get', { body: `data=${encodeURIComponent(JSON.stringify([arrayOfUserIds]))}` })
		.then(users => {
			const keyedUsers = {}

			if (Array.isArray(users)) {
				users.forEach(u => { keyedUsers[u.id] = u })
			}

			return keyedUsers
		})
}

export const apiSearchUsers = (input = "") => {
	return fetch('/api/json/users_search', fetchOptions({ body: `data=${encodeURIComponent(JSON.stringify([input]))}` }))
		.then(resp => {
			if (resp.status == 502) return []
			return resp.json()
		})
		.then(users => users)
}

export const apiGetUserPermsForInstance = (instId) => {
	return fetch('/api/json/permissions_get', fetchOptions({ body: 'data=' + encodeURIComponent(`["4","${instId}"]`) }))
		.then(resp => {
			if (resp.status == 502) return null
			return resp.json()
		})
		.then(perms => perms)
}

export const apiCanEditWidgets = (arrayOfWidgetIds) => {
	return fetch('/api/json/widget_instance_edit_perms_verify', fetchOptions({ body: `data=${encodeURIComponent(JSON.stringify([arrayOfWidgetIds]))}` }))
		.then(res => res.json())
		.then(widgetInfo => widgetInfo)
}

export const apiUpdateWidget = ({ args }) => {
	return fetch('/api/json/widget_instance_update', fetchOptions({ body: `data=${encodeURIComponent(JSON.stringify(args))}` }))
		.then(res => res.json())
		.then(widget => widget)
}

export const apiSearchWidgets = (input) => {
	return fetch(`/api/admin/widget_search/${input}`)
		.then(resp => {
			if (resp.status == 502) return []
			return resp.json()
		})
		.then(widgets => widgets)
}

export const apiGetScoreSummary = (instId) => {
	const options = {
		"headers": {
			"cache-control": "no-cache",
			"pragma": "no-cache",
			"content-type": "application/x-www-form-urlencoded; charset=UTF-8"
		},
		"body": `data=%5B%22${instId}%22%2C${true}%5D`,
		"method": "POST",
		"mode": "cors",
		"credentials": "include"
	}

	return fetch('/api/json/score_summary_get/', options)
		.then(resp => {
			if (resp.ok && resp.status !== 204 && resp.status !== 502) return resp.json()
			return []
		})
		.then(scores => {
			const ranges = [
				"0-9",
				"10-19",
				"20-29",
				"30-39",
				"40-49",
				"50-59",
				"60-69",
				"70-79",
				"80-89",
				"90-100",
			]

			scores.forEach(semester => {
				semester.graphData = semester.distribution?.map((d, i) => ({ label: ranges[i], value: d }))
				semester.totalScores = semester.distribution?.reduce((total, count) => total + count)
			})

			return scores
		})
}

export const apiGetPlayLogs = (instId, term, year) => {
	return fetch('/api/json/play_logs_get', fetchOptions({ body: `data=%5B%22${instId}%22%2C%22${term}%22%2C%22${year}%22%5D` }))
		.then(resp => {
			if (resp.ok && resp.status !== 204 && resp.status !== 502) return resp.json()
			return []
		})
		.then(results => {
			if (results.length == 0) return []

			const timestampToDateDisplay = timestamp => {
				const d = new Date(parseInt(timestamp, 10) * 1000)
				return d.getMonth() + 1 + '/' + d.getDate() + '/' + d.getFullYear()
			}

			const scoresByUser = new Map()
			results.forEach(log => {
				let scoresForUser
				if (!scoresByUser.has(log.user_id)) {
					// initialize user
					const name = log.first === null ? 'All Guests' : `${log.first} ${log.last}`
					scoresForUser = {
						userId: log.user_id,
						name,
						searchableName: name.toLowerCase(),
						scores: []
					}
					scoresByUser.set(log.user_id, scoresForUser)
				} else {
					// already initialized
					scoresForUser = scoresByUser.get(log.user_id)
				}

				// append to scores
				scoresForUser.scores.push({
					elapsed: parseInt(log.elapsed, 10) + 's',
					playId: log.id,
					score: log.done === "1" ? Math.round(parseFloat(log.perc)) + '%' : "---",
					date: timestampToDateDisplay(log.time)
				})
			})

			const logs = Array.from(scoresByUser, ([name, value]) => value)
			return logs
		})
}

export const apiGetStorageData = (instId) => {
	return fetch('/api/json/play_storage_get', fetchOptions({ body: `data=%5B%22${instId}%22%5D` }))
		.then(resp => {
			if (resp.ok && resp.status !== 204 && resp.status !== 502) return resp.json()
			return {}
		})
		.then(results => results)
}

const getFilter = (val, searchInput) => {
	const firstLast = val.play.firstName + val.play.lastName
	const sanatizedSearch = searchInput.replace(/\s+/g, '').toUpperCase()

	if (searchInput.length === 0) return true

	// Matches by user
	if (val.play.user.replace(/\s+/g, '').toUpperCase().includes(sanatizedSearch))
		return true

	// Matches by first and last
	if (firstLast.replace(/\s+/g, '').toUpperCase().includes(sanatizedSearch))
		return true

	return false
}

// Persist to wherever using the super-secret object
export const writeToStorage = (queryKey, data) => {
	let storageData = window.sessionStorage.getItem('queries');

	storageData = {
		...JSON.parse(storageData ?? '{}'),
		[queryKey]: data,
	}

	sessionStorage.setItem('queries', JSON.stringify(storageData))
}

// Hydrate from sessionStorage
export const readFromStorage = () => {
	const queryClient = useQueryClient()

	useEffect(() => {
		const storageData = window.sessionStorage.getItem('queries');

		if (storageData !== null) {
			const queriesWithData = JSON.parse(storageData);

			for (const queryKey in queriesWithData) {
				const data = queriesWithData[queryKey];

				queryClient.setQueryData(queryKey, data);
				queryClient.invalidateQueries(queryKey)
			}
		}
	}, [])
}
