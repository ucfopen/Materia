import { useEffect } from 'react'
import fetchWriteOptions from './fetch-options'
import { useQueryClient } from 'react-query'
import { objectTypes } from '../components/materia-constants'
import { error } from 'jquery'

export const getCSRFToken = () => {
	const cookies = document.cookie.split(';')
	for(let cookie of cookies) {
		if(cookie.startsWith('csrftoken=')) {
			return cookie.split('=')[1]
		}
	}
	return ''
}

// checks response for errors and decodes json
export const handleErrors = async resp => {
	if (!resp.ok) {
		if (resp.status == 404) {
			window.location = '/site/404'
			throw new Error(resp.statusText)
		}
		// decode json
		const errMsg = await resp.json().catch((err) => {
			throw new Error(resp.statusText)
		})
		// check if error has message
		if (errMsg.msg && errMsg.title) {
			throw new Error(errMsg.title, {cause: errMsg.msg, halt: errMsg.halt ?? true, type: errMsg.type})
		}
		// sometimes it's in body
		else if (errMsg.body) {
			let body = JSON.parse(errMsg.body)
			// check if body has error message or warning
			if (body) {
				throw new Error(body.title, {cause: body.msg, halt: body.halt ?? true, type: body.type})
			}
		}
		throw new Error(resp.statusText)
	}
	// decode json
	const data = await resp.json().catch(() => { return null })
	// just in case server side didn't return error status code with error
	if (data?.type == "error") {
		throw Error(data.title, {cause: data.msg, halt: data.halt ?? true, type: data.type})
	}
	return data
}

const fetchPost = (url, options = null) => fetch(url, fetchWriteOptions("POST", options)).then(handleErrors)
const fetchPut = (url, options = null) => fetch(url, fetchWriteOptions("PUT", options)).then(handleErrors)
const fetchPatch = (url, options = null) => fetch(url, fetchWriteOptions("PATCH", options)).then(handleErrors)
const fetchGet = (url) => fetch(url).then(handleErrors)
const fetchDelete = (url) => fetch(url, fetchWriteOptions("DELETE")).then(handleErrors)

// Helper function to simplify encoding fetch body values
const formatFetchBody = body => encodeURIComponent(JSON.stringify(body))



export const apiGetWidgetInstances = ({ pageParam = 1 }) => {
	return fetch(`/api/instances/?user=me&page=${pageParam}`)
	.then(resp => resp.json())
}

export const apiGetWidgetInstance = (instId, getDeleted=false) => {
	return fetch(`/api/instances/${instId}/`)
	.then(resp => resp.json())
}

/** API v1 */

/**
 * It fetches the widget instances from the server, and if successful, writes the response to local
 * storage
 * @returns An array of objects.
 */
export const apiGetUserWidgetInstances = (page_number = 0) => {
	return fetchPost(`/api/json/widget_paginate_user_instances_get/${page_number}`, { body: `data=${formatFetchBody([page_number])}` })
		.then(resp => {
			writeToStorage('widgets', resp)
			return resp
		})
}

export const apiGetInstancesForUser = userId => {
	return fetch(`/api/admin/user/${userId}`)
		.then(handleErrors)
}

export const apiGetWidgetsByType = (widgetType="default") => {
	return fetchPost('/api/widgets/get_by_type/', { body: { widgetType } })
}

// Gets widget info
export const apiGetWidget = (ids=[], type='default') => {
	let params = `?type=${type}`

	if (ids.length) {
		const idsFilter = ids.toString()
		params += `&ids=${idsFilter}`
	}
	return fetch(`/api/widgets/${params}`)
		.then(response => response.json())
		.then((data) => {
			return data
	})
}

/**
 * Takes a widget instance id, a new title, and a boolean value copy in the shape of a object.
 * permissions, and returns a new widget instance
 * @param {object} value
 * @returns The widget instance id
 */
export const apiCopyWidget = values => {
	return fetchPut(
		`/api/instances/${values.instId}/copy/`,
		{ body: { new_name: values.title, copy_existing_perms: values.copyPermissions} },
	)
}

