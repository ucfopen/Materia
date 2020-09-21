import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { iconUrl } from '../util/icon-url'


const CatalogCard = ({
	id,
	clean_name = '',
	in_catalog = '0',
	name = '',
	dir = '',
	meta_data
	}) => (
	<div className="widget">
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
				<h1 className="infoHeader" >{name}</h1>
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
						<li key={supported}>{supported}</li>
					)}

					{meta_data.features.map(filter =>
						<li key={filter}>{filter}</li>
					)}
				</ul>
			</div>
		</a>
	</div>
)

export default CatalogCard