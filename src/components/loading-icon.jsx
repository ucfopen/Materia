import React from 'react'
import './loading-icon.scss'

const LoadingIcon = ({size='med', width='100%', top= '0', left='0'}) => {
	// Supported sizes: sm, med, lrg
	return (
		<div className='icon-holder' style={{position: 'absolute', width: width, top: top, left: left}}>
			<div className='loading-icon'>
				<svg className={`${size}`} xmlns='http://www.w3.org/2000/svg' width='500' height='500' viewBox='0 0 500 500'>
					<circle id='Blue' className='cls-1' cx='249.844' cy='108.156' r='50' fill='#5ba2cd'/>
					<circle id='Purple' className='cls-2' cx='119.844' cy='333.156' r='50' fill='#9e54a1'/>
					<circle id='Green' className='cls-3' cx='379.844' cy='333.156' r='50' fill='#74c156'/>
				</svg>
			</div>
		</div>
	)
}

export default LoadingIcon