/**
 * It deletes a widget instance
 * @param {string} instID
 * @returns The response from the server.
 */
export const apiDeleteWidget = ({ instId }) => {
	return fetchDelete(`/api/instances/${instId}/`)
}

export const apiSaveWidget = (_params) => {
	if (_params.instId != null) {
		// limit args to the following params
		const body = {
			name: _params?.name ?? undefined,
			qset: _params?.qset ?? undefined,
			is_draft: _params?.isDraft ?? undefined,
			open_at: _params?.openAt,
			close_at: _params?.closeAt,
			attempts: _params?.attempts ?? undefined,
			guest_access: _params?.guestAccess ?? undefined,
			embedded_only: _params?.embeddedOnly ?? undefined,
		}
		return fetchPatch(`/api/instances/${_params.instId}/`, { body })
	} else {
		const body = {
			widget_id: parseInt(_params.widgetId),
			name: _params.name,
			qset: _params.qset,
			is_draft: _params.isDraft,
		}
		return fetchPost('/api/instances/', { body })
	}
}

export const apiGetUser = (user) => {
	if (!!user) user = ''
	return fetch(`/api/users/${user}`)
		.then(response => response.json())
		.then((data) => {
			return {
				...data[0],
				first: data[0].first_name,
				last: data[0].last_name
			}
		})
}

export const apiGetUsers = arrayOfUserIds => {
	return fetchGet('/api/users/')
		.then(users => {
			const keyedUsers = {}
			if (Array.isArray(users)) {
				users.forEach(u => { keyedUsers[u.id] = u })
			}

			return keyedUsers
		})
}

// this endpoint now returns both authentication status and perm level
export const apiUserVerify = () => {
	return fetchGet('/api/session/verify/')
}

export const apiGetNotifications = () => {
	return fetch('/api/notifications/')
	.then(response => response.json())
	.then(data => {
		return data
	})
}

export const apiDeleteNotification = (data) => {
	return fetchPost('/api/notifications/delete/', { body: `data=${formatFetchBody([data.notifId, data.deleteAll])}` })
}

export const apiSearchUsers = (input = '', page_number = 0) => {
	return fetchPost('/api/json/users_search', { body: `data=${formatFetchBody([input, page_number])}` })
}

export const apiGetUserPermsForInstance = instId => {
	return fetch(`/api/instances/${instId}/perms/`)
	.then(resp => resp.json())
}

export const apiSetUserInstancePerms = ({ instId, permsObj }) => {
	return fetchPost('/api/json/permissions_set', { body: `data=${formatFetchBody([objectTypes.WIDGET_INSTANCE, instId, permsObj])}` })
}

export const apiCanEditWidgets = arrayOfWidgetIds => {
	// TODO HEY UPDATE THIS YOU DUMMY
	return {"is_locked":false,"can_publish":true,"can_edit":true}
	// return fetchPost('/api/json/widget_instance_edit_perms_verify', { body: `data=${formatFetchBody([arrayOfWidgetIds])}` })
}

/**
 * It updates a widget instance
 * @param {array} args
  	 * @param {int}     $inst_id
	 * @param {string} 	$name
	 * @param {object}  $qset
	 * @param {bool}    $is_draft Whether the widget is being saved as a draft
	 * @param {int}     $open_at
	 * @param {int}     $close_at
	 * @param {int}     $attempts
	 * @param {bool}    $guest_access
	 * @param {bool} 	$is_student_made
 * @returns {object} updated instance
 */
export const apiUpdateWidget = ({ args }) => {
	return fetchPatch(`/api/instances/${args['inst_id']}/`, { body: args })
}

export const apiGetWidgetLock = (id = null) => {
	return fetchGet(`/api/instances/${id}/lock/`)
		.then(data => data["lock_obtained"])
}

/**
 * It searches for widgets by name or ID
 * @param {string} input (letters only)
 * @returns {array} of matches
 */
export const apiSearchInstances = (input, page_number = 0) => {
	let pattern = /[A-Za-z]+/g
	let match = input.match(pattern)
	if (!match || !match.length) input = ' '
	return fetch(`/api/admin/instance_search/${input}/${page_number}`)
		.then(resp => {
			if (resp.status === 204 || resp.status === 502) return []
			return resp.json()
		})
		.then(resp => {
			writeToStorage('widgets', resp)
			return resp
		})
}

