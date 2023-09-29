import React, { useState, useEffect, useMemo, useRef } from 'react'
import useInstanceList from '../hooks/useInstanceList'
import LoadingIcon from '../loading-icon';

const SelectItem = () => {
	const [strHeader, setStrHeader] = useState('Select a Widget:');
	const [selectedInstance, setSelectedInstance] = useState(null);
	const [searchText, setSearchText] = useState('')
	const [easterMode, setEasterMode] = useState(false)
	const [showRefreshArrow, setShowRefreshArrow] = useState(false)
	const [displayState, setDisplayState] = useState('selectInstance')
	const fillRef = useRef(null)
	const [progressComplete, setProgressComplete] = useState(false)

	const instanceList = useInstanceList()

	useEffect(() => {
		if (window.SYSTEM) {
			setStrHeader(`Select a Widget for use in ${window.SYSTEM}:`)
		}
	}, [window.SYSTEM])

	const hiddenSet = useMemo(() => {
		const result = new Set()
		if(searchText == '') return result

		const re = RegExp(searchText, 'i')
		if (instanceList.instances && instanceList.instances.length > 0)
			instanceList.instances.forEach(i => {
				if(!re.test(`${i.name} ${i.widget.name} ${i.id}`)){
					result.add(i.id)
				}
			})

		return result
	}, [searchText, instanceList.instances])

	const handleChange = (e) => {
		setSearchText(e.target.value)
	}

	const refreshListing = () => {
		instanceList.refresh()
		setShowRefreshArrow(false)
	}

	const cancelProgress = () => {
		setDisplayState('selectInstance')
		setSelectedInstance(null)
	}

	const embedInstance = (instance) => {
		setDisplayState('progress')
		setSelectedInstance(instance)
	}

	useEffect(() => {
		// End progress bar
		if (progressComplete && !!selectedInstance) {
			let pg = document.querySelector('.progress-container')
			let pgSpan = document.querySelector('.progress-container span')
			pg.classList.add('success')
			pgSpan.innerText = 'Success!'

			if (JSON.stringify && parent.postMessage) {
				parent.postMessage(JSON.stringify(selectedInstance), '*')
			}

			if (!!window.RETURN_URL) {
				// add a ? or & depending on window.RETURN_URL already containing query params
				const separator = window.RETURN_URL.includes('?') ? '&' : '?'
				// encode the url
				const url = encodeURI(selectedInstance.embed_url)
				// redirect the client to the return url with our new variables
				window.location = `${window.RETURN_URL}${separator}embed_type=basic_lti&url=${url}`
			}
		}
		// Start progress bar
		else if (!!selectedInstance) {

			const easterModeListener = document.addEventListener('keyup', (event) => {
				if (event.key == 'Shift') {
					setEasterMode(true)
				}
			})

			let stops = []
			let total = 0
			let stop = 0;

			// Create random stop points, each greater than the previous
			while (total < 100) {
				stop = Math.random() * 10 + stop
				stops.push(stop + total)
				total += stop
			}
			stops[stops.length - 1] -= (total - 100);

			let i = 0;

			// Progress bar increments every half second
			const fillInterval = setInterval(() => {
				fillRef.current.style.width = `${stops[i++]}%`
				if (i == stops.length) {
					clearInterval(fillInterval)
					fillRef.current.style.width = '100%'
					setProgressComplete(true)
				}
			}, 500)

			return () => {
				clearInterval(fillInterval);
				document.removeEventListener("keyup", easterModeListener)
			};
		}
	}, [selectedInstance, progressComplete])

	let instanceListRender = null
	if (instanceList.instances && instanceList.instances.length > 0) {
		if (hiddenSet.size >= instanceList.instances.length) instanceListRender = <p>No widgets match your search.</p>
		else {
			instanceListRender = instanceList.instances.map((instance, index) => {
				var classList = []
				if (instance.is_draft) classList.push('draft')
				if (instance.selected) classList.push('selected')
				if (instance.guest_access) classList.push('guest')
				if (hiddenSet.has(instance.id)) classList.push('hidden')

				return <li className={classList.join(' ')} key={index}>
					<div className={`widget-info ${instance.is_draft ? 'draft' : ''} ${instance.guest_access ? 'guest' : ''}`}>
						<img className="widget-icon" src={instance.img}/>
						<h2 className="searchable">{instance.name}</h2>
						<h3 className="searchable">{instance.widget.name}</h3>
						{instance.guest_access ? <h3 className="guest-notice">Guest instances cannot be embedded in courses. </h3> : <></>}
						{instance.is_draft ? <h3 className="draft-notice">You must publish this instance before embedding it.</h3> : <></>}
						{instance.is_draft ? <span className="draft-label">Draft</span> : <></>}
						{instance.guest_access && !instance.is_draft ? <span className="guest-label">Guest</span> : <></>}
					</div>
					<div className="widget-options">
						<a className="preview external" target="_blank" href={instance.preview_url}>Preview</a>
						{
							(instance.guest_access || instance.is_draft) ?
							<a className="action_button embed-button" target="_blank" href={`${BASE_URL}my-widgets/#${instance.id}`}>Edit at Materia</a>
							:
							<a role="button" className={index == 0 ? 'first action_button embed-button' : 'action_button embed-button'} onClick={() => embedInstance(instance)}>Use this widget</a>
						}
					</div>
				</li>
			})
		}
	}

	let noInstanceRender = null
	let createNewInstanceLink = null
	if (instanceList.instances && instanceList.instances.length < 1) {
		noInstanceRender = <div id="no-widgets-container">
			<div id="no-instances">
				<p>You don't have any widgets yet. Click this button to create a widget, then return to this tab/window and select your new widget.</p>
				<a role="button" id="create-widget-button" onClick={() => setShowRefreshArrow(true)} className="external action_button" target="_blank" href={window.BASE_URL + "/widgets"}>Create a widget at Materia</a>
			</div>
		</div>
	} else {
		createNewInstanceLink = <a role="button" id="goto-new-widgets" onClick={() => setShowRefreshArrow(true)} className="external action_button" target="_blank" href={window.BASE_URL + "widgets"}>Or, create a new widget at Materia</a>
	}

	let sectionRender = null
	if (instanceList.isFetching) {
		sectionRender =
		<section id="loading">
			<LoadingIcon size="med" />
		</section>
	} else if (displayState == 'selectInstance' && noInstanceRender == null) {
		sectionRender =
		<section id="select-widget">
			<section className="top-options">
				<div className="search-container">
					<div className='textbox-background'></div>
					<input className='textbox'
						type='text'
						value={searchText}
						onChange={handleChange}
					/>
					<div className='search-icon'>
						<svg viewBox='0 0 250.313 250.313'>
							<path d='m244.19 214.6l-54.379-54.378c-0.289-0.289-0.628-0.491-0.93-0.76 10.7-16.231 16.945-35.66 16.945-56.554 0-56.837-46.075-102.91-102.91-102.91s-102.91 46.075-102.91 102.91c0 56.835 46.074 102.91 102.91 102.91 20.895 0 40.323-6.245 56.554-16.945 0.269 0.301 0.47 0.64 0.759 0.929l54.38 54.38c8.169 8.168 21.413 8.168 29.583 0 8.168-8.169 8.168-21.413 0-29.582zm-141.28-44.458c-37.134 0-67.236-30.102-67.236-67.235 0-37.134 30.103-67.236 67.236-67.236 37.132 0 67.235 30.103 67.235 67.236s-30.103 67.235-67.235 67.235z'
								clipRule='evenodd'
								fillRule='evenodd'/>
						</svg>
					</div>
				</div>
				<button id="refresh" onClick={refreshListing} className="action_button">Refresh listing</button>
			</section>
			<div id="list-container">
				<ul>
					{instanceListRender}
				</ul>
			</div>
			{createNewInstanceLink}
		</section>
	} else if (displayState == 'selectInstance' && noInstanceRender != null) {
		sectionRender =
		<section id="select-widget">
			<section className="top-options">
				<div className="search-container">
					<div className='textbox-background'></div>
					<input className='textbox'
						type='text'
						value={searchText}
						onChange={handleChange}
					/>
					<div className='search-icon'>
						<svg viewBox='0 0 250.313 250.313'>
							<path d='m244.19 214.6l-54.379-54.378c-0.289-0.289-0.628-0.491-0.93-0.76 10.7-16.231 16.945-35.66 16.945-56.554 0-56.837-46.075-102.91-102.91-102.91s-102.91 46.075-102.91 102.91c0 56.835 46.074 102.91 102.91 102.91 20.895 0 40.323-6.245 56.554-16.945 0.269 0.301 0.47 0.64 0.759 0.929l54.38 54.38c8.169 8.168 21.413 8.168 29.583 0 8.168-8.169 8.168-21.413 0-29.582zm-141.28-44.458c-37.134 0-67.236-30.102-67.236-67.235 0-37.134 30.103-67.236 67.236-67.236 37.132 0 67.235 30.103 67.235 67.236s-30.103 67.235-67.235 67.235z'
								clipRule='evenodd'
								fillRule='evenodd'/>
						</svg>
					</div>
				</div>
				<button id="refresh" onClick={refreshListing} className="action_button">Refresh listing</button>
			</section>
			{noInstanceRender}
		</section>
	} else if (displayState == 'progress') {
		sectionRender = <section id="progress">
			<div className="widget-info">
				<h1>{selectedInstance.name}</h1>
				<img className="widget-icon" src={selectedInstance.img}/>
			</div>
			<div className="progress-container">
				<span>{!easterMode ? "Connecting your instance..." : "Reticulating splines..."}</span>
				<div className="progressbar">
					<div className="fill" ref={fillRef}></div>
				</div>
			</div>

			<button className="action_button cancel-button" onClick={cancelProgress}>Cancel Changing Widget</button>
		</section>
	}

	let refreshArrow = null
	if (showRefreshArrow) refreshArrow = <div className="qtip right lti">Click to see your new widget</div>

	return (
		<div id="lti-select-wrapper">
			<header>
				<h1>{strHeader}</h1>
				<div id="logo"></div>
			</header>
			{sectionRender}
			{refreshArrow}
		</div>
	)
}

export default SelectItem
