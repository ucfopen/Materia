const app = angular.module('materia')

const entityMap = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
	'/': '&#x2F;',
}

const escapeHtml = (string) => String(string).replace(/[&<>"'\/]/g, (s) => entityMap[s])

// Highlights search matches, used on My Widgets sidebar
app.filter('highlight', function ($sce) {
	return (text, search) => {
		// escape special characters from the source text
		text = escapeHtml(text)
		if (search) {
			const searchTerms = search.split(' ')
			searchTerms.forEach((term) => {
				// find term in text and wrap it with a span
				text = text.replace(new RegExp(`${term}`, 'gi'), (match, offset) => {
					// @TODO: no comments left for this by previous dev
					// not sure it's purpose
					// sort of looks like it's trying to prevent accidentally
					// nesting spans or overlapping html tags?
					// I haven't been able to get it to enter this condition
					const t = text.substr(offset).split('<')
					if (t[0].indexOf('>') !== -1) {
						return term
					}
					return `<span class="highlighted">${term}</span>`
				})
			})
		}
		return $sce.trustAsHtml(text)
	}
})
