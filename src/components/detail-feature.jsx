import React, {useState} from 'react'
import './detail.scss'

const DetailFeature = ({data, index}) => {
	const [showData, setShowData] = useState(false)

	return (
		<div className="feature" key={index}>
			<div className="feature-name"
				onMouseEnter={() => setShowData(true)}
				onMouseLeave={() => setShowData(false)}>
				{data?.text}
			</div>
			{
				showData
				? <div className="feature-description">
						{data?.description}
					</div>
				: null
			}
		</div>
	)
}

export default DetailFeature
