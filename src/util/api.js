import { useEffect } from 'react'
import fetchWriteOptions from './fetch-options'
import { useQueryClient } from '@tanstack/react-query'

export const getCSRFToken = () => {
	const cookies = document.cookie.split(';')
	for(let cookie of cookies) {
		if(cookie.trim().startsWith('csrftoken=')) {
			return cookie.split('=')[1]
		}
	}
	return ''
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
 * Performs an HTTP request with comprehensive error handling given the request body and options.
 * @param {string} method - The HTTP method to use.
 * @param {string} url - The endpoint URL.
 * @param {Object} [data={}] - The data to send in the request body.
 * @param {Object} [options={}] - The data to send in the request body.
 * @returns {Promise<any>} - Parsed response data.
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
				errorData.msg || errorData.title || `HTTP error ${response.status}`
			)

			// Add extra properties to the error
			error.status = response.status
			error.statusText = response.statusText
			error.data = errorData

			throw error
		}

		try {
			if (response.status === 204){
				return null
			}
  
			if (
				response.headers.get('Content-Type') === 'application/download' ||
				response.headers.get('Content-Type') === 'text/csv' ||
				response.headers.get('Content-Type') === 'application/zip' ||
				response.headers.get('Content-Type') === 'application/octet-stream'
			) {
				const data = await response.blob()
				return data
			}

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

/**
 * Takes a user ID (or 'me' for the current user) and a page number, and returns the specified page of
 *  widget instances visible to/owned by the given user.
 * @param {string|int} user - The ID of the user to list widget instances for, or 'me' for the current user
 * @param {int} pageParam - Which page of widget instances to pull
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiGetWidgetInstances = (user, pageParam) => {
	return handleRequest(methods.GET, `/api/instances/?user=${user}&page=${pageParam}`)
}

/**
 * @todo Currently the optional getDeleted param is unused, pending backend updates
 * Takes a widget instance ID and an optional flag to allow lookup of deleted instances, and returns
 *  a single widget instance.
 * @param {string} instId - The ID of the widget instance.
 * @param {boolean} [getDeleted=false] - Whether to return the requested widget instance if it is deleted.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiGetWidgetInstance = (instId, getDeleted=false) => {
	return handleRequest(methods.GET, `/api/instances/${instId}/`)
}

/**
 * @todo Currently not implemented - leaving here commented out to revisit later.
 * Takes an LMS context id, and returns any widget instances with LTI associations
 *  attached to that context.
 * @param {string} contextId - The ID of the LMS context in which widgets may be embedded.
 * @returns {Promise<any>} - Parsed response data.
 */
// export const apiGetInstancesFromContext = contextId => {
// 	return handleRequest(methods.GET, `/api/lti/${contextId}/instances/`)
// }

/**
 * Takes a list of widget IDs and a lookup type, and returns a corresponding list of widget objects.
 * When not provided a list of widget IDs the lookup type is evaluated to create a filtered list of widget objects.
 * @param {string[]} [ids=[]] - A list of widget IDs to collect more information for.
 * @param {'admin'|'all'|'playable'|'featured'|'catalog'|'default'} [widgetType='catalog'] - The type of lookup to perform.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiGetWidget = (ids=[], widgetType='catalog') => {
	let params = `?type=${widgetType}`

	if (ids.length) {
		const idsFilter = ids.toString()
		params += `&ids=${idsFilter}`
	}
	return handleRequest(methods.GET, `/api/widgets/${params}`)
}

/**
 * Takes a widget instance id, a new title, and a boolean value indicating whether to
 *  copy original permissions, and returns a new widget instance.
 * @param {Object} values
 * @param {string} values.instId - The widget instance ID to make a copy of.
 * @param {string} values.title - The title to apply to the new copy.
 * @param {boolean} values.copyPermissions - Whether to grant owners of the widget being copied identical permissions to the copy.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiCopyWidget = values => {
	return handleRequest(
		methods.PUT,
		`/api/instances/${values.instId}/copy/`,
		{
			new_name: values.title,
			copy_existing_perms: values.copyPermissions
		},
	)
}

/**
 * Deletes a widget instance.
 * @param {string} instID - The ID of the widget instance to be deleted.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiDeleteWidget = ({ instId }) => {
	return handleRequest(methods.DELETE, `/api/instances/${instId}/`)
}

/**
 * Creates or updates a widget instance, and returns the created or updated widget instance.
 * Most parameters are optional since this method is used for both updating existing widget
 *  instances and for creating new widget instances.
 * @param {Object} _params
 * @param {string} _params.instId - The ID of the widget instance to update.
 * @param {Object} _params.qset - The widget instance question set.
 * @param {boolean} _params.isdraft - Whether the widget instance is a draft.
 * @param {string} _params.openAt - A datetime string representing the start of the instance's play availability.
 * @param {string} _params.closeAt - A datetime string representing the end of the instance's play availability.
 * @param {int} _params.attempts - How many play attempts are allowed for the instance.
 * @param {boolean} _params.guestAccess - Whether the instance is playable without being logged in.
 * @param {boolean} _params.embeddedOnly - Whether the instance is playable outside of an embedded context.
 * @returns {Promise<any>} - Parsed response data.
 */
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
		return handleRequest(methods.PATCH, `/api/instances/${_params.instId}/`, { ...body })
	} else {
		const body = {
			widget_id: parseInt(_params.widgetId),
			name: _params.name,
			qset: _params.qset,
			is_draft: _params.isDraft,
		}
		return handleRequest(methods.POST, '/api/instances/', { ...body })
	}
}

