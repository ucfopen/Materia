client = {}

describe 'Testing framework', ->
	it 'should load widget', (done) ->
		require('./widgets.coffee') 'crossword', ->
			client = this
			done()
	, 25000

crosswordClick = (id) ->
	client.execute "$('" + id + "').click()", null, ->
		# something


crosswordTypeString = (string) ->
	for i in [0...string.length]
		code = string.charCodeAt(i)

		crosswordKeyInput(code)

crosswordKeyInput = (code) ->
	client.execute("var ge = $.Event('keydown'); ge.keyCode = "+code+"; $('#boardinput').trigger(ge)", null, ->

		)

crosswordExpectString = (startx, starty, dir, string, callback) ->
	i = 0

	f = ->
		client.getText "#letter_" + startx + "_" + starty, (err, text) ->
			expect(err).toBeNull()

			if dir
				starty++
			else
				startx++

			if string.charAt(i) != " "
				expect(text).toBe(string.charAt(i))

			i++

			if i == string.length
				callback()
			else
				f()
	f()

crosswordExpectHighlight = (id, callback) ->
	client.getAttribute id, 'class', (err, classes) ->
		expect(err).toBeNull()
		expect(classes).toContain('highlight')
		callback()

describe 'Crossword Player', ->
	it 'should be able to click to select a word', (done) ->
		crosswordClick("#letter_2_4")
		done()

	it 'should highlight the letter we clicked', (done) ->
		crosswordExpectHighlight '#letter_2_4', ->
			done()

	it 'should be able to type eiffel tower', (done) ->
		crosswordTypeString("EIFFELTOWER")
		crosswordExpectString 2, 4, 0, "EIFFEL TOWER", ->
			done()

	it 'should be able to move left with arrow keys', (done) ->
		crosswordKeyInput(37)
		crosswordKeyInput(37)
		crosswordKeyInput(37)
		crosswordKeyInput(37)
		crosswordExpectHighlight '#letter_9_4', ->
			done()

	it 'should be able to type "the white house"', (done) ->
		crosswordTypeString("THEWHITEHOUSE")
		crosswordExpectString 9, 4, 1, "THE WHITE HOUSE", ->
			done()

	it 'should be able to get a hint', (done) ->
		crosswordTypeString("THEWHITEHOUSE")
		crosswordExpectString 9, 4, 1, "THE WHITE HOUSE", ->
			done()
		client.execute "$('#hintbtn_1').click()", null, ->
			client.execute "$('#okbtn').click()", null, ->
				client.getText "#hintspot_1", (err, text) ->
					expect(err).toBeNull()
					expect(text).toContain("They painted it white")
					done()

	it 'should highlight clues when clicked', (done) ->
		client.execute "$('#clue_2').mouseup()", null, ->
			crosswordExpectHighlight '#clue_2', ->
				done()

	it 'should be able to start typing after clicking', (done) ->
		crosswordTypeString("STONEHENGE")
		crosswordExpectString 8, 11, 0, "STONEHENGE", ->
			done()

	it 'should be able to get a free word', (done) ->
		client.execute "$('#clue_3').mouseup()", null, ->
			client.execute "$('#freewordbtn_3').click()", null, ->
				crosswordExpectString 3, 1, 1, "SPHINX", ->
					done()

	it 'should be able to submit', (done) ->
		client.execute "$('#checkBtn').click()", null, ->
			client.execute "$('#okbtn').click()", null, ->
				done()

describe 'Score page', ->
	it 'should get a 73', (done) ->
		client.pause(2000)
		client.getTitle (err, title) ->
			expect(err).toBeNull()
			expect(title).toBe('Score Results | Materia')
			client
				.waitFor('.overall_score')
				.getText '.overall_score', (err, text) ->
					expect(err).toBeNull()
					expect(text).toBe('73%')
					client.call(done)
					client.end()

