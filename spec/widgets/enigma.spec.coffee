client = {}

describe 'Testing framework', ->
	it 'should load widget', (done) ->
		require('./widgets.coffee') 'enigma', ->
			client = this
			done()
	, 15000

describe 'Main page', ->
	it 'should have a title', (done) ->
		client
			.getText '.header h1 span', (err, text) ->
				expect(err).toBeNull()
				expect(text).toContain("TV Show Trivia")
				done()

	it 'should have three categories', (done) ->
		client
			.getText '.category .title', (err, text) ->
				expect(err).toBeNull()
				expect(text).toContain("Animated TV")
			.getText '.category:nth-child(2) .title', (err, text) ->
				expect(err).toBeNull()
				expect(text).toContain("Sitcoms")
			.getText '.category:nth-child(3) .title', (err, text) ->
				expect(err).toBeNull()
				expect(text).toContain("Game Shows")
			.call(done)

	it 'should have nine questions', (done) ->
		client
			.execute 'return $(".question").length;', null, (err, result) ->
				expect(err).toBeNull()
				expect(result.value).toBe(9)
			.call(done)

	it 'should show a popup when question is clicked', (done) ->
		client
			.execute "$('.question:first').click()", null, (err) ->
				client
					.waitFor '.question-popup.shown h1', 3000
					.getText '.question-popup.shown h1', (err, text) ->
						expect(err).toBeNull()
						expect(text).toContain("QUESTION 1 IN \"ANIMATED TV\"")
					.waitFor '.question-text', 3000
					.getText '.question-text', (err, text) ->
						expect(err).toBeNull()
						expect(text).toContain("The Simpsons takes place in what fictional town?")
						done()

	it 'should be able to choose C', (done) ->
		client
			.execute "$('#answer-2').click()", null, (err) ->
				done()

	it 'should be able to submit final answer', (done) ->
		client
			.execute "$('.menu .submit').click()", null, (err) ->
				client.waitFor '.correct.mark', 3000
				done()

	it 'should be able to close popup', (done) ->
		client
			.execute "$('.menu .return.highlight').click()", null, (err) ->
				done()

	it 'should be able answer all the questions', (done) ->
		i = 1
		f = ->
			client.execute "$('.question:eq(" + i + ")').click()", null, (err) ->
				client.execute "$('#answer-1').click()", null, (err) ->
					client.execute "$('.menu .submit').click()", null, (err) ->
						client.execute "$('.menu .return.highlight').click()", null, (err) ->
							i++
							if i < 10
								f()
							else
								done()
		f()

	it 'should get 33%', (done) ->
		client
			.waitFor '.notice .value', 3000
			.getText '.notice .value', (err, text) ->
				expect(err).toBeNull()
				expect(text).toContain("33")
				done()

	it 'should be able to close widget', (done) ->
		client
			.execute "$('.notice button').click()", null, (err) ->
				done()

describe 'Score page', ->
	it 'should get a 33', (done) ->
		client.pause(2000)
		client.getTitle (err, title) ->
			expect(err).toBeNull()
			expect(title).toBe('Score Results | Materia')
			client
				.waitFor('.overall_score')
				.getText '.overall_score', (err, text) ->
					expect(err).toBeNull()
					expect(text).toBe('33%')
					client.call(done)
					client.end()



