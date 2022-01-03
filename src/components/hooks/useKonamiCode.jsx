import { useState, useEffect } from 'react';

// Helper function to compare two arrays
const compareArr = (arr1, arr2) => {
	if (arr1.length !== arr2.length) return false
	for (let i = 0; i < arr1.length; i++) {
		if (arr1[i] !== arr2[i]) return false
	}
	return true
}

export default function useKonamiCode() {
	const [validCode, setValidCode] = useState(false)
	const [currentCode, setCurrentCode] = useState([])
	const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]

	// Adds and cleansup event listener
	useEffect(() => {
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [])

	// Detects correct code when code entered changes
	useEffect(() => {
		if (compareArr(currentCode, konamiCode)) setValidCode(true)
		else if (validCode) setValidCode(false)
	}, [currentCode])

	const onKeyDown = (e) => {
		if (konamiCode.includes(e.keyCode)) {
			// Guaruntees non-stale state
			setCurrentCode((oldCode) => {
				const tmpCode = [...oldCode]
				if (oldCode.length >= konamiCode.length) tmpCode.shift()
				tmpCode.push(e.keyCode)
				return tmpCode
			})
		}
		else if (currentCode.length > 0) {
			// Clears the code if an invalid char was used
			setCurrentCode([])
		}
	}

	return validCode
}