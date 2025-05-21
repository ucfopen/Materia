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

// TODO temporary while we transition away from handleErrors
const handleErrors = (data) => {
	return data
}

const methods = {
	HEAD: 'HEAD',
	GET: 'GET',
	POST: 'POST',
	PUT: 'PUT',
	PATCH: 'PATCH',
	DELETE: 'DELETE'
}

/**
 * Performs a http request with comprehensive error handling
 * @param {string} method - the http method to use
 * @param {string} url - The endpoint URL
 * @param {Object} data - The data to send in the request body
 * @returns {Promise<any>} - Parsed response data
 */
export const handleRequest = async (method, url, data = {}, options = {}) => {
	try {
		let response
		if (method == methods.GET || method == methods.HEAD) {
			response = await fetch(url)
		}
		else {
			const add_options = {
				...fetchWriteOptions(method, {body: data}),
				...options
			}
			console.log(add_options)
			response = await fetch(url, add_options)
		}

		if (!response.ok) {
			// Try to parse error response
			let errorData
			try {
				errorData = await response.json();
			} catch (e) {
				throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
			}

			// Create a rich error object with all available info
			const error = new Error(
				errorData.message || errorData.title || `HTTP error ${response.status}`
			)

			// Add extra properties to the error
			error.status = response.status
			error.statusText = response.statusText
			error.data = errorData

			throw error
		}

		try {
			const data = await response.json()
			return data
		} catch (e) {
			return null
		}
	} catch (error) {
		// Re-throw any error to ensure proper rejection
		throw error;
	}
}

// Helper function to simplify encoding fetch body values
const formatFetchBody = body => encodeURIComponent(JSON.stringify(body))

export const apiGetWidgetInstances = (user, pageParam) => {
	return handleRequest(methods.GET, `/api/instances/?user=${user}&page=${pageParam}`)
}

export const apiGetWidgetInstance = (instId, getDeleted=false) => {
	return handleRequest(methods.GET, `/api/instances/${instId}/`)
}

export const apiGetInstancesForUser = userId => {
	return handleRequest(methods.GET, `/api/instances/?user=${userId}`)
}

// TODO update or retire this
export const apiGetWidgetsByType = (widgetType="default") => {
	return handleRequest(methods.POST, '/api/widgets/get_by_type/', widgetType )
}

// Gets widget info
export const apiGetWidget = (ids=[], type='default') => {
	let params = `?type=${type}`

	if (ids.length) {
		const idsFilter = ids.toString()
		params += `&ids=${idsFilter}`
	}
	return handleRequest(methods.GET, `/api/widgets/${params}`)
}

/**
 * Takes a widget instance id, a new title, and a boolean value copy in the shape of a object.
 * permissions, and returns a new widget instance
 * @param {object} value
 * @returns The widget instance id
 */
export const apiCopyWidget = values => {
	return handleRequest(
		methods.PUT,
		`/api/instances/${values.instId}/copy/`,
		{  new_name: values.title, copy_existing_perms: values.copyPermissions },
	)
}

/**
 * It deletes a widget instance
 * @param {string} instID
 * @returns The response from the server.
 */
export const apiDeleteWidget = ({ instId }) => {
	return handleRequest(methods.DELETE, `/api/instances/${instId}/`)
}

export const apiSaveWidget = (_params) => {
	const body = {
		widget_id: parseInt(_params.widgetId),
		name: _params.name,
		qset: _params.qset,
		is_draft: _params.isDraft,
	}
	return handleRequest(methods.POST, '/api/instances/', { ...body })
}

export const apiGetUser = (user = 'me') => {
	return handleRequest(methods.GET, `/api/users/${user}/`)
}

export const apiGetUsers = (arrayOfUserIds = []) => {
	const params = new URLSearchParams({ ids: arrayOfUserIds })
	return handleRequest(methods.GET, `/api/users/?${params}`)
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
	return handleRequest(methods.GET, '/api/session/verify/')
}

export const apiGetNotifications = () => {
	return handleRequest(methods.GET, '/api/notifications/')
}