export const apiGetWidgetInstanceScores = (instId, send_token) => {
	return fetchPost('/api/scores/get_for_widget_instance/', { body: { instanceId: instId, token: send_token } })
}


export const apiGetGuestWidgetInstanceScores = (instId, playId) => {
	return fetchPost('/api/scores/get_for_widget_instance_guest/', { body: { instanceId: instId, playId: playId } })
}

export const apiGetWidgetInstancePlayScores = (playId, previewInstId, previewPlayId) => {
	return fetchPost('/api/scores/get_play_details/', { body: { playId, previewInstId, previewPlayId } })
}

export const apiGetScoreDistribution = instId => {
	return fetchPost('/api/json/score_raw_distribution_get', { body: `data=${formatFetchBody([instId])}` })
}

export const apiGetScoreSummary = instId => {
	return fetch(`/api/instances/${instId}/scores/`)
	.then(resp => resp.json())
	.then(data => {
		const scores = data
		const ranges = [
			'0-9',
			'10-19',
			'20-29',
			'30-39',
			'40-49',
			'50-59',
			'60-69',
			'70-79',
			'80-89',
			'90-100',
		]
		scores.forEach(semester => {
			semester.graphData = semester.distribution?.map((d, i) => ({ label: ranges[i], value: d }))
			semester.totalScores = semester.distribution?.reduce((total, count) => total + count)
		})

		return scores
	})
	// return fetchPost('/api/json/score_summary_get/', { body: { instanceId: instId, includeStorageData: true } })
	// 	.then(resp => {
    //   const scores = resp['summaries']
	// 		if (!scores) return []

	// 		const ranges = [
	// 			'0-9',
	// 			'10-19',
	// 			'20-29',
	// 			'30-39',
	// 			'40-49',
	// 			'50-59',
	// 			'60-69',
	// 			'70-79',
	// 			'80-89',
	// 			'90-100',
	// 		]

	// 		scores.forEach(semester => {
	// 			semester.graphData = semester.distribution?.map((d, i) => ({ label: ranges[i], value: d }))
	// 			semester.totalScores = semester.distribution?.reduce((total, count) => total + count)
	// 		})

	// 		return scores
	// 	})
}

export const apiGetPlayLogs = (instId, term, year, page_number) => {
	const params = new URLSearchParams({
		inst_id: instId, semester: term, year: year, include_user_info: true, page: page_number
	})
	return fetchGet(`/api/play-sessions/?${params}`)
		.then(results => {
			if (!results) return []
			if (results.count === 0) return []

			const scoresByUser = new Map()
			results.results.forEach(log => {
				let scoresForUser
				if (log.user_id === null || log.user_id === undefined) log.user_id = 0

				if (!scoresByUser.has(log.user_id)) {

					// initialize user
					const first = log.user?.first_name ?? null
					const last = log.user?.last_name ?? null
					const name = first === null || last == null ? 'All Guests' : `${first} ${last}`
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
					score: log.is_complete === '1' ? Math.round(parseFloat(log.percent)) + '%' : '---',
					created_at: log.created_at
				})

			})

			const logs = Array.from(scoresByUser, ([name, value]) => value)
			const data = { 'total_num_pages': results.total_pages, pagination: logs }
			return data
		})
}

export const apiGetStorageData = instId => {
	return fetchPost('/api/json/play_storage_get', ({ body: `data=${formatFetchBody([instId])}` }))
}

// Widget player api calls
export const apiCreatePlaySession = ({ widgetId }) => {
	return fetch('/api/play-sessions/', {
		method: 'POST',
		body: JSON.stringify({ instanceId: widgetId }),
		headers: {
			'content-type': 'application/json',
			'X-CSRFToken': getCSRFToken(),
		}
	})
		.then(resp => resp.json())
		.then(data => data)
}

export const apiGetQuestionSet = (instanceId, playId = null) => {
	return fetch(`/api/instances/${instanceId}/question_sets/?latest=true`)
		.then(resp => resp.json())
}

