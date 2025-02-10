import React, { useState, useEffect } from 'react'
import { iconUrl } from '../util/icon-url'
import DetailCarousel from './detail-carousel'
import DetailFeatureList from './detail-feature-list'
import LoadingIcon from './loading-icon'
import AccessibilityIndicator from './accessibility-indicator'
import { WIDGET_URL } from './materia-constants'

const initWidgetData = () => ({
	hasPlayerGuide: false,
	hasCreatorGuide: false,
	demoLoading: false,
	dataLoading: true,
	maxPageWidth: '0px',
	date: '',
	creatorurl: document.location.pathname + 'create',
	creators_guide: document.location.pathname + 'creators-guide',
	players_guide: document.location.pathname + 'players-guide',
	features: [],
	supported_data: [],
	accessibility: {},
})

const getAccessibilityData = (metadata) => {

	return {
		keyboard: metadata.accessibility_keyboard ? metadata.accessibility_keyboard : 'Unavailable',
		screen_reader: metadata.accessibility_reader ? metadata.accessibility_reader : 'Unavailable',
		description: metadata.accessibility_description ? metadata.accessibility_description : ''
	}
}

const _tooltipObject = (text) => ({
	text,
	show: false,
	description:
		tooltipDescriptions[text] || 'This feature has no additional information associated with it.',
})

const tooltipDescriptions = {
	Customizable:
		'As the widget creator, you supply the widget with data to make it relevant to your course.',
	Scorable: 'This widget collects scores, and is well suited to gauge performance.',
	Media: 'This widget uses image media as part of its supported data.',
	'Question/Answer':
		'Users provide a typed response or associate a predefined answer with each question.',
	'Multiple Choice':
		'Users select a response from a collection of possible answers to questions provided by the widget.',
	'Mobile Friendly': 'Designed with HTML5 to work on mobile devices like the iPad and iPhone.',
	Fullscreen: 'This widget may be allowed to temporarily take up your entire screen.',
}

const renderGuideElement = (guideLocation, text) => (
	<div className='feature'>
		<a className='guide-link'
			href={guideLocation}>
			{ text }
			<svg xmlns='http://www.w3.org/2000/svg'
				width='24'
				height='24'
				viewBox='0 0 24 24'>
				<path d='M0 0h24v24H0z'
					fill='none'/>
				<path d='M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z'
					fill='white'/>
			</svg>
		</a>
	</div>
)

const Detail = ({widget, isFetching}) => {
	const [noAuthor, setNoAuthor] = useState(false)
	const [height, setHeight] = useState('')
	const [widgetData, setWidgetData] = useState({...initWidgetData(),
		maxWidth: (widget.width || 700) + 150 + 'px'
	})

	useEffect(() => {
		if (!isFetching) {

			setWidgetData({
				...widgetData,
				hasPlayerGuide: widget.player_guide != '',
				hasCreatorGuide: widget.creator_guide != '',
				maxWidth: ((parseInt(widget.width) || 700) + 150) + 'px',
				supported_data: widget.meta_data['supported_data'].map(_tooltipObject),
				features: widget.meta_data['features'].map(_tooltipObject),
				accessibility: getAccessibilityData(widget.meta_data),
				date: new Date(widget['created_at'] * 1000).toLocaleDateString(),
				dataLoading: false,
			})
		}
	}, [isFetching])

	// Waits for window value to load from server then sets it
	useEffect(() => {
		waitForWindow()
		.then(() => {
			setNoAuthor(window.NO_AUTHOR === '1' ? true : false)
			setHeight(window.WIDGET_HEIGHT === '0' ? '' : window.WIDGET_HEIGHT) // Preloads height to avoid detail window resizing
		})
	}, [])

	// Used to wait for window data to load
	const waitForWindow = async () => {
		while(!window.hasOwnProperty('NO_AUTHOR') || !window.hasOwnProperty('WIDGET_HEIGHT'))
			await new Promise(resolve => setTimeout(resolve, 500))
	}

	let iconRender = null
	let contentRender = <div className='loading-icon-holder'><LoadingIcon size='lrg'/></div>

	if (!isFetching) {
		iconRender = (
			<>
				<img src={iconUrl(WIDGET_URL, widget.dir, 92)}
					alt='Current Widget'
					className='widget_icon' />
				<h1>{ widget?.name }</h1>
				<p>{ widget.meta_data?.about }</p>
			</>
		)

		let featuresRender = null
		if (widgetData.features.length > 0) {
			featuresRender = (
				<DetailFeatureList widgetData={widgetData} title='Features' type='features'/>
			)
		}

		let supportedDataRender = null
		if (widgetData.supported_data.length > 0) {
			supportedDataRender = (
				<DetailFeatureList widgetData={widgetData} title='Supported Data' type='supported-data'/>
			)
		}

		let accessibilityRender = null
		if(!widgetData.dataLoading) {
			accessibilityRender = <AccessibilityIndicator widget={widgetData} />
		}

		let createRender = null
		if (!noAuthor) {
			createRender = (
				<div className='widget-action-buttons'>
					<h4>Want to use it in your course?</h4>
					<p>
						<a id ='createLink'
							href={ widgetData.creatorurl }
							className='action_button green'>
							<svg xmlns='http://www.w3.org/2000/svg'
								width='24'
								height='24'
								viewBox='0 0 24 24'>
								<path d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'/>
								<path d='M0 0h24v24H0z'
									fill='none'/>
							</svg>
							Create your widget
						</a>
					</p>
				</div>
			)
		}

		let playerGuideRender = null
		if (widgetData.hasPlayerGuide) {
			playerGuideRender = renderGuideElement(widgetData.players_guide, "Player's Guide")
		}
		let creatorGuideRender = null
		if (widgetData.hasCreatorGuide) {
			creatorGuideRender = renderGuideElement(widgetData.creators_guide, "Creator's Guide'")
		}
		let guidesRender = null
		if (widgetData.hasPlayerGuide || widgetData.hasCreatorGuide) {
			guidesRender = (
				<div className='feature-list guides'>
					<span className='feature-heading'>Guides:</span>
					{ playerGuideRender }
					{ creatorGuideRender }
				</div>
			)
		}

		contentRender = (
			<>
				<DetailCarousel widget={widget} widgetHeight={height}/>

				<section className='bottom'>
					<div className='bottom-content'>
						<div className='left-content'>
							{ featuresRender }
							{ supportedDataRender }
							{ accessibilityRender }
						</div>
						<div className='right-content'>
							{ createRender }
							{ guidesRender }
						</div>
					</div>
					<span id='last-updated'>{widget?.name} was last updated on {widgetData.date}</span>
				</section>
			</>
		)
	}

	return (
		<section className='page' style={{maxWidth: widgetData.maxWidth}}>

			<div id='breadcrumb-container'>
				<div className='breadcrumb'>
					<a href='/widgets'>Widget Catalog</a>
				</div>
				<svg xmlns='http://www.w3.org/2000/svg'
					width='24'
					height='24'
					viewBox='0 0 24 24'>
					<path d='M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z'/>
					<path fill='none' d='M0 0h24v24H0V0z'/>
				</svg>
				<div className='breadcrumb'>{widget?.name}</div>
			</div>

			<article className='widget_detail'>
				<div className='top'>
					{ iconRender }
				</div>
				<p id='widget-about'>{ widget.meta_data?.about }</p>
				{ contentRender }
			</article>
		</section>
	)
}

export default Detail
