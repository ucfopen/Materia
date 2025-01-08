import React from 'react'
import Header from './header'
import Detail from './detail'
import { useQuery } from 'react-query'
import { apiGetWidget } from '../util/api'

const DetailPage = () => {
	const nameArr = window.location.pathname.replace('/widgets/', '').split('/')
	console.log('name arr')
	console.log(nameArr)
	const widgetID = nameArr.pop().split('-').shift()
	console.log(`widget id ${widgetID}`)
	const { data: widget, isFetching: isFetching} = useQuery({
		queryKey: 'widget',
		queryFn: () => apiGetWidget(widgetID),
		enabled: !!widgetID,
		placeholderData: {},
		staleTime: Infinity
	})

	return (
		<>
			<Header />
			<Detail widget={widget} isFetching={isFetching}/>
		</>
	)
}

export default DetailPage