export const apiGenerateQset = ({instId, widgetId, topic, includeImages, numQuestions, buildOffExisting}) => {
	return fetchPost('/api/generate/qset/', ({ body: {
		instance_id: instId,
		widget_id: widgetId,
		topic,
		include_images: includeImages,
		num_questions: numQuestions,
		build_off_existing: buildOffExisting
	} }))
}

export const apiSessionVerify = (play_id) => {
	return fetch(`/api/play-sessions/${play_id}/verify/`)
	.then(resp => resp.json())
	.then(data => {
		return data.valid
	})
}

export const apiSavePlayStorage = ({ play_id, logs }) => {
	return fetchPost('/api/json/play_storage_data_save/', ({ body: `data=${formatFetchBody([play_id, logs])}` }))
}

export const apiSavePlayLogs = ({ request }) => {
	return fetch(`/api/play-sessions/${request.playId}/`, {
		method: 'PUT',
		body: JSON.stringify(request.logs),
		headers: {
			'X-CSRFToken': getCSRFToken(),
			'content-type': 'application/json'
		}
	})
	.then(handleErrors)
}

export const apiGetQuestionsByType = (arrayOfQuestionIds, questionTypes) => {
	return fetchPost('/api/user/get_questions/', ({ body: { ids: arrayOfQuestionIds, types: questionTypes } }))
		.then(data => {
			console.log(data.questions[0])
			return data["questions"]
		})
}

export const apiGetAssets = () => {
	return fetchPost(`/api/json/assets_get`, ({ body: `data=${formatFetchBody([])}` }))
}

/** Controller_Api_Asset */

export const apiDeleteAsset = async (assetId) => {
	const options = {
		method: 'POST',
		mode: 'cors',
		credentials: 'include',
		headers: {
			pragma: 'no-cache',
			'cache-control': 'no-cache',
			'content-type': 'application/json; charset=UTF-8'
		}
	}
	return fetch(`/api/asset/delete/${assetId}`, options).then(handleErrors)
}

export const apiRestoreAsset = (assetId) => {
	const options = {
		method: 'POST',
		mode: 'cors',
		credentials: 'include',
		headers: {
			pragma: 'no-cache',
			'cache-control': 'no-cache',
			'content-type': 'application/json; charset=UTF-8'
		}
	}
	return fetch(`/api/asset/restore/${assetId}`, options).then(handleErrors)
}

// Returns boolean, true if the current user can publish the given widget instance, false otherwise
export const apiCanBePublishedByCurrentUser = (widgetId) => {
	return fetchGet(`/api/widgets/${widgetId}/publish_perms_verify/`)
		.then((json) => json['publishPermsValid'])
}

/** Controller_Api_User */

export const apiGetUserPlaySessions = ({pageParam = 1}) => {
	return fetch(`/api/play-sessions/?include_activity=true&page=${pageParam}`)
		.then(resp => resp.json())
		.then(data => data)
}

export const apiUpdateUserSettings = (settings) => {
	return fetch(`/api/users/${settings.user_id}/profile_fields/`, {
		method: 'PUT',
		body: JSON.stringify(settings),
		headers: {
			'X-CSRFToken': getCSRFToken(),
			'content-type': 'application/json'
		}
	})
	.then(resp => resp.json())
	.then(res => {
		return res
	})
}

export const apiUpdateUserRoles = (roles) => {
	return fetch('/api/user/roles', {
		...fetchWriteOptions("POST", {}),
		headers: {
			pragma: 'no-cache',
			'cache-control': 'no-cache',
			'content-type': 'application/json'
		},
		body: JSON.stringify(roles)
	})
		.then(handleErrors)
}

/** Controller_Api_Instance */

export const apiGetQuestionSetHistory = (instId) => {
	return fetchGet(`/api/instances/${instId}/question_sets/`)
	// return fetch(`/api/widget_instances/history/?inst_id=${instId}`)
	// 	.then(handleErrors)
	// 	.then(data => data['history'])
}

