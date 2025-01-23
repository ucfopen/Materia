
const fetchPOSTOptions = ({body}) => ({
	'headers': {
		'cache-control': 'no-cache',
		'pragma': 'no-cache',
		'content-type': 'application/json; charset=UTF-8'
	},
	'method': 'POST',
	'mode': 'cors',
	'credentials': 'include',
	body: JSON.stringify(body),
})

export default fetchPOSTOptions
