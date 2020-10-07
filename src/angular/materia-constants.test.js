describe('materia constants', () => {
	beforeEach(() => {
		require('./materia-constants')
	})

	it('OBJECT_TYPES to contain expected data', () => {
		const ex = {
			QUESTION: 1,
			ASSET: 2,
			WIDGET: 3,
			WIDGET_INSTANCE: 4,
		}

		var _OBJECT_TYPES
		inject([
			'OBJECT_TYPES',
			(OBJECT_TYPES) => {
				_OBJECT_TYPES = OBJECT_TYPES
			},
		])
		expect(_OBJECT_TYPES).toMatchObject(ex)
	})

	it('ACCESS to contain expected data', () => {
		const ex = {
			VISIBLE: 1,
			PLAY: 5,
			SCORE: 10,
			DATA: 15,
			EDIT: 20,
			COPY: 25,
			FULL: 30,
			SHARE: 35,
		}

		var _ACCESS
		inject([
			'ACCESS',
			(ACCESS) => {
				_ACCESS = ACCESS
			},
		])
		expect(_ACCESS).toMatchObject(ex)
	})

	it('PLAYER to contain expected data', () => {
		const ex = {
			LOG_INTERVAL: 10000,
			RETRY_LIMIT: 15,
			RETRY_FAST: 1000,
			RETRY_SLOW: 10000,
			EMBED_TARGET: 'container',
		}

		var _PLAYER
		inject([
			'PLAYER',
			(PLAYER) => {
				_PLAYER = PLAYER
			},
		])
		expect(_PLAYER).toMatchObject(ex)
	})

	it('a missing constant to throw an angular injection error', () => {
		const ex = {}

		var _FAKE
		expect(() => {
			inject([
				'FAKE',
				(FAKE) => {
					_FAKE = FAKE
				},
			])
		}).toThrowError(/\$injector:unpr/)
	})
})
