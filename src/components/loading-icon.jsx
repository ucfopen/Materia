import React from 'react'
import './loading-icon.scss'

const LoadingIcon = ({size='med', width='100%', top= '0', left='0'}) => {
	// Supported sizes: sm, med, lrg
	return (
		<div className='icon-holder' style={{position: 'absolute', width: width, top: top, left: left}}>
			<div className='loading-icon'>
				<svg className={`${size}`} xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 162.8'>
				<path d='M121.4,85.7a39.2,39.2,0,0,0-16.9,3.9,34.1,34.1,0,0,1-4.1,6.3l13.7,13.7a16.3,16.3,0,0,1,7.3-1.7,16.3,16.3,0,0,1,0,32.5,16.3,16.3,0,0,1-16.3-16.3h0a18.7,18.7,0,0,1,1.8-7.3L93.2,103.2a41.8,41.8,0,0,1-6.3,4,38.3,38.3,0,1,0,34.5-21.5Z' transform='translate(0 0)' style={{fill:'#73bf54'}}></path>
				<path d='M59.2,67.4l-14-13.9a16.2,16.2,0,1,1,8.4-21.4A16.5,16.5,0,0,1,55,38.6a16.2,16.2,0,0,1-1.6,6.9L67.2,59.3a37.3,37.3,0,0,1,6-3.7A38.6,38.6,0,1,0,55.6,73.1,55,55,0,0,1,59.2,67.4Z' transform='translate(0 0)' style={{fill:'#9d539f'}}></path>
				<path d='M67.5,103.7l-13.9,14a16.2,16.2,0,1,1-21.4-8.5,16.4,16.4,0,0,1,6.5-1.3,14.9,14.9,0,0,1,6.9,1.6L59.4,95.6a36,36,0,0,1-3.8-6,38.6,38.6,0,1,0,17.6,17.6A41.5,41.5,0,0,1,67.5,103.7Z' transform='translate(0 0)' style={{fill:'#ef804b'}}></path>
				<path d='M92.6,59.1l13.9-14a16.2,16.2,0,1,1,21.4,8.4,16.5,16.5,0,0,1-6.5,1.4,16.2,16.2,0,0,1-6.9-1.6L100.7,67.2a39.7,39.7,0,0,1,3.8,5.9A38.4,38.4,0,1,0,86.9,55.6,41.5,41.5,0,0,1,92.6,59.1Z' transform='translate(0 0)' style={{fill:'#5ca1cb'}}></path>
				</svg>
			</div>
		</div>
	)
}

export default LoadingIcon
