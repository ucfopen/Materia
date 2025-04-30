import {getCSRFToken} from "./api";

const fetchWriteOptions = (method, {body = {}} = {}) => ({
	'headers': {
		'cache-control': 'no-cache',
		'pragma': 'no-cache',
		'content-type': 'application/json; charset=UTF-8',
		'X-CSRFToken': getCSRFToken(),
	},
	'method': method,
	'mode': 'cors',
	'credentials': 'include',
	body: JSON.stringify(body ?? {}),
})

export default fetchWriteOptions
