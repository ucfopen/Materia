app = angular.module 'materia'

entityMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': '&quot;',
	"'": '&#39;',
	"/": '&#x2F;'
}

escapeHtml = (string) -> String(string).replace /[&<>"'\/]/g, (s) -> entityMap[s]

# Highlights search matches, used on My Widgets sidebar
app.filter 'highlight', ($sce) ->
	return (text, search) ->
		text = escapeHtml text
		if search
			searchTerms = search.split(" ")
			for search in searchTerms
				text = text.replace(new RegExp('(' + search + ')', 'gi'), (a, b, c, d) ->
					t = d.substr(c).split("<")
					if t[0].indexOf(">") != -1
						return a
					return '<span class="highlighted">' + a + '</span>'
				)
		return $sce.trustAsHtml(text)

app.filter 'multiword', ->
	return (input, searchText, AND_OR) ->
		searchText = searchText or ''
		returnArray = []

		splitted = searchText.toLowerCase().split /\s+/
		regexp_and = "(?=.*" + splitted.join(")(?=.*") + ")"
		regexp_or = searchText.toLowerCase().replace(/\s+/g, "|")
		re = new RegExp (if AND_OR == "AND" then regexp_and else regexp_or), "i"

		for x in [0...input.length]
			if re.test(input[x].searchCache) or searchText == ''
				returnArray.push(input[x])

		returnArray

