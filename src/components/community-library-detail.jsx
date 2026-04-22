import React from 'react'
import './cl-detail.scss'

const CommunityLibraryDetail = ({entry}) => {

	if(!entry) return (
		<div>Loading</div>
	)

	return (
		<div className='card'>
			{entry.instance_name}
		</div>
	)
}

export default CommunityLibraryDetail
