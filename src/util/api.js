import { useEffect } from 'react'
import fetchPOSTOptions from './fetch-options'
import { useQueryClient } from 'react-query'
import { objectTypes } from '../components/materia-constants'
import { error } from 'jquery'

// checks response for errors and decodes json
const handleErrors = async resp => {
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
			throw new Error(errMsg.title, {cause: errMsg.msg, halt: errMsg.halt, type: errMsg.type})
		}
		// sometimes it's in body
		else if (errMsg.body) {
			let body = JSON.parse(errMsg.body)
			// check if body has error message or warning
			if (body) {
				throw new Error(body.title, {cause: body.msg, halt: body.halt, type: body.type})
			}
		}
		throw new Error(resp.statusText)
	}
	// decode json
	const data = await resp.json().catch(() => { return null })
	// just in case server side didn't return error status code with error
	if (data?.type == "error") {
		throw Error(data.title, {cause: data.msg, halt: data.halt, type: data.type})
	}
	return data
}

const fetchGet = (url, options = null) => fetch(url, fetchPOSTOptions(options)).then(handleErrors)

// Helper function to simplify encoding fetch body values
const formatFetchBody = body => encodeURIComponent(JSON.stringify(body))

/** API v1 */

export const apiGetWidgetInstance = (instId) => {
	return fetchGet(`/api/json/widget_instances_get/`, { body: `data=${formatFetchBody([instId, false])}` })
	  .then(widget => {
			if (widget?.length > 0) return widget[0]
			else return {}
		})
}

/**
 * It fetches the widget instances from the server, and if successful, writes the response to local
 * storage
 * @returns An array of objects.
 */
export const apiGetUserWidgetInstances = (page_number = 0) => {
	return fetchGet(`/api/json/widget_paginate_user_instances_get/${page_number}`, { body: `data=${formatFetchBody([page_number])}` })
		.then(resp => {
			writeToStorage('widgets', resp)
			return resp
		})
}

export const apiGetInstancesForUser = userId => {
	return fetch(`/api/admin/user/${userId}`)
		.then(handleErrors)
}

export const apiGetWidgetsByType = () => {
	return fetchGet('/api/json/widgets_get_by_type/', { body: `data=${formatFetchBody(['all'])}` })
}

// Gets widget info
export const apiGetWidget = widgetId => {
	return fetchGet('/api/json/widgets_get/', { body: `data=${formatFetchBody([[widgetId]])}` })
		.then(widgets => {
			return widgets?.length > 0 ? widgets[0] : {}
		})
}

/**
 * Takes a widget instance id, a new title, and a boolean value copy in the shape of a object.
 * permissions, and returns a new widget instance
 * @param {object} value
 * @returns The widget instance id
 */
export const apiCopyWidget = values => {
	return fetchGet(`/api/json/widget_instance_copy`, { body: `data=${formatFetchBody([values.instId, values.title, values.copyPermissions])}` })
}

/**
 * It deletes a widget instance
 * @param {string} instID
 * @returns The response from the server.
 */
export const apiDeleteWidget = ({ instId }) => {
	return fetchGet('/api/json/widget_instance_delete/', { body: `data=${formatFetchBody([instId])}` })
}

export const apiSaveWidget = (_params) => {
	const defaults = {
		qset: null,
		is_draft: null,
		open_at: null,
		close_at: null,
		attempts: null,
		guest_access: null,
		embedded_only: null,
	}

	let params = Object.assign({}, defaults, _params)

	if (params.inst_id != null) {
		// limit args to the the following params
		let args = [
			params.inst_id,
			params.name,
			params.qset,
			params.is_draft,
			params.open_at,
			params.close_at,
			params.attempts,
			params.guest_access,
			params.embedded_only,
		]

		return fetchGet('/api/json/widget_instance_update/', { body: `data=${formatFetchBody(args)}` })

	} else {
		let args = [
			params.widget_id,
			params.name,
			params.qset,
			params.is_draft
		]
		return fetchGet('/api/json/widget_instance_save/', { body: `data=${formatFetchBody(args)}` })
	}
}

export const apiGetUser = () => {
	return fetchGet('/api/json/user_get', { body: `data=${formatFetchBody([])}` })
		.then(user => {
			writeToStorage('user', user)
			return user
		})
}

export const apiGetUsers = arrayOfUserIds => {
	return fetchGet('/api/json/user_get', { body: `data=${formatFetchBody([arrayOfUserIds])}` })
		.then(users => {
			const keyedUsers = {}
			if (Array.isArray(users)) {
				users.forEach(u => { keyedUsers[u.id] = u })
			}

			return keyedUsers
		})
}

export const apiAuthorSuper = () => {
	return fetchGet('/api/json/session_author_verify/', { body: `data=${formatFetchBody(['super_user'])}` })
		.then(user => user)
		.catch(error => false)
}

export const apiAuthorSupport = () => {
	return fetchGet('/api/json/session_author_verify/', { body: `data=${formatFetchBody(['support_user'])}` })
		.then(user => user)
		.catch(error => false)
}

export const apiAuthorVerify = () => {
	return fetchGet('/api/json/session_author_verify/', { body: `data=${formatFetchBody([])}` })
		.then(user => user)
		.catch(error => false)
}

export const apiGetNotifications = () => {
	return fetchGet('/api/json/notifications_get/', { body: `data=${formatFetchBody([])}` })
}

export const apiDeleteNotification = (data) => {
	return fetchGet('/api/json/notification_delete/', { body: `data=${formatFetchBody([data.notifId, data.deleteAll])}` })
}

export const apiSearchUsers = (input = '', page_number = 0) => {
	return fetchGet('/api/json/users_search', { body: `data=${formatFetchBody([input, page_number])}` })
}

