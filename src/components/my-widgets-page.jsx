import React, { useState, useEffect } from 'react'
import Header from './header'
import './my-widgets-page.scss'
import MyWidgetsInstanceCard from './my-widgets-instance-card'
import MyWidgetsSideBar from './my-widgets-side-bar'
import MyWidgetSelectedInstance from './my-widgets-selected-instance'
import { useQuery } from 'react-query'
import { access } from './materia-constants'
import useCopyWidget from './hooks/useCopyWidget'
import useDeleteWidget from './hooks/useDeleteWidget'
import { apiGetWidgets, apiGetUser, readFromStorage, apiGetUserPermsForInstance } from '../util/api'

const rawPermsToObj = ([permCode = access.VISIBLE, expireTime = null], isEditable) => {
	permCode = parseInt(permCode, 10)
	return {
		accessLevel: permCode,
		expireTime,
		editable: permCode > access.VISIBLE && isEditable === true,
		shareable: permCode > access.VISIBLE, // old, but difficult to replace with can.share :/
		can: {
			view: [access.VISIBLE, access.COPY, access.SHARE, access.FULL, access.SU].includes(permCode),
			copy: [access.COPY, access.SHARE, access.FULL, access.SU].includes(permCode),
			edit: [access.FULL, access.SU].includes(permCode),
			delete: [access.FULL, access.SU].includes(permCode),
			share: [access.SHARE, access.FULL, access.SU].includes(permCode)
		}
	}
}

const initState = () => {
	return({
		selectedInst: null,
		otherUserPerms: null,
		myPerms: null,
		noAccess: false,
		firstLoad: true
	})
}

const MyWidgetsPage = () => {
	const [state, setState] = useState(initState())
	const { data: widgets, isLoading: isFetching} = useQuery({
		queryKey: 'widgets',
		queryFn: apiGetWidgets,
		staleTime: Infinity
	})
	const { data: user} = useQuery({
		queryKey: 'user',
		queryFn: apiGetUser,
		staleTime: Infinity
	})
	const { data: permUsers} = useQuery({
		queryKey: ['user-perms', state.selectedInst?.id],
		queryFn: () => apiGetUserPermsForInstance(state.selectedInst?.id),
		enabled: !!state.selectedInst && !!state.selectedInst.id && state.selectedInst?.id !== undefined,
		placeholderData: null,
		staleTime: Infinity
	})

	const copyWidget = useCopyWidget()
	const deleteWidget = useDeleteWidget()
	readFromStorage()

	useEffect(() => {
		if (state.selectedInst && permUsers) {
			const isEditable = state.selectedInst.widget.is_editable === "1"
			const othersPerms = new Map()
			for(const i in permUsers.widget_user_perms){
				othersPerms.set(i, rawPermsToObj(permUsers.widget_user_perms[i], isEditable))
			}
			let _myPerms
			for(const i in permUsers.user_perms){
				_myPerms = rawPermsToObj(permUsers.user_perms[i], isEditable)
			}
			setState({...state, otherUserPerms: othersPerms, myPerms: _myPerms})
		}
	}, [state.selectedInst, JSON.stringify(permUsers)])

	useEffect(() => {
		if (!isFetching) {
			setWidgetFromUrl(widgets)
		}
	}, [isFetching])

	useEffect(() => {
		// Clears the current widget if it no longer exists
		if (widgets && state.selectedInst && !widgets.some(widget => widget.id === state.selectedInst.id)) {
			setState({...state, selectedInst: null})
		}
	}, [widgets?.length])

	// Sets the current widget to what's in the URL when the widgets load
	const setWidgetFromUrl = (widgets) => {
		if (!state.firstLoad) {
			return
		}

		const url = window.location.href
		const url_id = url.split('#')[1]

		if (url_id && (!state.selectedInst || state.selectedInst.id !== url_id)) {
			for (let i = 0; i < widgets.length; i++) {
				if (widgets[i].id === url_id) {
					onSelect(widgets[i])
					return
				}
			}

			// User doesn't have access to the widget
			setState({...state, firstLoad: false, noAccess: true})
		}
		else setState({...state, firstLoad: false})
	}

	const onSelect = (inst) => {
		if (inst.is_fake) return

		setState({...state, selectedInst: inst, noAccess: false, firstLoad: false})
		setUrl(inst)
	}

	const onCopy = (instId, newTitle, newPerm, inst) => {
		// Clears the overflow hidden from the modal
		document.body.style.overflow = 'auto'
		setState({...state, selectedInst: null})
		
		copyWidget.mutate({
			instId: instId, 
			title: newTitle, 
			copyPermissions: newPerm,
			widgetName: inst.widget.name,
			dir: inst.widget.dir
		})
	}

	const onDelete = (inst) => {
		setState({...state, selectedInst: null})

		deleteWidget.mutate({
			instId: inst.id
		})
	}

	// Sets widget id in the url
	const setUrl = (inst) => {
		window.history.pushState(document.body.innerHTML, document.title, `#${inst.id}`);
	}

	return (
		<>
			<Header />
			<div className="my_widgets">

				{!isFetching && (!widgets || widgets?.length === 0)
					? <div className="qtip top nowidgets">
							Click here to start making a new widget!
						</div>
					: null

				}

				<div className="container">
					<div>
						{(isFetching || state.firstLoad)
							? <section className="directions no-widgets">
								<h1>Loading.</h1>
								<p>Just a sec...</p>
							</section>
							: null
						}

						{!isFetching && state.noAccess
							? <section className="directions error">
								<div className="error error-nowidget">
									<p className="errorWindowPara">
										You do not have access to this widget or this widget does not exist.
									</p>
								</div>
							</section>
							: null
						}

						{!isFetching && widgets?.length < 1 && !state.noAccess
							? <section className="directions no-widgets">
									<h1>You have no widgets!</h1>
									<p>Make a new widget in the widget catalog.</p>
								</section>
							: null
						}

						{(!isFetching || widgets?.length > 0) && !state.selectedInst && !state.noAccess && !state.firstLoad
							? <section className="directions unchosen">
									<h1>Your Widgets</h1>
									<p>Choose a widget from the list on the left.</p>
								</section>
							: null
						}

						{(!isFetching || widgets?.length > 0) && state.selectedInst && !state.noAccess
							? <MyWidgetSelectedInstance
								inst={state.selectedInst}
								onDelete={onDelete}
								onCopy={onCopy}
								currentUser={user}
								myPerms={state.myPerms}
								otherUserPerms={state.otherUserPerms}
								setOtherUserPerms={(p) => setState({...state, otherUserPerms: p})}
							/>
							: null
						}

					</div>
					<MyWidgetsSideBar
						isLoading={isFetching}
						instances={widgets}
						selectedId={state.selectedInst ? state.selectedInst.id : null}
						onClick={onSelect}
						Card={MyWidgetsInstanceCard}
					/>
				</div>
			</div>
		</>
	)
}

export default MyWidgetsPage
