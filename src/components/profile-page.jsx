import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useInfiniteQuery } from 'react-query'
import LoadingIcon from './loading-icon'
import { apiGetUser, apiGetUserActivity } from '../util/api'
import Header from './header'
import './profile-page.scss'
import Alert from './alert'

const ProfilePage = () => {
	const [alertDialog, setAlertDialog] = useState({
		enabled: false,
		message: '',
		title: 'Failure',
		fatal: false,
		enableLoginButton: false,
	})
	const [activityPage, setActivityPage] = React.useState(0)

	const mounted = useRef(false)
	const { data: currentUser, isFetching } = useQuery({
		queryKey: 'user',
		queryFn: apiGetUser,
		staleTime: Infinity,
		retry: false,
		onError: (err) => {
			if (err.message == 'Invalid Login') {
				setAlertDialog({
					enabled: true,
					message: 'You must be logged in to view your profile.',
					title: 'Login Required',
					fatal: true,
					enableLoginButton: true,
				})
			}
		},
	})

	const {
		data: userActivity,
		isFetching: isFetchingActivity,
		isFetchingNextPage: isFetchingNextActivityPage,
		hasNextPage,
		fetchNextPage: fetchNextActivityPage,
	} = useInfiniteQuery({
		queryKey: 'user-activity',
		queryFn: apiGetUserActivity,
		getNextPageParam: (lastPage, pages) => {
			return lastPage.more == true ? activityPage : undefined
		},
		staleTime: Infinity,
		onError: (err) => {
			if (err.message == 'Invalid Login') {
				setAlertDialog({
					enabled: true,
					message: 'You must be logged in to view your profile.',
					title: 'Login Required',
					fatal: true,
					enableLoginButton: true,
				})
			}
		},
	})

	useEffect(() => {
		if (mounted.current && !isFetching && !isFetchingNextActivityPage) {
			fetchNextActivityPage()
		}
	}, [activityPage])

	useEffect(() => {
		mounted.current = true
		return () => (mounted.current = false)
	}, [])

	const _getLink = (activity) => {
		return activity.is_complete === '1'
			? `/scores/${activity.inst_id}#play-${activity.play_id}`
			: '#'
	}

	const _getScore = (activity) => {
		return activity.is_complete === '1' ? Math.round(parseFloat(activity.percent)) : '--'
	}

	const _getStatus = (activity) => {
		return activity.is_complete === '1' ? '' : 'No Score Recorded'
	}

	const _getDate = (activity) => {
		let activityDate = new Date(activity.created_at * 1000)
		return `${activityDate.toLocaleDateString([], {
			dateStyle: 'short',
		})} at ${activityDate.toLocaleTimeString([], { timeStyle: 'short' })}`
	}

	const _getMoreLogs = () => {
		setActivityPage((previous) => previous + 1)
		setTimeout(() => {
			window.scrollTo({
				top: document.body.scrollHeight,
				behavior: 'smooth'
			})
		}, 100)
	}

	let noActivityRender = (
		<p className="no_logs">
			You don't have any activity! Once you play a widget, your score history will appear here.
		</p>
	)

	let activityContentRender = userActivity?.pages?.map((page) => {
		return page.activity?.map((activity) => {
			return (
				<li
					className={`activity_log ${activity.is_complete == 1 ? 'complete' : 'incomplete'} ${
						activity.percent == 100 ? 'perfect_score' : ''
					}`}
					key={activity.play_id}
				>
					<a className="score-link" href={_getLink(activity)}>
						<div className="status">{_getStatus(activity)}</div>
						<div className="widget">{activity.widget_name}</div>
						<div className="title">{activity.inst_name}</div>
						<div className="date">{_getDate(activity)}</div>
						<div className="score">{_getScore(activity)}</div>
					</a>
				</li>
			)
		})
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
					setAlertDialog({ ...alertDialog, enabled: false })
				}}
			/>
		)
	}

	let mainContentRender = (
		<section className="page loading">
			<div className="loading-icon-holder">
				<LoadingIcon />
			</div>
		</section>
	)
	if (!isFetching && !isFetchingActivity && currentUser) {
		mainContentRender = (
			<section className="page user">

					<ul className="main_navigation" role="menu">
						<div className="avatar_big">
							<img src={currentUser.avatar} />
					</div>

						<ul>
							<li className="selected_profile">
								<a href="/profile" role="menuitem">Profile</a>
							</li>
							<li className="settings">
								<a href="/settings" role="menuitem">Settings</a>
							</li>
						</ul>
				</ul>
				<div className="profile_content">
					<header>
						<div className="profile_status">
							<span>Profile</span>

							<span>
								<ul className="user_information">
									<li className={`user_type ${currentUser.is_student == true ? '' : 'staff'}`}>{`${
										currentUser.is_student == true ? 'Student' : 'Staff'
									}`}</li>
									{currentUser.is_support_user ? (
										<li
											className={`user_type ${
												currentUser.is_support_user == true ? 'support' : ''
											}`}
										>{`${currentUser.is_support_user == true ? 'Support' : ''}`}</li>
									) : (
										<></>
									)}
								</ul>
							</span>
						</div>
						<h2>{`${currentUser.first} ${currentUser.last}`}</h2>
					</header>

					<span className="activity_subheader">Activity</span>

					<div className="activity">
						<div className={`loading-icon-holder ${isFetchingActivity ? 'loading' : ''}`}>
							<LoadingIcon />
						</div>
						<ul className="activity_list">
							{userActivity?.pages[0]?.activity.length ? activityContentRender : noActivityRender}
						</ul>
					</div>

					{hasNextPage ? (
						<button className="show_more_activity action_button" onClick={_getMoreLogs}>
							{isFetchingNextActivityPage ? (
								<span className="message_loading">Loading...</span>
							) : (
								<span>Show more</span>
							)}
						</button>
					) : (
						''
					)}
				</div>
			</section>
		)
	}

	return (
		<>
			<Header />
			<div className="profile-page">
				<div className="user">
					{alertDialogRender}
					{mainContentRender}
				</div>
			</div>
		</>
	)
}

export default ProfilePage
