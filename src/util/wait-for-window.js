export const waitForWindow = async (properties) => {
	const checkProperties = (properties) => {
		return properties.every(prop => window.hasOwnProperty(prop))
	}
	
	return new Promise((resolve) => {
		if (checkProperties(properties)) {
			resolve()
			return
		}
		
		const maxAttempts = 20
		let attempts = 0
		
		const interval = setInterval(() => {
			if (checkProperties(properties) || attempts >= maxAttempts) {
				clearInterval(interval)
				resolve()
			}
			attempts++
		}, 500)
	})
}