export const apiDeleteNotification = (data) => {
	return handleRequest(methods.POST, '/api/notifications/delete/', { body: `data=${formatFetchBody([data.notifId, data.deleteAll])}` })
}

export const apiSearchUsers = (input = '', page_number = 1) => {
	const params = new URLSearchParams({ search: input, page: page_number })
	return handleRequest(methods.GET, `/api/users?${params}`)
}

export const apiGetUserPermsForInstance = instId => {
	return handleRequest(methods.GET, `/api/instances/${instId}/perms/`)
}

export const apiSetUserInstancePerms = ({ instId, permsObj }) => {
	return handleRequest(methods.PUT, `/api/instances/${instId}/perms/`, { updates: permsObj })
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
export const apiUpdateWidgetInstance = ({ args }) => {
	// limit args to the following params
	const body = {
		name: args?.name ?? undefined,
		qset: args?.qset ?? undefined,
		is_draft: args?.isDraft ?? undefined,
		open_at: args?.openAt,
		close_at: args?.closeAt,
		attempts: args?.attempts ?? undefined,
		guest_access: args?.guestAccess ?? undefined,
		embedded_only: args?.embeddedOnly ?? undefined,
	}
	return handleRequest(methods.PATCH, `/api/instances/${args.instId}/`, body)
}

export const apiGetWidgetLock = (id = null) => {
	return handleRequest(methods.GET, `/api/instances/${id}/lock/`)
		.then(data => data["lock_obtained"])
}

/**
 * It searches for widgets by name or ID
 * @param {string} input (letters only)
 * @returns {array} of matches
 */
export const apiSearchInstances = (input, pageParam = 1, include_deleted = false) => {
	return handleRequest(methods.GET, `/api/instances/?search=${input}&page=${pageParam}&include_deleted=${include_deleted}`)
}

// TODO update or retire
export const apiGetWidgetInstanceScores = (instId, send_token) => {
	return handleRequest(methods.POST, '/api/scores/get_for_widget_instance/', {  instanceId: instId, token: send_token })
}

// TODO update or retire
export const apiGetGuestWidgetInstanceScores = (instId, playId) => {
	return handleRequest(methods.POST, '/api/scores/get_for_widget_instance_guest/', { instanceId: instId, playId: playId })
}

// TODO update or retire
export const apiGetWidgetInstancePlayScores = (playId, previewInstId, previewPlayId) => {
	return handleRequest(methods.POST, '/api/scores/get_play_details/', {  playId, previewInstId, previewPlayId })
}

// TODO update
export const apiGetScoreDistribution = instId => {
	return handleRequest(methods.POST,'/api/json/score_raw_distribution_get', { body: `data=${formatFetchBody([instId])}` })
}

export const apiGetScoreSummary = instId => {
	return handleRequest(methods.GET, `/api/instances/${instId}/scores/`)
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
}

export const apiGetPlayLogs = (instId, term, year, page_number) => {
	const params = new URLSearchParams({
		inst_id: instId, semester: term, year: year, include_user_info: true, page: page_number
	})
	return handleRequest(methods.GET, `/api/play-sessions/?${params}`)
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

// TODO update or retire
export const apiGetStorageData = instId => {
	return handleRequest(methods.POST, '/api/json/play_storage_get', ({ body: `data=${formatFetchBody([instId])}` }))
}

export const apiCreatePlaySession = ({ widgetId }) => {
	return handleRequest(methods.POST, '/api/play-sessions/', {
		instanceId: widgetId,
	})
}

export const apiGetQuestionSet = (instanceId, playId = null) => {
	return handleRequest(methods.GET, `/api/instances/${instanceId}/question_sets/?latest=true`)
}

export const apiGenerateQset = ({instId, widgetId, topic, includeImages, numQuestions, buildOffExisting}) => {
	return handleRequest(methods.POST, '/api/generate/qset/', ({
		instance_id: instId,
		widget_id: widgetId,
		topic,
		include_images: includeImages,
		num_questions: numQuestions,
		build_off_existing: buildOffExisting
	}))
}

export const apiSessionVerify = (play_id) => {
	return handleRequest(methods.GET, `/api/play-sessions/${play_id}/verify/`)
	.then(data => {
		return data.valid
	})
}

// TODO update or retire
export const apiSavePlayStorage = ({ play_id, logs }) => {
	return handleRequest(methods.POST, '/api/json/play_storage_data_save/', ({ body: `data=${formatFetchBody([play_id, logs])}` }))
}

export const apiSavePlayLogs = ({ request }) => {
	return handleRequest(methods.PUT, `/api/play-sessions/${request.playId}/`, { request })
}

export const apiGetQuestionsByType = (arrayOfQuestionIds, questionTypes) => {
	return handleRequest(methods.POST, '/api/user/get_questions/', { ids: arrayOfQuestionIds, types: questionTypes })
		.then(data => {
			return data["questions"]
		})
}

export const apiGetAssets = () => {
	return handleRequest(methods.GET, `/api/assets/`)
}

export const apiDeleteAsset = (assetId) => {
	return handleRequest(methods.DELETE, `/api/assets/${assetId}/`)
}

export const apiRestoreAsset = (assetId) => {
	return handleRequest(methods.POST, `/api/assets/${assetId}/restore/`)
}

// Returns boolean, true if the current user can publish the given widget instance, false otherwise
export const apiCanBePublishedByCurrentUser = (widgetId) => {
	return handleRequest(methods.GET, `/api/widgets/${widgetId}/publish_perms_verify/`)
		.then((json) => json['publishPermsValid'])
}

/** Controller_Api_User */

export const apiGetUserPlaySessions = (user, pageParam = 1) => {
	return handleRequest('GET', `/api/play-sessions/?user=${user}&include_activity=true&page=${pageParam}`)
}

export const apiUpdateUserSettings = (settings) => {
	return handleRequest(methods.PUT, `/api/users/${settings.user_id}/profile_fields/`, settings)
}

export const apiGetUserRoles = (id) => {
	return handleRequest(methods.GET, `/api/users/${id}/roles/`)
}

export const apiUpdateUserRoles = (roles) => {
	return handleRequest(methods.PATCH, `/api/users/${roles.id}/roles/`,  roles)
}

export const apiUpdateUser = (user) => {
	return handleRequest(methods.PATCH, `/api/users/${user.id}/`, user)
}

/** Controller_Api_Instance */

export const apiGetQuestionSetHistory = (instId) => {
	return handleRequest('GET', `/api/instances/${instId}/question_sets/`)
		.then(data => data['history'])
}

// Request access to widget
export const apiRequestAccess = (instId, ownerId) => {
	return handleRequest(methods.POST, '/api/instance/request_access', { inst_id: instId, owner_id: ownerId })
}

/** Controller_Api_Admin **/

export const apiGetExtraAttempts = instId => {
	return handleRequest(methods.GET, `/api/admin/extra_attempts/${instId}`)
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

// TODO update or retire
export const apiSetAttempts = ({ instId, attempts }) => {
	return fetch(`/api/admin/extra_attempts/${instId}`,
		{
			method: methods.POST,
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

export const apiUpdateWidgetEngine = widget => {
	return handleRequest(methods.PATCH, `/api/widgets/${widget.id}/`, widget)
}

export const apiUploadWidgets = (files) => {
	const formData = new FormData()

	Array.from(files).forEach(file => {
		formData.append('files[]', file, file.name)
	})

	return handleRequest(methods.POST, `/api/widgets/upload/`, {}, { headers: { 'X-CSRFToken': getCSRFToken(), }, body: formData })
}

export const apiUnDeleteWidget = ({ instId }) => {
	return handleRequest(methods.POST, `/api/instances/${instId}/undelete/`)
}

export const apiWidgetPromptGenerate = (prompt) => {
	return handleRequest(methods.POST, `/api/json/widget_prompt_generate/`,  prompt)
}

export const apiLoginDirect = ( username, password ) => {
	return handleRequest(methods.POST, `/api/user/login/`, { username, password })
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
