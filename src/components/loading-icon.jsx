import React from 'react'
import { iconUrl } from '../util/icon-url'
import './loading-icon.scss'

const LoadingIcon = ({size="med"}) => {
	// Supported sizes: sm, med, lrg
	// tri_color_spinner.png
	return (
		<div className="icon-holder">
			<div className="loading-icon">
				<img className={`icon ${size}`} src="/img/tri_color_spinner.png" />
			</div>
		</div>
	)
}

export default LoadingIcon