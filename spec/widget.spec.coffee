setup = require('./_setup')

describe 'When I create a widget', ->
	client = null
	beforeEach ->
		client = setup.webdriverjs.remote(setup.webdriverOptions).init()
		# Reset the profile every time
		client
			.url('http://localhost:8080/users/login')
			.setValue('#username', setup.author.username)
			.setValue('#password', setup.author.password)
			.click('form button.action_button')
			.pause(500)
	afterEach (done) -> client.end(done)

	instanceID = null
	title = 'Selenium Test Enigma Widget '+Math.random()
	copyTitle = "#{title} COPY TEST"
	it 'it should update hash url', (done) ->
		client.url('http://localhost:8080/widgets')
			.getTitle (err, title) ->
				expect(err).toBeNull()
				expect(title).toBe('Widget Catalog | Materia')
			.waitFor('.widget.enigma', 7000)
			.moveToObject('.widget.enigma')
			.click('.infocard:hover .header')
			.waitFor('#createLink', 7000)
			.pause 1000
			.click('#createLink')
			.pause 3000
			.getTitle (err, title) ->
				expect(err).toBeNull()
				expect(title).toBe('Create Widget | Materia')
			.waitFor('#container', 7000)
			.frame('container') # switch into widget frame
			.waitFor('.intro.show', 7000)
			.setValue('.intro.show input', title)
			.click('.intro.show input[type=button]')
			.setValue('#category_0', 'Test')
			.pause 500
			.click('.questionholder button.add')
			.pause 500
			.setValue('#question_text', 'Test question')
			.pause 500
			.frame(null) # switch back to main content
			.execute "$('#creatorSaveBtn').click();", null, (err,result) -> true
			.pause 5000
			.execute "return document.location.hash.replace('#', '').replace('/', '');", null, (err, result) ->
				instanceID = result.value
				expect(err).toBeNull()
				expect(instanceID.length).toBe(5)
			.call(done)
	, 55000

	it 'it should appear as a draft', (done) ->
		client
			.call -> expect(instanceID.length).toBe(5)
			.url('http://localhost:8080/my-widgets#'+instanceID)
			.pause(1000)
			.getTitle (err, title) ->
				expect(err).toBeNull()
				expect(title).toBe('My Widgets | Materia')
			.waitFor('#widget_'+instanceID, 7000)
			.getText '#widget_'+instanceID+' .score', (err, mode) ->
				expect(err).toBeNull()
				expect(mode).toBe('Draft')
			.call(done)
	, 22000

	it 'it should appear on my widgets page', (done) ->
		client
			.call -> expect(instanceID.length).toBe(5)
			.url('http://localhost:8080/my-widgets#/'+instanceID)
			.waitFor('#widget_'+instanceID, 7000)
			.pause(1000)
			.getElementCssProperty 'css selector', '.share-widget-container', 'opacity', (err, opacity) ->
				expect(err).toBeNull()
				expect(parseFloat(opacity)).toBeCloseTo(0.5, 2)
			.getElementCssProperty 'id', 'embed_link', 'display', (err, display) ->
				expect(err).toBeNull()
				expect(display).toBe('none')
			.getAttribute '#play_link', 'disabled', 'opacity', (err, disabled) ->
				expect(err).toBeNull()
				expect(disabled).toBe('disabled')
			.getText '#widget_'+instanceID+' .score', (err, mode) ->
				expect(err).toBeNull()
				expect(mode).toBe('Draft')
			.getText '.container .page h1', (err, mode) ->
				expect(err).toBeNull()
				expect(mode).toBe(title)
			.call(done)

	it 'it should be selected on my widgets page', (done) ->
		client
			.call -> expect(instanceID.length).toBe(5)
			.url('http://localhost:8080/my-widgets#/'+instanceID)
			.waitFor('#widget_'+instanceID+'.gameSelected', 7000)
			.call(done)

	copiedInstanceID = null
	it 'it should copy', (done) ->
		client
			.url('http://localhost:8080/my-widgets#/'+instanceID)
			.pause 1900
			.waitFor('#widget_'+instanceID+'.gameSelected', 7000)
			.getText '#widget_'+instanceID+'.gameSelected li.title', (err, selectedTitle) ->
				expect(err).toBeNull()
				expect(selectedTitle).toBe(title)
			.waitFor('#copy_widget_link:not([disabled])', 5000)
			.click('#copy_widget_link')
			.isVisible('.ng-modal-title')
			.getText '.copy .ng-modal-title', (err, text) ->
				expect(err).toBeNull()
				expect(text).toBe('Make a Copy:')
			.setValue('.newtitle', copyTitle)
			.click('.copy_button.action_button')
			# copy shows up in list and selected
			.pause 5000
			.execute "return document.location.hash.replace('#', '').replace('/', '');", null, (err, result) ->
				copiedInstanceID = result.value
				expect(err).toBeNull()
			.getText '.page h1', (err, text) ->
				expect(err).toBeNull()
				expect(text).toBe(copyTitle)
			# copy shows up in main window
			.getText '.widget.gameSelected li.title', (err, text) ->
				expect(err).toBeNull()
				expect(text).toBe(copyTitle)
			.call(done)
	, 45000


	it 'it should display the collaboration dialog with default settings', (done) ->
		client
			.url('http://localhost:8080/my-widgets#/'+copiedInstanceID)
			.waitFor('#widget_'+copiedInstanceID+'.gameSelected', 7000)
			.pause(2000)
			.getText '.share div.link', (err, text) ->
				expect(err).toBeNull()
				expect(text).toBe 'Collaborate'
			.click('.share div.link')

			# make sure default dialog state is correct:
			.waitFor('.share .ng-modal-title', 7000)
			.isVisible('.share')
			.getText '.share .ng-modal-title', (err, text) ->
				expect(err).toBeNull()
				expect(text).toBe('Collaboration:')

			# make sure we have only author in the list with full access and no expiration
			.waitFor('.access_list .user_perm', 7000)
			.execute "return $('.access_list .user_perm').length;", null, (err, result) ->
				expect(err).toBeNull()
				expect(result.value).toBe(1)
			.execute "return $('.access_list .user_perm:first-child .name').html();", null, (err, result) ->
				expect(err).toBeNull()
				expect(result.value).toContain('Prof Author')
			.execute "return $('.access_list .user_perm:first-child select.perm').val();", null, (err, result) ->
				expect(err).toBeNull()
				expect(result.value).toBe('30')
			.execute "return $('.access_list .exp-date').val();", null, (err, result) ->
				expect(err).toBeNull()
				expect(result.value).toBe('Never')
			.call done

	it 'it should allow you to add a collaborator', (done) ->
		client
			.url('http://localhost:8080/my-widgets#/'+copiedInstanceID)
			.waitFor('#widget_'+copiedInstanceID+'.gameSelected', 7000)
			.pause(2000)
			.click('.share div.link')
			.waitFor('.share .ng-modal-title', 7000)

			# now let's add a collaborator
			.setValue('.user_add', 'student')
			.waitFor('.search_match', 7000)
			.click('.search_match')

			# make sure we now have student in the list with view scores access
			.execute "return $('.access_list .user_perm').length;", null, (err, result) ->
				expect(err).toBeNull()
				expect(result.value).toBe(2)
			.execute "return $('.access_list .user_perm:nth-child(2) .name').html();", null, (err, result) ->
				expect(err).toBeNull()
				expect(result.value).toContain('John Student')
			.execute "return $('.access_list .user_perm:nth-child(2) select.perm').val();", null, (err, result) ->
				expect(err).toBeNull()
				expect(result.value).toBe('0')
			.execute "return $('.access_list .exp-date').val();", null, (err, result) ->
				expect(err).toBeNull()
				expect(result.value).toBe('Never')

			# save our changes & make sure the collaboration count updates
			.click '.save_button'
			.pause 1000
			.getText '.share div.link', (err, text) ->
				expect(err).toBeNull()
				expect(text).toBe 'Collaborate (1)'

			# make sure they still show up
			.click '.share div.link'
			.waitFor '.share .ng-modal-title', 7000
			.pause 1000
			.execute "return $('.access_list .user_perm').length;", null, (err, result) ->
				expect(err).toBeNull()
				expect(result.value).toBe(2)
			.call done

	it 'it should allow you to remove a collaborator', (done) ->
		client
			.url('http://localhost:8080/my-widgets#/'+copiedInstanceID)
			.waitFor('#widget_'+copiedInstanceID+'.gameSelected', 7000)
			.pause(2000)
			.click('.share div.link')
			.waitFor('.share .ng-modal-title', 7000)

			# remove them
			.click '.user_perm[data-user-id="3"] .remove'
			.pause 1000
			.click '.save_button'
			.pause 10000
			.getText '.share div.link', (err, text) ->
				expect(err).toBeNull()
				expect(text).toBe 'Collaborate'

			# make sure the user we deleted is gone
			.click '.share div.link'
			.waitFor '.share .ng-modal-title', 7000
			.pause 1000
			.execute "return $('.access_list .user_perm:not(.ng-hide)').length;", null, (err, result) ->
				expect(err).toBeNull()
				expect(result.value).toBe(1)
			.call done

	it 'it should limit your abilities after downgrading your access', (done) ->
		client
			.url('http://localhost:8080/my-widgets#/'+copiedInstanceID)
			.waitFor('#widget_'+copiedInstanceID+'.gameSelected', 7000)
			.pause(2000)
			.click('.share div.link')
			.waitFor('.share .ng-modal-title', 7000)

			# now let's try to lower our access
			.execute "$('.access_list .user_perm:first-child select').get(0).value = 0", null, (err, result) ->
				expect(err).toBeNull()
			.waitFor '.access_list .user_perm:first-child .demote_dialogue', 7000
			.click '.access_list .user_perm:first-child .demote_dialogue .no_button'
			#@TODO - test completing this and make sure features don't work
			.call done

	it 'it remove a widget from my widgets after removing your access', (done) ->
		client
			.url('http://localhost:8080/my-widgets#/'+copiedInstanceID)
			.waitFor('#widget_'+copiedInstanceID+'.gameSelected', 7000)
			.pause(2000)
			.click('.share div.link')
			.waitFor('.share .ng-modal-title', 7000)

			# now let's try to remove our access
			.click '.access_list .user_perm:first-child .remove'
			.waitFor '.access_list .user_perm:first-child .demote_dialogue', 7000
			.click '.access_list .user_perm:first-child .demote_dialogue .yes_button'
			.pause 1000
			.click '.save_button'
			.url 'http://localhost:8080/my-widgets#/' + copiedInstanceID
			.pause 5000
			.execute "return $('#widget_"+copiedInstanceID+"').length;", null, (err, result) ->
				expect(err).toBeNull()
				expect(result.value).toBe(0)
			.call done

	it 'it should delete using the delete button', (done) ->
		client
			.url('http://localhost:8080/my-widgets#/'+instanceID)
			.waitFor('#widget_'+instanceID+'.gameSelected', 5000)
			.pause(2000)
			.click('.controls #delete_widget_link')
			.waitFor('.controls .delete_dialogue', 5000)
			.isVisible('.delete_dialogue')
			.click('.delete_button')
			.pause(2000)
			.execute "return $('#widget_"+instanceID+"').length;", null, (err, result) ->
				expect(err).toBeNull()
				expect(result.value).toBe(0)
			.refresh()
			.waitFor('.widget', 5000)
			.pause(2000)
			.execute "return $('#widget_"+instanceID+"').length;", null, (err, result) ->
				expect(err).toBeNull()
				expect(result.value).toBe(0)
			.pause(1800)
			.isVisible('.error-nowidget')
			.call(done)
	, 25000
