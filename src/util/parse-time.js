const parseTime = (time) => {
	const timeObj = new Date(time * 1000)
	let amPm = 'am'
	let hour = timeObj.getHours()
	let minute = timeObj.getMinutes()

	if (minute < 10) {
		minute = `0${minute}`
	}

	if (hour > 11) {
		if (hour !== 12) {
			hour -= 12
		}
		amPm = 'pm'
	} else {
		if (hour === 0) {
			hour = '12'
		}
	}

	return `${hour}:${minute}${amPm}`
}

export default parseTime