/**
 * Gets data for a user. Typically used to get data for the current user.
 * @param {string} [user='me'] - The ID of the desired user or 'me' for the current user.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiGetUser = (user = 'me') => {
	return handleRequest(methods.GET, `/api/users/${user}/`)
}

/**
 * Gets data for a provided list of users by ID.
 * @param {int[]} [arrayOfUserIds=[]] - A list of desired user IDs.
 * @returns {Promise<any>} - Parsed response data.
 */
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

/**
 * Returns whether the current user is authenticated and what their role is if so.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiUserVerify = () => {
	return handleRequest(methods.GET, '/api/session/verify/')
}

/**
 * Returns a list of notification objects for the currently logged in user.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiGetNotifications = () => {
	return handleRequest(methods.GET, '/api/notifications/')
}

/**
 * Deletes a single notification or all notifications.
 * @param {int} notifId - The ID of the notification to delete.
 * @param {boolean} deleteAll - Whether or not to delete all notifications.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiDeleteNotification = ({ notifId, deleteAll }) => {
	if (deleteAll) {
		return handleRequest(methods.DELETE, `/api/notifications/delete_all/`)
	} else {
		return handleRequest(methods.DELETE, `/api/notifications/${notifId}/`)
	}
}

/**
 * Takes a search string and a page number, and returns a list of user objects.
 * @param {string} [input=''] - Search string.
 * @param {int} [pageNumber=1] - Which page of search results to return.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiSearchUsers = (input = '', pageNumber = 1) => {
	const params = new URLSearchParams({ search: input, page: pageNumber })
	return handleRequest(methods.GET, `/api/users/?${params}`)
}

/**
 * Takes an instance id, and returns a list of all users and their permissions to
 *  the specified widget instance.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiGetUserPermsForInstance = instId => {
	return handleRequest(methods.GET, `/api/instances/${instId}/perms/`)
}

/**
 * Takes an instance id, and a perms object, passing the permissions to the backend to
 *  apply to the given widget instance.
 * @param {string} instId - Widget instance ID.
 * @param {Object} permsObj - Permissions object.
 * @param {Object} permsObj.expiration - Optional, Date object, when the permission expires.
 * @param {boolean} permsObj.has_contexts - Determines whether permissions are constrained to certain contexts.
 * @param {string} permsObj.perm_level - The level of permission for the given user.
 * @param {int} permsObj.user - ID of user with the permission to the widget instance.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiSetUserInstancePerms = ({ instId, permsObj }) => {
	return handleRequest(methods.PUT, `/api/instances/${instId}/perms/`, { updates: permsObj })
}

/**
 * Takes numerous pertinent arguments and updates a widget instance in the backend, then
 *  returns that instance.
 * @param {string} args.instId - The ID of the widget instance to update.
 * @param {string} args.name - The new title to apply to the widget instance.
 * @param {Object} args.qset - The widget instance question set.
 * @param {boolean} args.isDraft - Whether the widget instance is a draft.
 * @param {string} args.openAt - A datetime string representing the start of the instance's play availability.
 * @param {string} args.closeAt - A datetime string representing the end of the instance's play availability.
 * @param {int} args.attempts - How many play attempts are allowed for the instance.
 * @param {boolean} args.guestAccess - Whether the instance is playable without being logged in.
 * @param {boolean} args.embeddedOnly - Whether the instance is playable outside of an embedded context.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiUpdateWidgetInstance = ({ args }) => {
	// limit args to the following params
	const body = {
		name: args?.name,
		qset: args?.qset,
		is_draft: args?.isDraft,
		open_at: args?.openAt,
		close_at: args?.closeAt,
		attempts: args?.attempts,
		guest_access: args?.guestAccess,
		embedded_only: args?.embeddedOnly,
	}
	return handleRequest(methods.PATCH, `/api/instances/${args.id}/`, body)
}

/**
 * Takes an instance ID and returns the status of the edit lock for that instance, locking the instance
 *  for the current user if it is not locked by another user.
 * @param {string} id - The ID of the widget instance to get a lock for.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiGetWidgetLock = (id = null) => {
	return handleRequest(methods.GET, `/api/instances/${id}/lock/`)
		.then(data => data["lock_obtained"])
}

/**
 * Takes a search string, page number and optional boolean to include deleted instances, searches for
 *  widget instances using the given search string and returns an array of objects corresponding
 *  to the requested page of widget instances.
 * @param {string} input - The string to use in the widget instance search query.
 * @param {int} [pageParam=1] - The page of paginated widget instances to request.
 * @param {boolean} [include_deleted=false] - Whether to include deleted widgets in search results.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiExportDataStorageTable = (instId, table, semester, anonymous) => {
  const url = `/api/instances/${instId}/export_playdata/?type=storage&table=${table}&semesters=${semester}&anonymous=${anonymous}`
  return handleRequest(methods.GET, url)
}

export const apiSearchInstances = (input, pageParam = 1, include_deleted = false) => {
	return handleRequest(methods.GET, `/api/instances/?search=${input}&page=${pageParam}&include_deleted=${include_deleted}`)
}

/**
 * Takes an instance ID, a user ID, and optional context ID and returns all scores for the given
 *  user in the given widget instance.
 * @param {string} instId - The ID of the widget instance.
 * @param {int} userId - The ID of the user whose scores are being requested.
 * @param {string} [contextId=null] - Optional context ID to filter score results by.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiGetWidgetInstanceScores = (instId, userId, contextId=null) => {
	const url = `/api/scores/?inst_id=${instId}&user=${userId}${contextId != null ? '&context=' + contextId : ''}`
	return handleRequest(methods.GET, url)
}

/**
 * Takes a play ID and returns an object containing score details, varied by widget.
 * @param {string} playId - The ID of the play to look up a score for.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiGetWidgetInstancePlayScores = (playId) => {
	return handleRequest(methods.GET, `/api/scores/details/?play_id=${playId}`)
}

/**
 * Takes a preview play ID and a widget instance ID, and returns an object containing the preview's score details, varied by widget.
 * @param {string} playId - The ID of the widget instance play to look up a score for.
 * @param {string} previewInstId - The instance ID of the widget instance being previewed.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiGetWidgetInstancePreviewScores = (playId, previewInstId) => {
	return handleRequest(methods.GET, `/api/scores/details/?play_id=${playId}&preview_inst_id=${previewInstId}`)
}

/**
 * Takes a widget instance ID, and returns a summary of scores submitted for that instance separated by semester.
 * @param {string} instId - The ID of the widget instance.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiGetScoreSummary = instId => {
	return handleRequest(methods.GET, `/api/instances/${instId}/performance/`)
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
			semester.graphData = semester.distribution?.length ? semester.distribution?.map((d, i) => ({ label: ranges[i], value: d })) : null
			semester.totalScores = semester.distribution?.length ? semester.distribution?.reduce((total, count) => total + count) : 0
		})

		return scores
	})
}

/**
 * Takes a widget instance ID, and returns a summary of scores submitted for that instance separated by semester.
 * @param {string} instId - The ID of the widget instance.
 * @param {string} term - The time of year, typically 'spring', 'summer' or 'fall'.
 * @param {int} year
 * @param {string[]} contexts - A list of strings indicating specific contexts in which to view scores.
 * @param {int} page_number
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiGetPlayLogs = (instId, term, year, contexts, page_number) => {
	const params = new URLSearchParams({
		inst_id: instId, semester: term, year: year, include_user_info: true, page: page_number
	})
	if (contexts != null) params.append('context_ids', contexts.join(','))

	return handleRequest(methods.GET, `/api/play-sessions/?${params}`)
		.then(results => {
			if (!results) return []
			if (results.count === 0) return []

			const scoresByUser = new Map()
			results.results.forEach(log => {
				let scoresForUser

				const userId = log.user_id ?? 0
				const isGuest = userId === 0

				const first = log.user?.first_name?.trim() || ""
				const last = log.user?.last_name?.trim() || ""
				const name = isGuest
					? 'All Guests'
					: (first || last ? `${first} ${last}`.trim() : `User ${userId}`)

				if (!scoresByUser.has(userId)) {
					scoresForUser = {
						userId,
						name,
						searchableName: name.toLowerCase(),
						scores: []
					}
					scoresByUser.set(userId, scoresForUser)
				} else {
					scoresForUser = scoresByUser.get(userId)
				}

				scoresForUser.scores.push({
					elapsed: parseInt(log.elapsed, 10) + 's',
					playId: log.id,
					auth: log.auth == 'lti' ? 'lti' : 'web',
					score: log.is_complete === true ? Math.round(parseFloat(log.percent)) + '%' : '---',
					created_at: log.created_at
				})
			})


			const logs = Array.from(scoresByUser, ([name, value]) => value)
			const data = { 'total_num_pages': results.total_pages, pagination: logs }
			return data
		})
}

export const apiGetStorageData = instId => {
	return handleRequest(methods.GET, `/api/storage/?inst_id=${instId}`);
}

/**
 * Takes a widget instance ID, and returns the ID of a newly instantiated play for the current user.
 * @param {string} instId - The ID of the widget instance.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiCreatePlaySession = ({ instId }) => {
	return handleRequest(methods.POST, '/api/play-sessions/', {
		instanceId: instId,
	})
}

/**
 * Takes a widget instance ID and optionally a play ID, and returns the latest question set
 *  for that instance, or the question set that was active for the specified play ID.
 * @param {string} instanceId - The ID of the widget instance.
 * @todo playId is not actually used in the API call.
 * @param {string} [playId=null] - Optional play ID.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiGetQuestionSet = (instanceId, playId = null) => {
	return handleRequest(methods.GET, `/api/instances/${instanceId}/question_sets/?latest=true`)
}

/**
 * If API question set generation is enabled takes pertinent information such as widget ID,
 *  widget instance ID, topic, number of questions, and whether to include images or add
 *  to an existing question set, and returns an AI-generated question set.
 * @param {string} instId - The ID of the widget instance.
 * @param {int} widgetId - The ID of the widget engine.
 * @param {string} topic - The prompt to provide to the AI generating the question set.
 * @param {boolean} includeImages - Whether the generated question set should include images.
 * @param {int} numQuestions - How many questions should be generated.
 * @param {boolean} buildOffExisting - Whether to create a new question set or append to an existing one.
 * @returns {Promise<any>} - Parsed response data.
 */
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