export const apiGetUserPermsForInstance = instId => {
	return fetchGet('/api/json/permissions_get', { body: `data=${formatFetchBody([objectTypes.WIDGET_INSTANCE, instId])}` })
}

export const apiSetUserInstancePerms = ({ instId, permsObj }) => {
	return fetchGet('/api/json/permissions_set', { body: `data=${formatFetchBody([objectTypes.WIDGET_INSTANCE, instId, permsObj])}` })
}

export const apiCanEditWidgets = arrayOfWidgetIds => {
	return fetchGet('/api/json/widget_instance_edit_perms_verify', { body: `data=${formatFetchBody([arrayOfWidgetIds])}` })
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
	return fetchGet('/api/json/widget_instance_update', { body: `data=${formatFetchBody(args)}` })
}

export const apiGetWidgetLock = (id = null) => {
	return fetchGet('/api/json/widget_instance_lock', { body: `data=${formatFetchBody([id])}` })
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
	return fetchGet('/api/json/widget_instance_scores_get', { body: `data=${formatFetchBody([instId, send_token])}` })
}


export const apiGetGuestWidgetInstanceScores = (instId, playId) => {
	return fetchGet('/api/json/guest_widget_instance_scores_get', { body: `data=${formatFetchBody([instId, playId])}` })
}

export const apiGetWidgetInstancePlayScores = (playId, previewInstId) => {
	return fetchGet('/api/json/widget_instance_play_scores_get', { body: `data=${formatFetchBody([playId, previewInstId])}` })
}

export const apiGetScoreDistribution = instId => {
	return fetchGet('/api/json/score_raw_distribution_get', { body: `data=${formatFetchBody([instId])}` })
}

export const apiGetScoreSummary = instId => {
	return fetchGet('/api/json/score_summary_get/', { body: `data=${formatFetchBody([instId, true])}` })
		.then(scores => {
			if (!scores) return []

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
}

export const apiGetPlayLogs = (instId, term, year, page_number) => {
	return fetchGet('/api/json/play_logs_get', { body: `data=${formatFetchBody([instId, term, year, page_number])}` })
		.then(results => {
			if (!results) return []
			if (results.pagination.length == 0) return []

			const scoresByUser = new Map()
			results.pagination.forEach(log => {
				let scoresForUser
				if (log.user_id === null || log.user_id == undefined) log.user_id = 0

				if (!scoresByUser.has(log.user_id)) {

					// initialize user
					const name = log.first === null || log.first === undefined ? 'All Guests' : `${log.first} ${log.last}`
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
					score: log.done === '1' ? Math.round(parseFloat(log.perc)) + '%' : '---',
					created_at: log.time
				})

			})

			const logs = Array.from(scoresByUser, ([name, value]) => value)
			const data = { 'total_num_pages': results.total_num_pages, pagination: logs }
			return data
		})
}

export const apiGetStorageData = instId => {
	return fetchGet('/api/json/play_storage_get', ({ body: `data=${formatFetchBody([instId])}` }))
}

// Widget player api calls
export const apiGetPlaySession = ({ widgetId }) => {
	return fetchGet('/api/json/session_play_create/', ({ body: `data=${formatFetchBody([widgetId])}` }))
}

export const apiGetQuestionSet = (instId, playId = null) => {
	return fetchGet('/api/json/question_set_get/', ({ body: `data=${formatFetchBody([instId, playId])}` }))
}

export const apiGenerateQset = ({inst_id, widget_id, topic, include_images, num_questions, build_off_existing}) => {
	return fetchGet('/api/json/question_set_generate/', ({ body: `data=${formatFetchBody([inst_id, widget_id, topic, include_images, num_questions, build_off_existing])}` }))
}

export const apiSessionVerify = (play_id) => {
	return fetchGet('/api/json/session_play_verify/', ({ body: `data=${formatFetchBody([play_id])}` }))
}

export const apiSavePlayStorage = ({ play_id, logs }) => {
	return fetchGet('/api/json/play_storage_data_save/', ({ body: `data=${formatFetchBody([play_id, logs])}` }))
}

export const apiSavePlayLogs = ({ request }) => {
	return fetchGet('/api/json/play_logs_save/', ({ body: `data=${formatFetchBody(request)}` }))
}

export const apiGetQuestionsByType = (arrayOfQuestionIds, arrayOfQuestionTypes) => {
	return fetchGet('/api/json/questions_get', ({ body: `data=${formatFetchBody([arrayOfQuestionIds, arrayOfQuestionTypes])}` }))
}

export const apiGetAssets = () => {
	return fetchGet(`/api/json/assets_get`, ({ body: `data=${formatFetchBody([])}` }))
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
	return fetchGet('/api/json/widget_publish_perms_verify', ({ body: `data=${formatFetchBody([widgetId])}` }))
}

/** Controller_Api_User */

export const apiGetUserActivity = ({ pageParam = 0 }) => {
	return fetch(`/api/user/activity?start=${pageParam * 6}`)
		.then(handleErrors)
}

export const apiUpdateUserSettings = (settings) => {
	return fetch('/api/user/settings', {
		...fetchPOSTOptions({}),
		headers: {
			pragma: 'no-cache',
			'cache-control': 'no-cache',
			'content-type': 'application/json'
		},
		body: JSON.stringify(settings)
	})
		.then(handleErrors)
}

export const apiUpdateUserRoles = (roles) => {
	return fetch('/api/user/roles', {
		...fetchPOSTOptions({}),
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
	return fetch(`/api/instance/history?inst_id=${instId}`)
		.then(handleErrors)
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
	return fetchGet(`/api/json/widget_prompt_generate/`, { body: `data=${formatFetchBody([prompt])}` })
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
