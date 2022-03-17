import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useInfiniteQuery } from 'react-query'
import LoadingIcon from './loading-icon'
import {apiGetUser, apiGetUserActivity} from '../util/api'
import Header from './header'
import './profile-page.scss'

const ProfilePage = () => {

	const [activityPage, setActivityPage] = React.useState(0)

	const mounted = useRef(false)
	const { data: currentUser, isFetching} = useQuery({
		queryKey: 'user',
		queryFn: apiGetUser,
		staleTime: Infinity
	})

	const {
		data: userActivity,
		isFetching: isFetchingActivity,
		isFetchingNextPage: isFetchingNextActivityPage,
		hasNextPage,
		fetchNextPage: fetchNextActivityPage
	} = useInfiniteQuery({
		queryKey: 'user-activity',
		queryFn: apiGetUserActivity,
		getNextPageParam: (lastPage, pages) => {
			return lastPage.more == true ? activityPage : undefined
		},
		staleTime: Infinity
	})

	useEffect(() => {
		if (mounted.current && ! isFetching && ! isFetchingNextActivityPage) {
			fetchNextActivityPage()
		}
	}, [activityPage])

	useEffect(() => {
		mounted.current = true
		return () => (mounted.current = false)
	}, [])

	const _getLink = (activity) => {
		return activity.is_complete === '1' ? `/scores/${activity.inst_id}#play-${activity.play_id}` : ''
	}

	const _getScore = (activity) => {
		return activity.is_complete === '1' ? Math.round(parseFloat(activity.percent)) : '--'
	}

	const _getStatus = (activity) => {
		return activity.is_complete === '1' ? '' : 'No Score Recorded'
	}

	const _getDate = (activity) => {
		let activityDate = new Date(activity.created_at * 1000)
		return `${activityDate.toLocaleDateString([],{dateStyle: 'short'})} at ${activityDate.toLocaleTimeString([],{timeStyle: 'short'})}`
	}

	const _getMoreLogs = () => {
		setActivityPage(previous => previous + 1)
	}

	// let activityContentRender = <LoadingIcon />
	let activityContentRender = userActivity?.pages?.map((page) => {
		return page.activity?.map((activity) => {
			return <li className={`activity_log ${activity.is_complete == 1 ? 'complete' : 'incomplete'} ${activity.percent == 100 ? 'perfect_score' : ''}`} key={activity.play_id}>
				<a className='score-link' href={_getLink(activity)}>
					<div className="status">{_getStatus(activity)}</div>
					<div className="widget">{activity.widget_name}</div>
					<div className="title">{activity.inst_name}</div>
					<div className="date">{_getDate(activity)}</div>
					<div className="score">{_getScore(activity)}</div>
				</a>
			</li>
		})
	})

	let mainContentRender = <section className='page'><div className='loading-icon-holder'><LoadingIcon /></div></section>
	if ( !isFetching ) {
		mainContentRender = 
			<section className="page">

				<ul className="main_navigation">
					<li className="selected profile"><a href="/profile">Profile</a></li>
					<li className="settings"><a href="/settings">Settings</a></li>
				</ul>

				<div className="avatar_big">
					<img src={currentUser.avatar} />
				</div>

				<h2>
					<span>Profile</span>
					{`${currentUser.first} ${currentUser.last}`}
				</h2>

				<ul className="user_information">
					<li className={`user_type ${currentUser.is_student == true ? '' : 'staff'}`}>{`${currentUser.is_student == true ? 'Student' : 'Staff'}`}</li>
				</ul>

				<h3>Activity</h3>

				<div className='activity'>
					<div className={`loading-icon-holder ${isFetchingActivity ? 'loading' : ''}`}><LoadingIcon /></div>
					<ul className='activity_list'>
						{ activityContentRender }
					</ul>
				</div>

				{ hasNextPage ? <a className="show_more_activity" onClick={_getMoreLogs}>{ isFetchingNextActivityPage ? <span className='message_loading'>Loading...</span> : <span>Show more</span>}</a> : '' }
				{/* <p className="no_logs" ng-show="activities && activities.length == 0">You don't have any activity! Start doing stuff.</p> */}

			</section>
	}

	
	

	return (
		<>
			<Header />
			<div className='profile-page'>
				<div className='user'>
					{ mainContentRender }
				</div>
			</div>
		</>
	)
}

export default ProfilePage
