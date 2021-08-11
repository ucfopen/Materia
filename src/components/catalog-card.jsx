import React from 'react'
import { iconUrl } from '../util/icon-url'
import KeyboardIcon from './keyboard-icon'
import ScreenReaderIcon from './screen-reader-icon'

const isValidAccessVal = val => {
	console.log(val)
	// val.toLowerCase() === 'full' || val.toLowerCase() === 'limited' ? true : false
	return ['Full', 'Limited'].includes(val)
}

const CatalogCard = ({
	id,
	clean_name = '',
	in_catalog = '0',
	name = '',
	dir = '',
	meta_data,
	isFiltered,
	activeFilters = []
}) => {
	// 'Featured' label
	let featuredLabelRender = null
	if (in_catalog === '1') {
		featuredLabelRender = <div className='featured-label'>
			<svg xmlns='http://www.w3.org/2000/svg'
				width='18'
				height='18'
				viewBox='0 0 18 18'>
				<path d='M9 11.3l3.71 2.7-1.42-4.36L15 7h-4.55L9 2.5 7.55 7H3l3.71 2.64L5.29 14z'/>
				<path fill='none' d='M0 0h18v18H0z'/>
			</svg>
			Featured
		</div>
	}

	const supportedDataRender = meta_data.supported_data.map(supported =>
		<li className={`${activeFilters.includes(supported) ? 'selected' : ''}`} key={supported}>{supported}</li>
	)

	const featuresRender = meta_data.features.map(filter =>
		<li className={`${activeFilters.includes(filter) ? 'selected' : ''}`} title={filter} key={filter}>{filter}</li>
	)

	let keyboardIconRender = null
	let readerIconRender = null

	if(isValidAccessVal(meta_data.accessibility_keyboard)) {
		keyboardIconRender = <div>
			<KeyboardIcon color={`${activeFilters.includes('Keyboard Accessible') ? '#3498db' : 'black'}`}/>
			<span aria-label='keyboard-access-popup' className='tool-tip'>Keyboard Accessible</span>
		</div>
	}
	if(isValidAccessVal(meta_data.accessibility_reader)) {
		readerIconRender = <div aria-label='screen-reader-access-icon'>
			<ScreenReaderIcon color={`${activeFilters.includes('Screen Reader Accessible') ? '#3498db' : 'black'}`}/>
			<span aria-label='screen-reader-access-popup' className='tool-tip'>Screen Reader Accessible</span>
		</div>
	}

	let accessibilityRender = null
	if ( keyboardIconRender || readerIconRender) {
		accessibilityRender = <div className='accessibility-holder'>
			<div className='accessibility-indicators'>
				{ keyboardIconRender }
				{ readerIconRender }
			</div>
		</div>
	}

	return (
		<div className={`widget ${isFiltered ? 'filtered' : ''}`}>
			<a
				className='infocard'
				href={`/widgets/${id}-${clean_name}`}
				target='_self'>
				<div className='header'>
					{ featuredLabelRender }
					<h1 className={`infoHeader ${in_catalog === '1' ? 'featured' : ''}`} >{name}</h1>
				</div>

				<div className='img-holder'>
					<img src={iconUrl('http://localhost/widget/', dir, 275)} />
				</div>

				<div className='widget-info'>
					<div className='blurb'>
						{meta_data['excerpt']}
					</div>
					<ul className='inline_def features_list'>
						{ supportedDataRender }
						{ featuresRender }
					</ul>
					{ accessibilityRender }
				</div>
			</a>
		</div>
	)
}

export default CatalogCard
