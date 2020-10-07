describe('MediaImportCtrl', function () {
	var setGatewayMock
	var sendMock
	var postMock
	var getMock
	var thenMock
	var $controller
	var $window
	var mockPlease
	var $timeout

	//create an object roughly matching an asset returned by the API
	var createAssetObject = (idNumber, title, type = null, remote_asset = false, status = null) => {
		let idString = '00000'.slice(0, -1 * ('' + idNumber).length) + idNumber
		let fileType = type ? type : title.split('.').pop()
		return {
			created_at: '1500000000',
			file_size: '1000',
			id: idString,
			remote_url: remote_asset ? idString + '.' + fileType : null,
			status: status,
			title: title,
			type: fileType,
		}
	}

	const XHR = {
		open: jest.fn(),
		send: jest.fn(),
		setRequestHeader: jest.fn(),
	}

	XMLHttpRequest = jest.fn().mockImplementation(() => XHR)

	var useAssets
	var defaultAssets = [
		createAssetObject(1, 'audio1.mp3'),
		createAssetObject(2, 'audio2.ogg'),
		createAssetObject(3, 'image1.png'),
		createAssetObject(4, 'image2.jpg'),
		createAssetObject(5, 'image3.jpg'),
		createAssetObject(6, 'invalid1.exe'),
		createAssetObject(7, 'image4.gif'),
		// used to test names w/o extensions
		createAssetObject(8, 'valid image without extension in title', 'jpg'),
	]

	beforeEach(() => {
		mockPlease = { $apply: jest.fn() }
		let app = angular.module('materia')
		app.factory('Please', () => mockPlease)

		// MOCK $window
		$window = {
			addEventListener: jest.fn(),
			location: {
				reload: jest.fn(),
				hash: {
					substring: jest.fn(),
				},
			},
			parent: {
				postMessage: jest.fn(),
			},
		}
		app.factory('$window', () => $window)

		require('../common/materia-namespace')
		require('../common/materia-constants')
		require('./ctrl-media-import')

		global.MEDIA_UPLOAD_URL = 'https://mediauploadurl.com'
		global.MEDIA_URL = 'https://mediaurl.com'

		inject((_$controller_, _$timeout_) => {
			$controller = _$controller_
			$timeout = _$timeout_
		})

		Namespace('Materia.Coms.Json').setGateway = setGatewayMock = jest.fn()
		Namespace('Materia.Coms.Json').send = sendMock = jest.fn().mockImplementation((target) => {
			switch (target) {
				case 'assets_get':
					return {
						then: jest.fn().mockImplementation((callback) => {
							callback(useAssets)
						}),
					}
				default:
					break
			}
		})
		Namespace('Materia.Coms.Json').post = postMock = jest.fn()
		Namespace('Materia.Coms.Json').get = getMock = jest.fn()

		Namespace('Materia.Creator').onMediaImportComplete = jest.fn()

		useAssets = []

		XHR.open.mockReset()
		XHR.send.mockReset()
	})

	it('reacts to users not having any assets', () => {
		$window.location.hash.substring.mockReturnValueOnce('image')

		var $scope = {
			$apply: jest.fn(),
		}

		var controller = $controller('MediaImportCtrl', { $scope })

		expect($scope.displayFiles).toHaveLength(0)
	})

	it('grabs a list of valid image assets', () => {
		useAssets = defaultAssets

		$window.location.hash.substring.mockReturnValue('image')

		var $scope = {
			$apply: jest.fn(),
		}

		var controller = $controller('MediaImportCtrl', { $scope })
		$timeout.flush()
		expect($scope.displayFiles).toHaveLength(5)
		expect($scope.displayFiles).toMatchSnapshot()
	})

	it('ignores unexpected filetypes', () => {
		useAssets = [createAssetObject(1, 'file1.unk'), createAssetObject(2, 'image1.png')]

		$window.location.hash.substring.mockReturnValueOnce('png,unk')

		var $scope = {
			$apply: jest.fn(),
		}

		var controller = $controller('MediaImportCtrl', { $scope })
		$timeout.flush()
		expect($scope.displayFiles).toHaveLength(1)
	})

	it('ignores remote assets that were not successfully migrated', () => {
		useAssets = [
			createAssetObject(1, 'image1.png', null, true),
			createAssetObject(2, 'image2.png', null, true, 'migrated_asset'),
		]

		$window.location.hash.substring.mockReturnValueOnce('image')

		var $scope = {
			$apply: jest.fn(),
		}

		var controller = $controller('MediaImportCtrl', { $scope })
		$timeout.flush()
		expect($scope.displayFiles).toHaveLength(1)
	})

	it('should generate thumbnail urls correctly', () => {
		useAssets = [createAssetObject(1, 'image1.png'), createAssetObject(2, 'audio1.mp3')]
		$window.location.hash.substring.mockReturnValueOnce('image,audio')

		var $scope = {
			$apply: jest.fn(),
		}

		var controller = $controller('MediaImportCtrl', { $scope })
		$timeout.flush()
		//case one - images should be MEDIA_URL/assetid/thumbnail
		expect($scope.displayFiles[0].thumb).toEqual('https://mediaurl.com/00001/thumbnail')
		//case two - audio should always refer to relative asset '/img/audio.png'
		expect($scope.displayFiles[1].thumb).toEqual('/img/audio.png')
	})

	it('announces readyForDirectUpload via postmessage before loading media', () => {
		useAssets = [
			createAssetObject(1, 'image1.png', null, true),
			createAssetObject(2, 'image2.png', null, true, 'migrated_asset'),
		]

		$window.location.hash.substring.mockReturnValueOnce('image')

		var $scope = {
			$apply: jest.fn(),
		}

		var controller = $controller('MediaImportCtrl', { $scope })
		expect($window.parent.postMessage).toHaveBeenCalledTimes(1)
		expect($window.parent.postMessage.mock.calls[0]).toMatchSnapshot()
	})

	it('adds an event listener for postMessage', () => {
		$window.location.hash.substring.mockReturnValueOnce('image')

		var $scope = {
			$apply: jest.fn(),
		}

		var controller = $controller('MediaImportCtrl', { $scope })
		expect($window.addEventListener).toHaveBeenCalledWith('message', expect.any(Function), false)
	})

	it('uploads from post messages', () => {
		$window.location.hash.substring.mockReturnValueOnce('image')

		var $scope = {
			$apply: jest.fn(),
		}

		// mock dom elements when diabling clicks
		jest
			.spyOn(document, 'getElementsByClassName')
			.mockReturnValueOnce([{ setAttribute: jest.fn() }])

		var controller = $controller('MediaImportCtrl', { $scope })
		var _onPostMessage = $window.addEventListener.mock.calls[0][1]

		// send a postmessage
		_onPostMessage({
			data: JSON.stringify({
				name: 'mock-file-name',
				ext: '.png',
				mime: 'image/png',
				src: 'mock-image-data',
			}),
		})

		expect(XHR.open).toHaveBeenCalledTimes(1)
		expect(XHR.open).toHaveBeenCalledWith('POST', 'https://mediauploadurl.com')
		expect(XHR.send).toHaveBeenCalledTimes(1)

		// set the lastMotified date of the file
		const formData = XHR.send.mock.calls[0][0]

		expect(formData.get('name')).toBe('mock-file-name')
		expect(formData.get('Content-Type')).toBe('image/png')
		expect(formData.get('file')).toBeInstanceOf(File)
	})

	it('skips incompatible post messages', () => {
		$window.location.hash.substring.mockReturnValueOnce('image')

		var $scope = {
			$apply: jest.fn(),
		}

		// mock dom elements when diabling clicks
		jest
			.spyOn(document, 'getElementsByClassName')
			.mockReturnValueOnce([{ setAttribute: jest.fn() }])

		var controller = $controller('MediaImportCtrl', { $scope })
		var _onPostMessage = $window.addEventListener.mock.calls[0][1]

		// send a postmessage
		_onPostMessage({
			data: JSON.stringify({
				name: 'mock-file-name',
				ext: '.png',
			}),
		})

		expect(XHR.open).toHaveBeenCalledTimes(0)
		expect(XHR.send).toHaveBeenCalledTimes(0)
	})

	//jest starts malfunctioning in strange ways when it tries interacting with the upload code
	//either it's an us issue or a jest issue, either way it's taking too long to figure out
	//need to pick this back up at some point in the future
	it('should upload files successfully', (done) => {
		$window.location.hash.substring.mockReturnValueOnce('image,audio')

		var $scope = {
			$apply: jest.fn(),
		}

		var controller = $controller('MediaImportCtrl', { $scope })

		//create an approximation of a file for testing
		let uploadFile = new File([''], 'audio1.mp3', {
			type: 'audio/mp3',
			lastModified: new Date(1500000000),
		})

		//normally this would be handled by the browser
		//we can mock an event to approximate this
		//however, for some reason this is different depending on how the file makes it into the browser
		let uploadEvent

		//case one: a file was dropped on the interface
		uploadEvent = {
			target: {
				files: [uploadFile],
			},
		}
		$scope.uploadFile(uploadEvent)

		// some crappy aysnc stuff is happening that we have to wait for
		setTimeout(() => {
			expect(XHR.open).toHaveBeenCalledTimes(1)
			expect(XHR.open).toHaveBeenCalledWith('POST', 'https://mediauploadurl.com')
			expect(XHR.send).toHaveBeenCalledTimes(1)

			const formData = XHR.send.mock.calls[0][0]

			expect(formData.get('name')).toBe('audio1.mp3')
			expect(formData.get('Content-Type')).toBe('audio/mp3')
			expect(formData.get('file')).toBeInstanceOf(File)
			done()
		}, 10)
	})
})
