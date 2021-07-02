import React, { useState, useEffect, useRef } from 'react'
import WidgetPlayer from './widget-player'
import windowSize from './hooks/useWindowSize'
import { WIDGET_URL } from './materia-constants'
import useCreatePlaySession from './hooks/useCreatePlaySession'

const screenshotUrl = (widgetDir, size) =>
	WIDGET_URL + widgetDir + 'img/screen-shots/' + size + '.png'

const screenshotThumbUrl = (widgetDir, size) =>
	WIDGET_URL + widgetDir + 'img/screen-shots/' + size + '-thumb.png'

const initScreenshotData = () => {
	return({
		screenshots: [],
		numScreenshots: 0
	})
}

const initSelectionData = () => {
	return ({
		selectedImage: {
			num: 0,
			reset: false
		},
		mouseData: {
			mouseDown: false,
			xPos: 0,
			yPos: 0,
			offset: 0
		}
	})
}

const initDemoData = () => {
	return({
		demoLoading: false,
		showDemoCover: true,
		demoHeight: '',
		demoWidth: '',
		playId: null
	})
}

const getVelocity = (newPos, oldPos, time) => {
	const timeEnd = (new Date()).getTime()
	const timeDiff = Math.max(0.01, (timeEnd - time)/1000)
	return((newPos-oldPos)/timeDiff)
}

