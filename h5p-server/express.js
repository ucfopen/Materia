const express = require('express')
const H5P = require('h5p-nodejs-library')
const path = require('path')
const bodyParser = require('body-parser')
const cors = require('cors')

const { editorRenderer } = require('./renderers/editor')
const { playerRenderer } = require('./renderers/player')
const { adminRenderer } = require('./renderers/admin')

const app = express()

const port = 3000

function User() {
	this.id = '1'
	this.name = 'Firstname Surname'
	this.canInstallRecommended = true
	this.canUpdateAndInstallLibraries = true
	this.canCreateRestricted = true
	this.type = 'local'
}

let h5pEditor = {}
let h5pPlayer = {}

const setupConfig = (resolve, reject) => {
	new H5P.H5PConfig(
		new H5P.fsImplementations.JsonStorage(
			path.resolve('h5p-config.json')
		)
	).load().then((config) => {
		resolve(config)
	})
}

const setupPlayerAndEditor = (config) => {

	const editor = H5P.fs(
		config,
		path.resolve('h5p/libraries'),
		path.resolve('h5p/temporary-storage'),
		path.resolve('h5p/content')
	)

	const player = new H5P.H5PPlayer(
		editor.libraryStorage,
		editor.contentStorage,
		config
	)
		
	return([editor,player])
}

const setupServer = ([editor,player]) => {

	h5pEditor = editor
	h5pPlayer = player

	setupServerPromise = (resolve, reject) => {

		// unsure if cors is required here
		// app.use(cors())

		app.use(bodyParser.json({ limit: '500mb' }));
		app.use(
			bodyParser.urlencoded({
				extended: true
			})
		);

		// inject user data into request
		// TODO don't just make an arbitrary user object!
		app.use((req, res, next) => {
			req.user = new User()
			next()
		})

		// load custom styles
		app.use('/styles', express.static('styles'))
		
		// RENDERER OVERRIDES
		// ASSUMING DIRECT CONTROL
		h5pEditor.setRenderer(editorRenderer)
		h5pPlayer.setRenderer(playerRenderer)

		app.use(
			h5pEditor.config.baseUrl,
			H5P.adapters.express(
				h5pEditor,
				path.resolve('h5p/core'), // the path on the local disc where the files of the JavaScript client of the player are stored
				path.resolve('h5p/editor'), // the path on the local disc where the files of the JavaScript client of the editor are stored
				undefined,
				'auto' // You can change the language of the editor here by setting
				// the language code you need here. 'auto' means the route will try
				// to use the language detected by the i18next language detector.
			)
		)

		resolve()
	}
	return new Promise(setupServerPromise)
}

(new Promise(setupConfig))
	.then(setupPlayerAndEditor)
	.then(setupServer)
	.then((page) => {
		// TODO clean this up
		app.get('/admin', (req, res) => {
			h5pEditor.setRenderer(adminRenderer)
			h5pEditor.render().then((page) => {
				// will not currently output anything - h5p-hub styling is disabled in the renderer
				res.send(page)
				res.status(200).end()
			})
		})
		
		// create new h5p content of a given type
		app.get('/new/:type', (req, res) => {

			// let contentId = undefined

			// if (req.query.contentId) {
			// 	contentId = req.query.contentId
			// }
			h5pEditor.setRenderer(editorRenderer)

			h5pEditor.render(undefined, 'en').then((page) => {
				res.send(page)
				res.status(200).end()
			})
		})

		app.get('/edit/:type', (req, res) => {

			h5pEditor.setRenderer(editorRenderer)

			h5pEditor.render(undefined, 'en').then((page) => {
				res.send(page)
				res.status(200).end()
			})
		})
		
		// app.get(`${h5pEditor.config.playUrl}/:instanceId`, (req, res) => {
		app.get(`${h5pEditor.config.playUrl}`, (req, res) => {

			// TODO provide h5pPlayer with content id depending on h5P | materia toggle? Is that needed?
			// otherwise, we're looking for req.params.contentId
			const dummyContentId = '999999999'
			
			h5pPlayer.render(dummyContentId).then((h5pPage) => {
				res.send(h5pPage)
				res.status(200).end()
			})
		})

		// return a new h5p widget
		// used for materia to check for specific library
		// should be deprecated as there is no need to save this information on the server
		app.post('/new/:type', (req, res) => {
			h5pEditor.saveOrUpdateContent(
				undefined,
				req.body.params.params,
				req.body.params.metadata,
				req.body.library,
				req.user
			).then((contentId) => {
				//returns contentID of widget for materia to put in the qset
				res.send(JSON.stringify({ contentId }))
				res.status(200).end()
			})
		})

		app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
	})