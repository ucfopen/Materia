import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useInfiniteQuery } from 'react-query'
import LoadingIcon from './loading-icon'
import {apiGetUser, apiGetUserPlaySessions} from '../util/api'
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
	const [activityPage, setActivityPage] = useState(1)
	const [activityData, setActivityData] = useState([])

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

	const {
		data: userActivity,
		isFetching: isFetchingActivity,
		isFetchingNextPage: isFetchingNextActivityPage,
		hasNextPage,
		fetchNextPage: fetchNextActivityPage
		} = useInfiniteQuery({
			queryKey: 'user-activity',
			queryFn: apiGetUserPlaySessions,
			getNextPageParam: (lastPage, pages) => {
				return lastPage.next != null ? activityPage : undefined
			},
			staleTime: Infinity,
			onError: (err => {
				// @TODO ensure error catching corresponds to message payload from server
				if (err.message == "Invalid Login") {
					setAlertDialog({
						enabled: true,
						message: 'You must be logged in to view your profile.',
						title: 'Login Required',
						fatal: true,
						enableLoginButton: true
					})
				}
			})
	})

	useEffect(() => {
		if (mounted.current && ! isFetching && ! isFetchingNextActivityPage) {
			fetchNextActivityPage()
		}
	}, [activityPage])

	// @TODO widget_name and inst_name are not present in log records
	// @TODO make this more robust?
	useEffect(() => {
		if (userActivity?.pages) {
			const newActivity = userActivity.pages[0].results.map((log) => {
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
			setActivityData(data => [...data, ...newActivity])
		}
	},[userActivity, userActivity?.pages])

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
		setActivityPage(previous => previous + 1)
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
	if ( !isFetching && !isFetchingActivity && currentUser) {
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
						{`${currentUser.first} ${currentUser.last}`}
						</h2>
					</div>

				<span className="activity_subheader">Activity</span>

				<div className='activity'>
					<div className={`loading-icon-holder ${isFetchingActivity ? 'loading' : ''}`}><LoadingIcon /></div>
					<ul className='activity_list'>
						{activityData.length ? activityContentRender : noActivityRender}
					</ul>
				</div>

				{ hasNextPage ? <a className="show_more_activity action_button" onClick={_getMoreLogs}>{ isFetchingNextActivityPage ? <span className='message_loading'>Loading...</span> : <span>Show more</span>}</a> : '' }

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
