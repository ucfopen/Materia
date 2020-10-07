const app = angular.module('materia')
app.service('UserServ', function ($q, $rootScope) {
	let _me = null
	let _user = null

	// used for reducing overly repetitive valid session checks
	let validLastCheck = 0
	let validLastValue = null
	const threshold = 10 * 1000

	const buildUser = (name, avatar, loggedIn, role, notify) => {
		if (name == null) {
			name = ''
		}
		if (avatar == null) {
			avatar = ''
		}
		if (loggedIn == null) {
			loggedIn = false
		}
		if (role == null) {
			role = 'Student'
		}
		if (notify == null) {
			notify = false
		}
		return {
			name,
			avatar,
			loggedIn,
			role,
			notify,
		}
	}

	const getCurrentUserFromDom = () => {
		const user = document.getElementById('current-user')
		const userData = {
			name: user.getAttribute('data-name'),
			avatar: user.getAttribute('data-avatar'),
			loggedIn: user.getAttribute('data-logged-in'),
			role: user.getAttribute('data-role'),
			notify: user.getAttribute('data-notify'),
		}
		return buildUser(
			userData.name,
			userData.avatar,
			userData.loggedIn === 'true',
			userData.role,
			userData.notify === 'true'
		)
	}

	const getAvatar = (user, size) => {
		if (size == null) {
			size = 24
		}
		return user.avatar.replace(/s=\d+/, `s=${size}`).replace(/size=\d+x\d+/, `size=${size}x${size}`)
	}

	const updateSettings = (property, value) => (_me[property] = value)

	const getCurrentUser = (from = 'dom') => {
		if (_me == null) {
			switch (from) {
				case 'dom':
					_me = getCurrentUserFromDom()
					break
				default:
					_me = buildUser()
			}
		}
		return _me
	}

	const getCurrentUserAvatar = (size) => {
		if (size == null) {
			size = 24
		}
		return getAvatar(_me, size)
	}

	const get = () => {
		const deferred = $q.defer()

		if (!_user) {
			deferred.resolve(_getCurrentUserFromAPI())
		} else {
			deferred.resolve(_user)
		}

		return deferred.promise
	}

	const set = (userToSet) => {
		_user = userToSet
		return $rootScope.$broadcast('user.update')
	}

	// @TODO this needs to return a promise
	var _getCurrentUserFromAPI = () => {
		const deferred = $q.defer()

		Materia.User.getCurrentUser((user) => {
			set(user)
			deferred.resolve(_user)
		})

		return deferred.promise
	}

	const checkValidSession = (role) => {
		const deferred = $q.defer()

		let now = new Date().getTime()
		if (validLastValue && now - validLastCheck < threshold) {
			deferred.resolve(validLastValue)
		} else {
			Materia.Coms.Json.send('session_author_verify', [role]).then((data) => {
				validLastCheck = now
				validLastValue = data
				deferred.resolve(data)
			})
		}

		return deferred.promise
	}

	// return public method references
	return {
		getCurrentUser,
		getCurrentUserAvatar,
		getAvatar,
		updateSettings,
		get,
		set,
		checkValidSession,
	}
})