/**
 * Takes a play ID, and evaluates whether the given play is attributed to the current user.
 * @param {string} playId - The ID of the play.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiSessionVerify = (playId) => {
	return handleRequest(methods.GET, `/api/play-sessions/${playId}/verify/`)
	.then(data => {
		return data.valid
	})
}

/**
 * Takes a play ID, and a list of storage log objects to save.
 * @param {string} playId - The ID of the play.
 * @param {Object[]} logs - Array of storage logs, arbitrary format.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiSavePlayStorage = ({ play_id, logs }) => {
  return handleRequest(
    methods.POST,
    '/api/storage/',
    {
      "play_id": play_id,
      "logs": logs
    },
  )
}

/**
 * Takes a request object representing a play log.
 * @param {Object} request - Play log object.
 * @param {int} request.playId - The ID of the play.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiSavePlayLogs = ({ request }) => {
	return handleRequest(methods.PUT, `/api/play-sessions/${request.playId}/`, { ...request })
}

export const apiPlayResubmit = (play_id) => {
	return handleRequest(methods.POST, `/api/play-sessions/${play_id}/resubmit/`)
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

/**
 * Takes an object representing a User instance, sends it to the backend to synchronize changes.
 * @param {Object} user
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiUpdateUser = (user) => {
	return handleRequest(methods.PATCH, `/api/users/${user.id}/`, user)
}

/** Controller_Api_Instance */

