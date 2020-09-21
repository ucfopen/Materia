Namespace('Materia.Store').SlideShow = (() => {
	let spotlightCount = 0
	let lastSlideTo = 0
	let cycler
	let intervalID

	const formatCycler = (spotlights) => {
		cycler = document.querySelector('.cycler')

		spotlightCount = spotlights.length
		// make a radio button and give the spotlights appropriate ids
		spotlights.forEach((spotlight, i) => {
			let checked = ''
			if (i !== 0) {
				// spotlight.classList.add('hidden')
			} else {
				checked = 'checked="checked"'
			}

			spotlight.setAttribute('id', `spotlight_${i}`)
			spotlight.style.display = ''

			let input = document.createElement('input')
			input.setAttribute('type', 'radio')
			input.setAttribute('name', 'spotlight')
			input.setAttribute('id', `slide_${i}`)
			input.setAttribute('class', 'radio_spotlight')
			input.style.display = 'none'
			input.checked = true
			cycler.appendChild(input)

			let span = document.createElement('span')
			span.setAttribute('id', `spot-span-${i}`)
			span.classList.add('span_next')
			span.dataset.index = i
			if (i === 0) span.classList.add('spotlight_selected')
			span.onclick = (e) => {
				if (e.target.classList.contains('spotlight_selected')) {
					return false
				}
				clearInterval(intervalID)
				const num = e.target.dataset.index
				goToSlide(num)
			}
			cycler.appendChild(span)
		})

		// slide at a set interval
		intervalID = setInterval(() => {
			goToSlide(lastSlideTo + 1)
		}, 12000)
	}

	const goToSlide = (slideNo) => {
		slideNo = parseInt(slideNo, 10)
		if (slideNo >= spotlightCount) {
			slideNo = 0
		}

		const showing = document.querySelector('.store_main.selected')
		const changeTo = document.getElementById(`spotlight_${slideNo}`)

		const showingNum = parseInt(showing.dataset.index, 10)
		lastSlideTo = slideNo

		spotlightSelected(slideNo)

		showing.classList.remove('selected')
		changeTo.classList.add('selected')
	}

	// Cycles thorough the buttons to remove all selected clases, then adds the selected class to the button specified and checks that buttons input.
	const spotlightSelected = (index) => {
		// clear previously selected
		let spans = Array.from(document.querySelectorAll('.spotlight_selected'))
		spans.forEach((s) => {
			s.classList.remove('spotlight_selected')
		})

		// select this one
		let span = document.querySelector(`#spot-span-${index}`)
		let input = document.querySelector(`#slide_${index}`)
		span.classList.add('spotlight_selected')
		input.checked = true
	}

	return { formatCycler }
})()
