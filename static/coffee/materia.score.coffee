Namespace('Materia').Score = do ->

	# Scoring and Reporting
	WIDGET_INTERACTION_UNSCORED		= 1001 # any (scorable) widget intraction beyond a basic answered question. Includes question adjustments, overall adjustments, etc
	FINAL_SCORE_FROM_CLIENT			= 1002 # a final score from the widget
	QUESTION_ANSWERED_UNSCORED      = 1004 # a basic answered question (e.g., 'what color is the sky?' 'blue')
	SCORE_FEEDBACK                  = 1008 # attaches a feedback message to a question (or game if qid is 0)
	SCORE_ALERT                     = 1009 # shows a popup at the score screen
	DATA                            = 2000

	# Widget interactions are a catch-all category for any (logged) widget activity that isn't
	# categorized as an answered question or final score.
	# It's up to the score module to make sense of the interaction and grade the widget appropriately.
	# Examples include an individual question modifier (hint used, -50%), an overall score modifier (-20% to final score), or more esoteric cases.
	#
	# @param questionID the ID of the question associated with this interaction, if applicable. The score module can ignore it for cases where it doesn't apply.
	# @param interactionType a string identifying what the interaction is, e.g.: 'hint_used', 'attempt_penalty', etc.
	# @param value the value of the interaction, if applicable.

	submitInteractionForScoring = (questionID, interactionType, value) ->
		Materia.Engine.addLog(WIDGET_INTERACTION_UNSCORED, questionID, interactionType, value)

	# A final score submission from the client.
	# In some situations, a widget may not pass back logs for individual questions/interactions, and only pass back a final score.
	# For example, perhaps the widget scores on the client side and only provides the score.
	#
	# @param questionID if the final score is being determined by an individual question, its ID can be used here. Otherwise, just use 0.
	# @param userAnswer if the final score is determined based on a user's answer. Can be an empty string otherwise.
	# @param score the final score to return.

	submitFinalScoreFromClient = (questionID, userAnswer, score) ->
		Materia.Engine.addLog(FINAL_SCORE_FROM_CLIENT, questionID, userAnswer, score)

	# An answered question submission.
	# This is the most basic log type. Used in most ordinary responses for individual questions.
	# @param questionID the ID of the question being answered
	# @param userAnswer the response the user provided. This string is matched against the widget's QSET on the server to determine the correct answer.
	# @param value the value isn't by default used to determine the score of the question, however it can be used to pass an additional value to be used in scoring.

	submitQuestionForScoring = (questionID, userAnswer, value) ->
		Materia.Engine.addLog(QUESTION_ANSWERED_UNSCORED, questionID, userAnswer, value)

	# Adds a message/feedback to the overall score screen

	addGlobalScoreFeedback = (msg) ->
		Materia.Engine.addLog(SCORE_FEEDBACK, '0', msg)

	# @private
	# Throws an error and shows a popup whenever a function is used out of place

	_error = (fn, types) ->
		Materia.Engine.alert('Scoring Error', 'An error has occurred with the scoring of this widget. Please refresh and try again. If the problem persists, notify your instructor or contact an instructional designer.')

		#throw new Error('The function ' + fn + '() can only be used when GR_ScoreType is set to ' + types.join(' or ') + ' in the gs_gameregistry table of the database.<br>GR_ScoreType is currently set to ' + _scoreType() + '. Please set GR_ScoreType to ' + types.join(' or ') + ' in the database or use another function for scoring.')

	addScoreData = (data) ->
		Materia.Engine.addLog(DATA, null, JSON.stringify(data), null)

	submitInteractionForScoring		  : submitInteractionForScoring
	submitFinalScoreFromClient		  : submitFinalScoreFromClient
	submitQuestionForScoring          : submitQuestionForScoring
	addGlobalScoreFeedback            : addGlobalScoreFeedback
	addScoreData                      : addScoreData