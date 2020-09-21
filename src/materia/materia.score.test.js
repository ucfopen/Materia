describe('Materia.Score', () => {
	let Score
	let mockAddLog

	beforeEach(() => {
		require('../common/materia-namespace')
		require('./materia.score')
		Score = Materia.Score
		Namespace('Materia.Engine').addLog = mockAddLog = jest.fn()
	})

	it('defines expected public methods', () => {
		expect(Score.submitInteractionForScoring).toBeDefined()
		expect(Score.submitFinalScoreFromClient).toBeDefined()
		expect(Score.submitQuestionForScoring).toBeDefined()
		expect(Score.submitScoreForParticipation).toBeDefined()
		expect(Score.addGlobalScoreFeedback).toBeDefined()
		expect(Score.addScoreData).toBeDefined()
	})

	it('addScoreData calls addLog', () => {
		Score.addScoreData(['data'])
		expect(mockAddLog).toHaveBeenLastCalledWith(2000, null, '["data"]', null)
	})

	it('addGlobalScoreFeedback calls addLog', () => {
		Score.addGlobalScoreFeedback('my message')
		expect(mockAddLog).toHaveBeenLastCalledWith(1008, '0', 'my message')
	})

	it('submitScoreForParticipation calls addLog', () => {
		Score.submitScoreForParticipation()
		expect(mockAddLog).toHaveBeenLastCalledWith(1006, -1, 'Participation', 100)
	})

	it('submitQuestionForScoring calls addLog', () => {
		Score.submitQuestionForScoring(6, 'answer', 'optional value')
		expect(mockAddLog).toHaveBeenLastCalledWith(1004, 6, 'answer', 'optional value')
	})

	it('submitFinalScoreFromClient calls addLog', () => {
		Score.submitFinalScoreFromClient(90, 'answer', 100)
		expect(mockAddLog).toHaveBeenLastCalledWith(1002, 90, 'answer', 100)
	})

	it('submitInteractionForScoring calls addLog', () => {
		Score.submitInteractionForScoring(44, 'interaction', 'value')
		expect(mockAddLog).toHaveBeenLastCalledWith(1001, 44, 'interaction', 'value')
	})
})
