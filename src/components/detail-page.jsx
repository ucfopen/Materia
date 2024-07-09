import React from 'react'
import Header from './header'
import Detail from './detail'
import { useQuery } from 'react-query'
import { apiGetWidget } from '../util/api'
import LoadingIcon from './loading-icon'

const DetailPage = () => {
	const nameArr = window.location.pathname.replace('/widgets/', '').split('/')
	let widgetID = nameArr.pop()
	// Check if an end slash was added to the url
	if (widgetID == '') {
		widgetID = nameArr.pop().split('-').shift()
	} else {
		widgetID = widgetID.split('-').shift()
	}
	const { data: widget, isFetching: isFetching} = useQuery({
		queryKey: 'widget',
		queryFn: () => apiGetWidget(widgetID),
		enabled: !!widgetID,
		placeholderData: {},
		staleTime: Infinity
	})

	let mainRender = null
	if (!widget || isFetching) {
		mainRender = <LoadingIcon size='lrg' />
	} else {
		mainRender = <>
			<Header />
			<Detail widget={widget} isFetching={isFetching}/>
		</>
	}

	return (
		<>
			{ mainRender }
		</>
	)
}

export default DetailPage
