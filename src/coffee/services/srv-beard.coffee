# TODO: rip out redundant methods
app = angular.module 'materia'
app.service 'beardServ', () ->

	beards = ['dusty-full', 'black-chops', 'grey-gandalf', 'red-soul']

	getRandomBeard = ->
		beards[Math.floor(Math.random() * beards.length)]

	getRandomBeard:getRandomBeard

