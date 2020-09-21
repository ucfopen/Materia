const app = angular.module('materia')

// Search items for searchText
// items must be an array of objects containing a key: searchCache
// returns array of matched items in items
// supports multiple words in searchText
// searchText word order has no impact on matches

// searchCache: "a slow sloth   walks down a lazy tree path"
// searchText match: "a    path"
// searchText match: "path sloth"
// searchText miss:  "slowsloth"

app.filter('multiword', () => (items, searchText = '') => {
	if (searchText === '') return items

	// split up the items into words
	const splitted = searchText.toLowerCase().split(/\s+/)

	// create a regex that'll match the words with anything between them
	const regexp_and = `(?=.*${splitted.join(')(?=.*')})`
	const re = new RegExp(regexp_and, 'i')

	return items.filter((item) => re.test(item.searchCache))
})
