import React, {useState} from 'react'
import './detail.scss'

const DetailFeature = ({data, index}) => {
	const [showData, setShowData] = useState(false)

	let descriptionRender = null
	if (showData) {
		descriptionRender = (
			<div className='feature-description'>
				{data?.description}
			</div>
		)
	}

	return (
		<div className='feature' key={index}>
			<div className='feature-name'
				onMouseEnter={() => setShowData(true)}
				onMouseLeave={() => setShowData(false)}>
				{data?.text}
			</div>
			{ descriptionRender }
		</div>
	)
}

export default DetailFeature