const DetailCarousel = ({widget, widgetHeight=''}) => {
	const [selectionData, setSelectionData] = useState(initSelectionData())
	const [screenshotData, setScreenshotData] = useState(initScreenshotData())
	const [demoData, setDemoData] = useState(initDemoData())
	const picScrollerRef = useRef(null)
	const [windowWidth] = windowSize()
	const createPlaySession = useCreatePlaySession()
	
	// Automatically adjusts screenshots based on window resize
	useEffect(() => {
		if (windowWidth !== 0) {
			snapToImage(true)
		}
	}, [windowWidth])

	// Gets the screenshots from the widget
	useEffect(() => {
		if (widget.meta_data) {
			const _numScreenshots = ~~widget.meta_data?.num_screenshots || 3
			const _screenShots = []

			for (let i = 1; i <= _numScreenshots; i++) {
				_screenShots.push({
					full: screenshotUrl(widget.dir, i),
					thumb: screenshotThumbUrl(widget.dir, i),
				})
			}

			setScreenshotData({
				numScreenshots: _numScreenshots,
				screenshots: _screenShots
			})
		}
	}, [widget])

	// Snaps to the selected image on change
	useEffect(() => {
		if (selectionData.selectedImage.reset) {
			snapToImage()
		}
	}, [selectionData.selectedImage])

	const prevImage = () => {
		if (screenshotData.numScreenshots !== 0) {
			const index = (selectionData.selectedImage.num + screenshotData.numScreenshots) % (screenshotData.numScreenshots + 1)
			setSelectionData({
				...selectionData, 
				selectedImage: {
					num: index,
					reset: true
				}
			})
		}
	}

	const nextImage = () => {
		if (screenshotData.numScreenshots !== 0) {
			const index = (selectionData.selectedImage.num + 1) % (screenshotData.numScreenshots + 1)
			setSelectionData({
				...selectionData, 
				selectedImage: {
					num: index,
					reset: true
				}
			})
		}
	}

	// Gets the starting position and time
	const handleMouseDown = (e) => {
		setSelectionData({
			...selectionData,
			mouseData: {
				...selectionData.mouseData,
				mouseDown: true,
				xPos: e.pageX,
				yPos: e.pageY,
				time: (new Date()).getTime()
			}
		})
	}

	// Gets the difference in position, adds 0.3*velocity, and snaps to the closest image
	const handleMouseUp = (e) => {
		if (selectionData.mouseData.mouseDown) {
			const newPos = (e.pageX-selectionData.mouseData.xPos) + selectionData.mouseData.offset
			snapClosest(newPos + 0.3*getVelocity(e.pageX, selectionData.mouseData.xPos, selectionData.mouseData.time))
		}
	}

	// Moves the image
	const handleMouseMove = (e) => {
		if (selectionData.mouseData.mouseDown) {
			const _pics = picScrollerRef.current

			if (e.pageX == 0 && e.pageY == 0) {
				return
			}

			// note: deltaX is positive when dragging right (ie going back)
			let x = (e.pageX-selectionData.mouseData.xPos) + selectionData.mouseData.offset

			// if the pan goes off the edge, divide the overflow amount by 10
			if (x > 0) x = x / 10 // overflow left

			const lastIndex = screenshotData.numScreenshots
			const rightEdge = _pics.children[lastIndex].offsetLeft * -1
			x = Math.max(x, rightEdge + (x - rightEdge) / 10) // overflow right

			_pics.style.transition = ''
			_pics.style.transform = `translate3D(${x}px, 0, 0)`
		}
	}

	// Same methods used for touch controls
	const handleTouchDown = (e) => {
		if (!selectionData.mouseData.mouseDown && e.changedTouches.length == 1) {
			setSelectionData({
				...selectionData,
				mouseData: {
					...selectionData.mouseData,
					mouseDown: true,
					xPos: e.changedTouches[0].pageX,
					yPos: e.changedTouches[0].pageY,
					time: (new Date()).getTime()
				}
			})
		}
	}

	const handleTouchUp = (e) => {
		if (selectionData.mouseData.mouseDown && e.changedTouches.length == 1) {
			const newPos = (e.changedTouches[0].pageX-selectionData.mouseData.xPos) + selectionData.mouseData.offset
			snapClosest(newPos + 0.1*getVelocity(e.changedTouches[0].pageX, selectionData.mouseData.xPos, selectionData.mouseData.time))
		}
	}

	const handleTouchMove = (e) => {
		if (selectionData.mouseData.mouseDown && e.changedTouches.length > 0) {
			const _pics = picScrollerRef.current

			if (e.changedTouches[0].pageX == 0 && e.changedTouches[0].pageY == 0) {
				return
			}

			// note: deltaX is positive when dragging right (ie going back)
			let x = (e.changedTouches[0].pageX-selectionData.mouseData.xPos) + selectionData.mouseData.offset

			// if the pan goes off the edge, divide the overflow amount by 10
			if (x > 0) x = x / 10 // overflow left

			const lastIndex = screenshotData.numScreenshots
			const rightEdge = _pics.children[lastIndex].offsetLeft * -1
			x = Math.max(x, rightEdge + (x - rightEdge) / 10) // overflow right

			_pics.style.transition = ''
			_pics.style.transform = `translate3D(${x}px, 0, 0)`
		}
	}

	const snapClosest = (x, animate = true) => {
		const _pics = picScrollerRef.current
		if (_pics.children.length < 2) return // pics not loaded yet

		let minDiff = 9999
		let _offset = x
		let _selectedImage = selectionData.selectedImage.num

		// Finds the closest image
		for (let i = 0; i <= screenshotData.numScreenshots; i++) {
			const childOffset = _pics.children[i].offsetLeft * -1
			const diff = Math.abs(childOffset - x)
			if (diff < minDiff) {
				minDiff = diff
				_offset = childOffset
				_selectedImage = i
			}
		}

		setSelectionData({
			...selectionData, 
			selectedImage: {
				num: _selectedImage,
				reset: false
			},
			mouseData: {
				mouseDown: false,
				xPos: 0,
				yPos: 0,
				offset: _offset
			}
		})

		_pics.style.transform = `translate3D(${_offset}px, 0, 0)`
		_pics.style.transition = animate ? 'ease transform 500ms' : ''
	}

	const snapToImage = (fast=false) => {
		const _pics = picScrollerRef.current
		const i = selectionData.selectedImage.num
		if (_pics.children.length && _pics.children[i]) {
			const _offset = _pics.children[i].offsetLeft * -1
			fast ? _pics.style.transition = '' : _pics.style.transition = 'ease transform 500ms'
			_pics.style.transform = `translate3D(${_offset}px, 0, 0)`
			
			setSelectionData({
				...selectionData, 
				selectedImage: {
					...selectionData.selectedImage,
					reset: false
				},
				mouseData: {
					mouseDown: false,
					xPos: 0,
					yPos: 0,
					offset: _offset
				}
			})
		}
	}

	// Starts player demo, but navigates to separate demo of screen isn't big enough
	const showDemoClicked = () => {
		if (isWideEnough()) {
			const _height = (parseInt(widget.height) + 48) + 'px'
			const _width = (parseInt(widget.width) + 10) + 'px'

			createPlaySession.mutate({
				widgetId: widget.meta_data.demo,
				successFunc: (idVal) => setDemoData({
					demoLoading: true,
					showDemoCover: false,
					demoHeight: _height,
					demoWidth: _width,
					playId: idVal
				})
			})
		}
		else {
			window.location = document.location.pathname + '/demo'
		}
	}

	const isWideEnough = () => {
		if (widget.width == 0) {
			return false // don't allow widgets with scalable width
		}
		// 150 in padding/margins needed
		const sizeNeeded = parseInt(widget.width) + 150
		const userWidth = windowWidth
		return userWidth > sizeNeeded
	}

	return (
		<div className="pics">
			<button className="pic-arrow" onClick={prevImage}>
				<svg xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24">
					<path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
					<path fill="none" d="M0 0h24v24H0V0z"/>
				</svg>
			</button>
			<button className="pic-arrow"
				onClick={nextImage}>
				<svg xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24">
					<path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
					<path fill="none" d="M0 0h24v24H0V0z"/>
				</svg>
			</button>

			<div id="pics-scroller-container">
				{
					screenshotData.numScreenshots > 0
					?	<div id="pics-scroller"
							style={{transform: 'translate3D(-2px, 0, 0)'}}
							ref={picScrollerRef}
							onTouchStart={handleTouchDown}
							onTouchEnd={handleTouchUp}
							onTouchMove={handleTouchMove}
							onMouseDown={handleMouseDown}
							onMouseUp={handleMouseUp}
							onMouseMove={handleMouseMove}
							onMouseLeave={handleMouseUp}
							>
							<div className={`${demoData.demoLoading ? 'loading' : ''} ${!demoData.showDemoCover ? 'playing' : ''}`}
								style={{minHeight: demoData.demoHeight, width: demoData.demoWidth}}>
								{
									!demoData.showDemoCover
									? <div id="player-container">
											<WidgetPlayer 
											instanceId={widget.meta_data.demo}
											playId={demoData.playId}
											minHeight={parseInt(widget.height)}
											minWidth={parseInt(widget.width)}/>
										</div>
									: <>
											<img style={{minHeight: demoData.demoHeight, height: (parseInt(widgetHeight) + 48) + 'px'}} src={screenshotData.screenshots[0]?.full}/>
											<div id="demo-cover"
												className={`${demoData.demoLoading ? 'loading' : ''}`}
												style={{backgroundImage: `url(${screenshotData.screenshots[0]?.full})`}} >
												<button className="action_button green"
													onClick={showDemoClicked}>
													<svg xmlns="http://www.w3.org/2000/svg"
														width="24"
														height="24"
														viewBox="0 0 24 24">
														<path d="M8 5v14l11-7z"/>
														<path d="M0 0h24v24H0z"
															fill="none"/>
													</svg>
													Play a demo now!
												</button>
												<div id="demo-cover-background"></div>
											</div>
										</>
								}
								<h3>{!demoData.showDemoCover ? 'Playing ' : '' }Demo</h3>
							</div>
											
							{
								screenshotData.screenshots.map((screenshot, index) => {
									return(<div key={index}>
											<img src={screenshot.full} />
											<div className="screenshot-drag-cover"></div>
											<h3>Screenshot {index + 1} of {screenshotData.numScreenshots}</h3>
										</div>)
								})
							}
						</div>
					: null
				}
			</div>

			<div>
				<button className={`demo-dot ${selectionData.selectedImage.num === 0 ? 'selected' : ''}`}
					onClick={() => setSelectionData({...selectionData, selectedImage: {num: 0, reset: true}})}>
					Demo
				</button>
				{
					screenshotData.screenshots.map((screenshot, index) => {
						return(<button className={`pic-dot ${selectionData.selectedImage.num === index + 1 ? 'selected' : ''}`} key={index}
								onClick={() => setSelectionData({...selectionData, selectedImage: {num: index + 1, reset: true}})}>
							</button>)
					})
				}
			</div>
		</div>
	)
}

export default DetailCarousel
