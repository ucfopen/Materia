import React from 'react'
import { iconUrl } from '../util/icon-url'
import KeyboardIcon from './keyboard-icon'
import ScreenReaderIcon from './screen-reader-icon'

const isValidAccessVal = (val) => val.toLowerCase() === 'full' || val.toLowerCase() === 'limited' ? true : false

const CatalogCard = ({
	id,
	clean_name = '',
	in_catalog = '0',
	name = '',
	dir = '',
	meta_data,
	isFiltered,
	activeFilters = []
	}) => (
	<div className={`widget ${isFiltered ? 'filtered' : ''}`}>
		<a
			className="infocard"
			href={`/widgets/${id}-${clean_name}`}
			target="_self"
		>
			<div className="header">
				{in_catalog === "1"
					? <div className="featured-label">
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><path d="M9 11.3l3.71 2.7-1.42-4.36L15 7h-4.55L9 2.5 7.55 7H3l3.71 2.64L5.29 14z"/><path fill="none" d="M0 0h18v18H0z"/></svg>
							Featured
						</div>
					: null
				}
				<h1 className={`infoHeader ${in_catalog === "1" ? 'featured' : ''}`} >{name}</h1>
			</div>

			<div className="img-holder">
				<img src={iconUrl('http://localhost/widget/', dir, 275)} />
			</div>

			<div className="widget-info">
				<div className="blurb">
					{meta_data['excerpt']}
				</div>
				<ul className="inline_def features_list">
					{meta_data.supported_data.map(supported =>
						<li className={`${activeFilters.includes(supported) ? 'selected' : ''}`} key={supported}>{supported}</li>
					)}

					{meta_data.features.map(filter =>
						<li className={`${activeFilters.includes(filter) ? 'selected' : ''}`} key={filter}>{filter}</li>
					)}
				</ul>
				<div className="accessibility-holder">
					{
						meta_data.accessibility_options && meta_data.accessibility_options.length > 0
						?	<div className="accessibility-indicators">
							{
								meta_data.accessibility_options.length > 0 && isValidAccessVal(meta_data.accessibility_options[0])
								? <div>
										<KeyboardIcon color={`${activeFilters.includes('Keyboard Accessible') ? '#3498db' : 'black'}`}/>
										<span className="tool-tip">Keyboard Accessible</span>
									</div>
								: null
							}

							{
								meta_data.accessibility_options.length > 1 && isValidAccessVal(meta_data.accessibility_options[1])
								? <div>
										<ScreenReaderIcon color={`${activeFilters.includes('Screen Reader Accessible') ? '#3498db' : 'black'}`}/>
										<span className="tool-tip">Screen Reader Accessible</span>
									</div>
								: null
							}
							</div>
						: null
					}
				</div>
			</div>
		</a>
	</div>
)

export default CatalogCard
