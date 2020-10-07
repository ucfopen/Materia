describe('hightlight filter', function () {
	var filter
	var _$sce

	beforeEach(() => {
		filter = testGetFilter('highlight')
		inject(function ($sce) {
			_$sce = $sce
		})
	})

	it('exist', () => {
		expect(filter).not.toBeUndefined()
		expect(filter).not.toBeNull()
	})

	it('should wrap matches in highlight span', () => {
		let body = 'this is some text to search for content in'
		let expected = 'this is some text to <span class="highlighted">search</span> for content in'
		let exptectedMulti =
			'<span class="highlighted">this</span> is some text to <span class="highlighted">search</span> for content in'

		expect(_$sce.getTrustedHtml(filter(body, 'search'))).toBe(expected)
		expect(_$sce.getTrustedHtml(filter(body, 'search this'))).toBe(exptectedMulti)
	})

	it('should do nothing with no matches', () => {
		let body = 'this is some text to search for content in'

		expect(_$sce.getTrustedHtml(filter(body, 'qqqq'))).toBe(body)
	})

	it('should do nothing with empty input', () => {
		let body = 'this is some text to search for content in'

		expect(_$sce.getTrustedHtml(filter(body, ''))).toBe(body)
	})

	it('should escape source text', () => {
		let body = 'a <a href="">link</a> here'

		expect(_$sce.getTrustedHtml(filter(body, ''))).toBe(
			'a &lt;a href=&quot;&quot;&gt;link&lt;&#x2F;a&gt; here'
		)
	})
})
