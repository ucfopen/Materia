import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useInfiniteQuery } from 'react-query'
import LoadingIcon from './loading-icon'
import {apiGetUser, apiGetUserPlaySessions} from '../util/api'
import useGetPlaySessions from './hooks/useGetPlaySessions'
import Header from './header'
import './profile-page.scss'
import Alert from './alert'

const ProfilePage = () => {
	const [alertDialog, setAlertDialog] = useState({
		enabled: false,
		message: '',
		title: 'Failure',
		fatal: false,
		enableLoginButton: false
	})
	const [activityData, setActivityData] = useState([])
	let userActivity =  useGetPlaySessions("me", false)

	const mounted = useRef(false)
	const { data: currentUser, isFetching} = useQuery({
		queryKey: ['user', 'me'],
		queryFn: ({ queryKey }) => {
			const [_key, user] = queryKey
			return apiGetUser(user)
		},
		staleTime: Infinity,
		retry: false,
		onError: (err) => {
			setAlertDialog({
				enabled: true,
				message: 'You must be logged in to view your profile.',
				title: 'Login Required',
				fatal: true,
				enableLoginButton: true
			})
		}
	})

	useEffect(() => {
		if (userActivity?.plays) {
			const newActivity = userActivity.plays.map((log) => {
				return {
					is_complete: log.is_complete,
					link: _getLink(log),
					status: _getStatus(log),
					widget: log.widget_name,
					title: log.inst_name,
					date: _getDate(log),
					score: _getScore(log),
					play_id: log.id
				}
			})
			setActivityData(data => [...newActivity])
		}
	},[userActivity?.plays.length])

	useEffect(() => {
		mounted.current = true
		return () => (mounted.current = false)
	}, [])

	const _getLink = (activity) => {
		return activity.is_complete === '1' ? `/scores/${activity.inst_id}#play-${activity.play_id}` : '#'
	}

	const _getScore = (activity) => {
		return activity.is_complete === '1' ? Math.round(parseFloat(activity.percent)) : '--'
	}

	const _getStatus = (activity) => {
		return activity.is_complete === '1' ? '' : 'No Score Recorded'
	}

	const _getDate = (activity) => {
		let activityDate = new Date(activity.created_at)
		return `${activityDate.toLocaleDateString([],{dateStyle: 'short'})} at ${activityDate.toLocaleTimeString([],{timeStyle: 'short'})}`
	}

	const _getMoreLogs = () => {
		if (userActivity?.hasNextPage) userActivity.fetchNextPage()
	}

	let noActivityRender = <p className='no_logs'>You don't have any activity! Once you play a widget, your score history will appear here.</p>

	// let activityContentRender = <></>
	let activityContentRender = activityData.map((record) => {
			return <li className={`activity_log ${record.is_complete == 1 ? 'complete' : 'incomplete'} ${record.score == 100 ? 'perfect_score' : ''}`} key={record.play_id}>
				<a className='score-link' href={record.link}>
					<div className="status">{record.status}</div>
					<div className="widget">{record.widget}</div>
					<div className="title">{record.title}</div>
					<div className="date">{record.date}</div>
					<div className="score">{record.score}</div>
				</a>
			</li>
	})

	let alertDialogRender = null
	if (alertDialog.enabled) {
		alertDialogRender = (
			<Alert
				msg={alertDialog.message}
				title={alertDialog.title}
				fatal={alertDialog.fatal}
				showLoginButton={alertDialog.enableLoginButton}
				onCloseCallback={() => {
					setAlertDialog({...alertDialog, enabled: false})
				}} />
		)
	}

	let mainContentRender = <section className='page'><div className='loading-icon-holder'><LoadingIcon /></div></section>
	if ( !isFetching && !userActivity?.isFetching && currentUser) {
		mainContentRender =
			<section className="page user">

				<ul className="main_navigation">
					<li className="selected profile"><a href="/profile">Profile</a></li>
					<li className="settings"><a href="/settings">Settings</a></li>
				</ul>

				<div className="avatar_big">
					<img src={currentUser.avatar} />
				</div>

					<div>
						<div className="profile_status">
							<span>Profile</span>
							<span>
								<ul className="user_information">
									<li className={`user_type ${currentUser.is_student == true ? '' : 'staff'}`}>{`${currentUser.is_student == true ? 'Student' : 'Staff'}`}</li>
									{currentUser.is_support_user ? <li className={`user_type ${currentUser.is_support_user == true ? 'support' : ''}`}>{`${currentUser.is_support_user == true ? 'Support' : ''}`}</li> : <></>}
								</ul>
							</span>
						</div>
						<h2>
						{`${currentUser.first_name} ${currentUser.last_name}`}
						</h2>
					</div>

				<span className="activity_subheader">Activity</span>

				<div className='activity'>
					<div className={`loading-icon-holder ${userActivity?.isFetching ? 'loading' : ''}`}><LoadingIcon /></div>
					<ul className='activity_list'>
						{activityData.length ? activityContentRender : noActivityRender}
					</ul>
				</div>

				{ userActivity?.hasNextPage ? <a className="show_more_activity action_button" onClick={_getMoreLogs}>{ userActivity.isFetching ? <span className='message_loading'>Loading...</span> : <span>Show more</span>}</a> : '' }

			</section>
	}

	return (
		<>
			<Header />
			<div className='profile-page'>
				<div className='user'>
					{ alertDialogRender }
					{ mainContentRender }
				</div>
			</div>
		</>
	)
}

export default ProfilePage
