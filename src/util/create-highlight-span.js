const entityMap = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
	'/': '&#x2F;',
	'(': '&#40;',
	')': '&#41;',
	'[': '&#91;',
	']': '&#93;',
}

const escapeHtml = string => String(string).replace(/[&<>()[\]"'\/]/g, (s) => entityMap[s])

const createHighlightSpan = (text, search) => {
	text = escapeHtml(text)
	text = text.replace(new RegExp(`${search}`, 'gi'), (match, offset) => {
		return `<span class='highlighted'>${match}</span>`
	})

	return text
}

export default createHighlightSpan
