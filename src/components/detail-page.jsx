import React from 'react'
import Header from './header'
import Detail from './detail'
import { useQuery } from 'react-query'
import { apiGetWidget } from '../util/api'

const DetailPage = () => {
	const nameArr = window.location.pathname.replace('/widgets/', '').split('/')
	const widgetID = nameArr.pop().split('-').shift()
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
