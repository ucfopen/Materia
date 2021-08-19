
const fetchOptions = ({body}) => ({
	headers: {
		pragma: 'no-cache',
		'cache-control': 'no-cache',
		'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
	},
	method: 'POST',
	mode: 'cors',
	credentials: 'include',
	body
})

export default fetchOptions