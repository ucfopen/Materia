# TODO: rip out redundant methods
app = angular.module 'materia'
app.service 'beardServ', () ->

	beards = ['dusty_full', 'black_chops', 'grey_gandalf', 'red_soul']

	getRandomBeard = ->
		beards[Math.floor(Math.random() * beards.length)]

	getRandomBeard:getRandomBeard