// Request access to widget
export const apiRequestAccess = (instId, ownerId) => {
	return fetch('/api/instance/request_access',
	{
		headers: {
			pragma: 'no-cache',
			'cache-control': 'no-cache',
			'content-type': 'application/json; charset=UTF-8'
		},
		method: 'POST',
		mode: 'cors',
		credentials: 'include',
		body: JSON.stringify({
			'inst_id': instId,
			'owner_id': ownerId
		})
	})
	.then(handleErrors)
}

/** Controller_Api_Admin **/

export const apiGetExtraAttempts = instId => {
	return fetch(`/api/admin/extra_attempts/${instId}`)
		.then(handleErrors)
		.then(attempts => {
			const map = new Map()
			for (const i in attempts) {
				map.set(parseInt(attempts[i].id),
					{
						id: parseInt(attempts[i].id),
						user_id: parseInt(attempts[i].user_id),
						context_id: attempts[i].context_id,
						extra_attempts: parseInt(attempts[i].extra_attempts)
					})
			}
			//const userIds = Array.from(attemps, user => user.user_id)
			return map
		})
}

export const apiSetAttempts = ({ instId, attempts }) => {
	return fetch(`/api/admin/extra_attempts/${instId}`,
		{
			method: 'POST',
			mode: 'cors',
			credentials: 'include',
			headers: {
				pragma: 'no-cache',
				'cache-control': 'no-cache',
				'content-type': 'application/json; charset=UTF-8'
			},
			body: JSON.stringify(attempts)
		}).then(handleErrors)
}

/**
 * It searches for widgets by name or ID
 * @param {string} input (must contain letters)
 * @returns {array} if matches were found
 * @returns {bool}  if input does not match pattern
 */
export const apiSearchWidgets = input => {
	let pattern = /[A-Za-z]+/g
	if (!input.match(pattern).length) return false
	input = input.replace("'","%27")
	return fetch(`/api/admin/widget_search/${input}`)
		.then(handleErrors)
}

export const apiGetWidgetsAdmin = () => {
	return fetch(`/api/admin/widgets/`)
		.then(handleErrors)
}

export const apiUpdateWidgetAdmin = widget => {
	return fetch(`/api/admin/widget/${widget.id}`,
	{
		method: 'POST',
		mode: 'cors',
		credentials: 'include',
		headers: {
			pragma: 'no-cache',
			'cache-control': 'no-cache',
			'content-type': 'application/json; charset=UTF-8'
		},
		body: JSON.stringify(widget)
	})
		.then(handleErrors)
}

export const apiUploadWidgets = (files) => {
	const formData = new FormData()

	Array.from(files).forEach(file => {
		formData.append('files[]', file, file.name)
		formData.append('content-type', 'multipart/form-data')
	})

	return fetch(`/admin/upload`, {
		method: 'POST',
		mode: 'cors',
		credentials: 'include',
		headers: {
			'pragma': 'no-cache',
			'cache-control': 'no-cache'
		},
		body: formData
	})
		.then(handleErrors)
}

/**
 * It undeletes a widget instance
 * @param {string} instID
 * @returns {boolean} operation success
 */
export const apiUnDeleteWidget = ({ instId }) => {
	return fetch(`/api/admin/widget_instance_undelete/${instId}`,
		{
			method: 'POST',
			mode: 'cors',
			credentials: 'include',
			headers: {
				pragma: 'no-cache',
				'cache-control': 'no-cache',
				'content-type': 'application/json; charset=UTF-8'
			}
		})
		.then(handleErrors)
}

export const apiWidgetPromptGenerate = (prompt) => {
	return fetchPost(`/api/json/widget_prompt_generate/`, { body: { prompt } })
}

/** STORAGE UTILS */

// Persist to wherever using the super-secret object
const writeToStorage = (queryKey, data) => {
	let storageData = window.sessionStorage.getItem('queries');

	storageData = {
		...JSON.parse(storageData || '{}'),
		[queryKey]: data,
	}

	sessionStorage.setItem('queries', JSON.stringify(storageData))
}

// Hydrate from sessionStorage
/**
 * It reads the data from sessionStorage and sets it to the queryClient
 */
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
