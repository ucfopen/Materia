import React, {useMemo} from 'react'
import DetailFeature from './detail-feature'

const SUPPORTED_DATA = 'supported-data'
const FEATURES = 'features'
const DetailFeatureList = ({title, widgetData, type={SUPPORTED_DATA}}) => {

	const activeTab = useMemo(() => {
		switch(type){
			case SUPPORTED_DATA:
				return (widgetData.supported_data.map((data, index) => {
					return (<DetailFeature data={data} index={index} key={index}/>)
				}))

			case FEATURES:
				return (widgetData.features.map((data, index) => {
					return (<DetailFeature data={data} index={index} key={index}/>)
				}))

			default:
				return null
		}
	}, [type, widgetData])

	return (
		<div className={`feature-list ${type}`}>
			<span className='feature-heading'>{title}:</span>
			<div className='item-list'>
				{activeTab}
			</div>
		</div>
	)
}

export default DetailFeatureList