/**
 * Takes an instance ID, returns an array with all question set revisions.
 * @param {string} instId - The ID of the widget instance.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiGetQuestionSetHistory = (instId) => {
	return handleRequest('GET', `/api/instances/${instId}/question_sets/`)
}

/** Controller_Api_Admin **/

// User Extra Attempts
/**
 * Takes an instance ID, returns an array with all active UserExtraAttempts records
 *  attributed to that widget instance.
 * @param {string} instId - The ID of the widget instance.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiGetExtraAttempts = instId => {
	return handleRequest(methods.GET, `/api/extra-attempts/?instance=${instId}&semester=current`)
}

/**
 * Takes an object representing a UserExtraAttempts record ID, returns update success status.
 * @param {Object} attempt - UserExtraAttempts object.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiUpdateExtraAttempts = (attempt) => {
  return handleRequest(methods.PUT, `/api/extra-attempts/${attempt.id}/`, attempt)
}

/**
 * Takes a UserExtraAttempts record ID, returns deletion success status.
 * @param {int} attempt - The widget engine ID.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiCreateExtraAttempts = (attempt) => {
  return handleRequest(methods.POST, `/api/extra-attempts/`, attempt)
}

/**
 * Takes a UserExtraAttempts record ID, returns deletion success status.
 * @param {int} extraAttemptsId - The widget engine ID.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiDeleteExtraAttempts = (extraAttemptsId) => {
  return handleRequest(methods.DELETE, `/api/extra-attempts/${extraAttemptsId}/`)
}

/**
 * Takes an object representing a widget engine, returns success or failure.
 * @param {Object} widget
 * @param {int} widget.id - The widget engine ID.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiUpdateWidgetEngine = widget => {
	return handleRequest(methods.PATCH, `/api/widgets/${widget.id}/`, widget)
}

/**
 * Takes an array of file uploads to pass to the backend, returns an array
 *  indicating upload successes.
 * @param {Object[]} files - An array of file uploads.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiUploadWidgets = (files) => {
	const formData = new FormData()

	Array.from(files).forEach(file => {
		formData.append('files[]', file, file.name)
	})

	return handleRequest(methods.POST, `/api/widgets/upload/`, {}, { headers: { 'X-CSRFToken': getCSRFToken(), }, body: formData })
}

/**
 * Takes an instance ID, reverses the deletion of the given widget instance.
 * @param {string} instId - The widget instance ID.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiUnDeleteWidget = ({ instId }) => {
	return handleRequest(methods.POST, `/api/instances/${instId}/undelete/`)
}

/**
 * Takes a question generation prompt, returns an object containing AI-generated
 *  questions.
 * @param {string} prompt
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiWidgetPromptGenerate = (prompt) => {
	return handleRequest(methods.POST, `/api/generate/from_prompt/`, {prompt})
}

/**
 * Takes a widget ID, returns whether an update is available and what version
 *  is new when applicable
 * @param {int} widgetId
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiCheckWidgetForUpdate = (widgetId) => {
	return handleRequest(methods.GET, `/api/widgets/${widgetId}/check_update/`)
}

/**
 * Returns success status after the backend updates the widget with the given ID.
 * @param {int} widgetId
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiInstallWidgetUpdate = (widgetId) => {
	return handleRequest(methods.GET, `/api/widgets/${widgetId}/update_to_latest_version/`)
}

/**
 * Returns an array of objects corresponding to widgets that need to be updated.
 * @returns {Promise<any>} - Parsed response data.
 */
export const apiCheckAllWidgetsForUpdates = () => {
	return handleRequest(methods.GET, `/api/widgets/check_updates/`)
}

/**
 * Forwards a username and password to the backend for logins bypassing standard authentication.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<any>} - Parsed response data.
 */
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
