import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from 'react-query'
import { apiGetWidgetInstances, apiGetUser, readFromStorage, apiGetUserPermsForInstance } from '../util/api'
import rawPermsToObj from '../util/raw-perms-to-object'
import Header from './header'
import MyWidgetsSideBar from './my-widgets-side-bar'
import MyWidgetSelectedInstance from './my-widgets-selected-instance'
import LoadingIcon from './loading-icon'
import useCopyWidget from './hooks/useCopyWidget'
import useDeleteWidget from './hooks/useDeleteWidget'
import useKonamiCode from './hooks/useKonamiCode'
import './css/beard-mode.scss'
import './my-widgets-page.scss'

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

const randomBeard = () => {
	const beard_vals = ['black_chops', 'dusty_full', 'grey_gandalf', 'red_soul']
	return beard_vals[getRandomInt(0, 3)]
}

const initState = () => {
	return({
		selectedInst: null,
		otherUserPerms: null,
		myPerms: null,
		noAccess: false,
		loading: true,
		currentBeard: ''
	})
}

const localBeard = window.localStorage.beardMode

const MyWidgetsPage = () => {
	const [state, setState] = useState(initState())
	const [beardMode, setBeardMode] = useState(!!localBeard ? localBeard === 'true' : false)
	const validCode = useKonamiCode()
	const copyWidget = useCopyWidget()
	const deleteWidget = useDeleteWidget()
	readFromStorage()
	const { data: widgets, isLoading } = useQuery({
		queryKey: 'widgets',
		queryFn: apiGetWidgetInstances,
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

	useEffect(() => {
		if (validCode) {
			window.localStorage.beardMode = !beardMode
			setBeardMode(!beardMode)
		}
	}, [validCode])

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
		if (!isLoading) {
			setWidgetFromUrl(widgets)
		}
	}, [isLoading])

	useEffect(() => {
		// Clears the current widget if it no longer exists
		if (widgets && state.selectedInst && !widgets.some(widget => widget.id === state.selectedInst.id)) {
			setState({...state, selectedInst: null})
		}
	}, [widgets?.length])

	// Sets the current widget to what's in the URL when the widgets load
	const setWidgetFromUrl = (widgets) => {
		if (!state.loading) return // Blocks the function from running after first use

		const url = window.location.href
		const url_id = url.split('#')[1]

		if (url_id && (!state.selectedInst || state.selectedInst.id !== url_id)) {
			for (let i = 0; i < widgets.length; i++) {
				if (widgets[i].id === url_id) {
					onSelect(widgets[i], i)
					return
				}
			}

			// User doesn't have access to the widget
			setState({...state, loading: false, noAccess: true})
		}
		else setState({...state, loading: false})
	}

	const onSelect = (inst, index) => {
		if (inst.is_fake) return

		setState({...state, selectedInst: inst, noAccess: false, loading: false, currentBeard: beards[index]})
		setUrl(inst)
	}

	const onCopy = (instId, newTitle, newPerm, inst) => {
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

	const beards = useMemo(
		() => {
			const result = []
			widgets?.forEach(() => {
				result.push(randomBeard())
			})
			return result
		},
		[widgets]
	)

	return (
		<>
			<Header />
			<div className="my_widgets">

				{!isLoading && (!widgets || widgets?.length === 0)
					? <div className="qtip top nowidgets">
							Click here to start making a new widget!
						</div>
					: null
				}

				<div className="container">
					<div>
						{(isLoading || state.loading)
							? <section className="directions no-widgets">
								<h1 className='loading-text'>Loading</h1>
								<LoadingIcon size="lrg"/>
							</section>
							: null
						}

						{!isLoading && state.noAccess
							? <section className="directions error">
								<div className="error error-nowidget">
									<p className="errorWindowPara">
										You do not have access to this widget or this widget does not exist.
									</p>
								</div>
							</section>
							: null
						}

						{!isLoading && widgets?.length < 1 && !state.noAccess
							? <section className="directions no-widgets">
									<h1>You have no widgets!</h1>
									<p>Make a new widget in the widget catalog.</p>
								</section>
							: null
						}

						{(!isLoading || widgets?.length > 0) && !state.selectedInst && !state.noAccess && !state.loading
							? <section className={`directions unchosen ${beardMode ? 'bearded' : ''}`}>
									<h1>Your Widgets</h1>
									<p>Choose a widget from the list on the left.</p>
								</section>
							: null
						}

						{(!isLoading || widgets?.length > 0) && state.selectedInst && !state.noAccess
							? <MyWidgetSelectedInstance
								inst={state.selectedInst}
								onDelete={onDelete}
								onCopy={onCopy}
								currentUser={user}
								myPerms={state.myPerms}
								otherUserPerms={state.otherUserPerms}
								setOtherUserPerms={(p) => setState({...state, otherUserPerms: p})}
								beardMode={beardMode}
								beard={state.currentBeard}
							/>
							: null
						}

					</div>
					<MyWidgetsSideBar
						key="widget-side-bar"
						isLoading={isLoading}
						instances={widgets}
						selectedId={state.selectedInst ? state.selectedInst.id : null}
						onClick={onSelect}
						beardMode={beardMode}
						beards={beards}
					/>
				</div>
			</div>
		</>
	)
}

export default MyWidgetsPage
