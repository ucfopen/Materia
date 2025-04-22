const parseObjectToDateString = time => {
	const timeObj = new Date(time)
	const year = String(timeObj.getFullYear())
	return timeObj.getMonth() + 1 + '/' + timeObj.getDate() + '/' + year.substr(2)
}

export default parseObjectToDateString
