setup = require('./_setup')

describe 'Guest Access Feature', ->
	instanceID = null
	title = 'Guest Access Widget'
	client = null
	beforeEach ->
		unless client
			client = setup.getClient()

	it 'should let an instructor create a guest access widget', (done) ->
		setup.loginAt client, setup.author, "#{setup.url}/users/login"
		client.url("#{setup.url}/widgets")
			.moveToObject('.widget.enigma .infocard', 10, 100)
			.click('.infocard:hover .header')
			.pause(5000)
			.click('#createLink')

		setup.testEnigma client, title, true

		client.execute("return document.location.hash.substring(1);").then (result) ->
			instanceID = result.value
			if instanceID.substring(0,1) == "/" then instanceID = instanceID.substring(1)

			expect(instanceID).not.toBeNull()
			expect(instanceID.length).toBe(5)
			client
				.url("#{setup.url}/my-widgets#/"+instanceID)
				.pause(1000)
				.getText '.controls .access-level span', (err, text) ->
					expect(text).toContain('Staff and Students only')
				.click('#edit-availability-button')
				.isVisible('.availability')
				.getText '.availability .ng-modal-title', (err, text) ->
					expect(text).toContain('Settings')
				.getText '.availability #guest-access h3', (err, text) ->
					expect(text).toContain('Access')
				.getText '.availability #guest-access label', (err, text) ->
					expect(text).toContain('Enable Guest Mode')
				.isSelected '.guest-checkbox', (err, isSelected) ->
					unless isSelected then client.click('.guest-checkbox')
				.click('.availability .action_button.save')
				.getText '.controls .access-level span', (err, text) ->
					expect(text).toContain('Anonymous - No Login Required')
				.call(done)

	, 55000

	it 'should let a guest play a guest widget', (done) ->
		client = setup.getClient()
		client.url("#{setup.url}/play/#{instanceID}")
			.frame('container')
			.click('.question.unanswered')
			.click('.answers label')
			.click('.menu .submit')
			.click('.menu .return')
			.click('.notice button')
			.frame(null)
			.pause(1000)
			.getText '#overview-score h1', (err, text) ->
				expect(text).toContain('THIS ATTEMPT SCORE:')
			.call(done)
	, 55000

	it 'should not let a guest preview a guest widget', (done) ->
		client.url("#{setup.url}/preview/#{instanceID}")
			.getText '.detail .logo', (err, text) ->
				expect(text).toContain('Login to preview this widget')
			.end(done)
	, 55000

	it 'should let a student play a guest widget', (done) ->
		# console.log "should let a student play a guest widget"
		client = setup.getClient()
		setup.loginAt client, setup.student, "#{setup.url}/users/login"
		client.url("#{setup.url}/play/#{instanceID}")
			.frame('container')
			.click('.question.unanswered')
			.click('.answers label')
			.click('.menu .submit')
			.click('.menu .return')
			.click('.notice button')
			.frame(null)
			.pause(5000)
			.getText '#overview-score h1', (err, text) ->
				expect(text).toContain('THIS ATTEMPT SCORE:')
			.call(done)
	, 55000

	it 'should not let a student preview a guest widget', (done) ->
		# console.log "should not let a student preview a guest widget"
		client.url("#{setup.url}/preview/#{instanceID}")
			.getText '.no_permission h1', (err, text) ->
				expect(text).toContain('You don\'t have permission to view this page.')
			.end(done)
	, 55000

	it 'should show guests in the student activity individual scores table', (done) ->
		client = setup.getClient()
		setup.loginAt client, setup.author, "#{setup.url}/users/login"
		client
			.click('aside .courses .widget')
			.pause(5000)
			.click('.scores .choices .table')
			.getText '.scores table .listName', (err, text) ->
				expect(text).toContain('Guests')
			.getText '.scores .numeric .players', (err, text) ->
				expect(text).toContain('1')
			.getText '.scores .numeric .score-count', (err, text) ->
				expect(text).toContain('2')
			.call(done)
	, 55000

	it 'should not let a guest play a non-guest widget', (done) ->
		client
			.url("#{setup.url}/my-widgets#/"+instanceID)
			.pause(1000)
			.getText '.controls .access-level span', (err, text) ->
				expect(text).toContain('Anonymous - No Login Required')
			.click('#edit-availability-button')
			.isVisible('.availability')
			.isSelected '.guest-checkbox', (err, isSelected) -> if isSelected then client.click('.guest-checkbox')
			.click('.availability .action_button.save')
			.getText '.controls .access-level span', (err, text) ->
				expect(text).toContain('Staff and Students only')
			.end ->
				client = setup.getClient()
				client.url("#{setup.url}/play/#{instanceID}")
					.getText '.detail .logo', (err, text) ->
						expect(text).toContain('Login to play this widget')
					.end(done)
	, 55000

	it 'should let a student play a non-guest widget', (done) ->
		client = setup.getClient()
		setup.loginAt client, setup.student, "#{setup.url}/users/login"
		client.url("#{setup.url}/play/#{instanceID}")
			.frame('container')
			.click('.question.unanswered')
			.click('.answers label')
			.click('.menu .submit')
			.click('.menu .return')
			.click('.notice button')
			.frame(null)
			.pause(4000)
			.getText '#overview-score h1', (err, text) ->
				expect(text).toContain('ATTEMPT 1 SCORE:')
			.end(done)
	, 55000

	it 'should show students in the scores when not on guest mode', (done) ->
		client = setup.getClient()
		setup.loginAt client, setup.author, "#{setup.url}/users/login"
		client
			.click('aside .courses .widget')
			.pause(5000)
			.click('.scores .choices .table')
			.getText '.scores table .listName', (err, text) ->
				expect(text).toContain('Guests')
			.getText '.scores .numeric .players', (err, text) ->
				expect(text).toContain('2')
			.getText '.scores .numeric .score-count', (err, text) ->
				expect(text).toContain('3')
			.end(done)
	, 55000

