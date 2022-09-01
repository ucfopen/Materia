import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from 'react-query'
import { apiGetWidgetInstances, apiGetPaginatedWidgetInstances, apiGetUser, readFromStorage, apiGetUserPermsForInstance } from '../util/api'
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
import { cssNumber } from 'jquery'

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
	return ({
		selectedInst: null,
		otherUserPerms: null,
		myPerms: null,
		noAccess: false,
		loading: true,
		postFetch: false, // Used to wait for changes to the widgets list after the initial fetch - copy or delete
		widgetHash: window.location.href.split('#')[1],
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

	const [page, setPage] = useState(1)
	const [widgetsList, setWidgetsList] = useState([])
	const {
		data,
		isLoading,
		isFetching,
		refetch,
	} = useQuery('widgets', () => apiGetPaginatedWidgetInstances(page), { keepPreviousData: true, refetchOnWindowFocus: false, })

	const { data: user } = useQuery({
		queryKey: 'user',
		queryFn: apiGetUser,
		staleTime: Infinity
	})
	const { data: permUsers } = useQuery({
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
			for (const i in permUsers.widget_user_perms) {
				othersPerms.set(i, rawPermsToObj(permUsers.widget_user_perms[i], isEditable))
			}
			let _myPerms
			for (const i in permUsers.user_perms) {
				_myPerms = rawPermsToObj(permUsers.user_perms[i], isEditable)
			}
			setState({ ...state, otherUserPerms: othersPerms, myPerms: _myPerms })
		}
	}, [state.selectedInst, JSON.stringify(permUsers)])

	// isLoading - initial data, from cache
	// isFetching - actual data, from API
	useEffect(() => {
		if (!isFetching) {
			if (page <= data.total_num_pages) {
				setPage(page + 1)
			}
			setWidgetsList(current => [...current, ...data.pagination])
		}
	}, [isFetching])

	useEffect(() => {
		if (state.postFetch) {
			checkPreselectedWidgetAccess(widgetsList)
		}
	}, [data])

	useEffect(() => {
		checkPreselectedWidgetAccess(widgetsList)

		// triggers the final refetch for retrieving the final page.
		if (page == data?.total_num_pages) { refetch() }
	}, [widgetsList])

	// If a widget ID was provided in the URL or a widget was selected from the sidebar before the API finished
	//  fetching, double-check that the current user actually has access to it
	const checkPreselectedWidgetAccess = widgets => {
		if (!state.loading) return // Blocks the function from running after first use

		// if (state.widgetHash && (!state.selectedInst || state.selectedInst.id !== state.widgetHash)) {
		if (state.widgetHash || state.selectedInst) {
			const desiredId = state.widgetHash ? state.widgetHash : state.selectedInst.id

			const selectWidget = state.widgetHash && (!state.selectedInst || state.selectedInst.id !== state.widgetHash)

			let widgetFound = false

			for (let i = 0; i < widgets.length; i++) {
				if (widgets[i].id === desiredId) {
					if (selectWidget) {
						return onSelect(widgets[i], i)
					}
					widgetFound = true
					break
				}
			}
			// always set loading to false and noAccess to whether we found a matching instance or not
			const newState = { ...state, loading: false, noAccess: !widgetFound, postFetch: false }

			// if we didn't find a matching instance for either case, make sure there isn't a selected instance
			if (!widgetFound) newState.selectedInst = null
			setState(newState)
		} else if (state.postFetch) {
			// We're updating the selected widget following a post-fetch change - probably a delete
			// With no given instance ID to select, just select the topmost one in the list
			return onSelect(widgets[0], 0)
		}
		else setState({ ...state, loading: false, postFetch: false })
	}

	const onSelect = (inst, index) => {
		if (inst.is_fake) return

		setState({ ...state, selectedInst: inst, noAccess: false, currentBeard: beards[index], postFetch: false })
		setUrl(inst)
	}

	const onCopy = (instId, newTitle, newPerm, inst) => {
		setState({ ...state, selectedInst: null })
		console.log(inst.widget)
		copyWidget.mutate(
			{
				instId: instId,
				title: newTitle,
				copyPermissions: newPerm,
				widgetName: inst.widget.name,
				dir: inst.widget.dir
			},
			{
				// Still waiting on the widget list to refresh, return to a 'loading' state and indicate a post-fetch change is coming.
				onSettled: newInstId => {
					// Setting selectedInst to null again to avoid race conditions.
					setState({ ...state, selectedInst: null, widgetHash: newInstId, postFetch: true, loading: true })
				}
			}
		)
	}

	const onDelete = inst => {
		setState({ ...state, selectedInst: null, widgetHash: null })

		deleteWidget.mutate(
			{
				instId: inst.id
			},
			{
				// Still waiting on the widget list to refresh, return to a 'loading' state and indicate a post-fetch change is coming.
				onSettled: () => {
					// Setting selectedInst and widgetHash to null again to avoid race conditions.
					setState({ ...state, selectedInst: null, widgetHash: null, postFetch: true, loading: true })
				}
			}
		)
	}

	// Sets widget id in the url
	const setUrl = inst => window.history.pushState(document.body.innerHTML, document.title, `#${inst.id}`)

	const beards = useMemo(
		() => {
			const result = []
			widgetsList?.forEach(() => {
				result.push(randomBeard())
			})
			return result
		},
		[data]
	)

	let widgetCatalogCalloutRender = null
	if (!isFetching && (!widgetsList || widgetsList?.pagination?.length === 0)) {
		widgetCatalogCalloutRender = (
			<div className='qtip top nowidgets'>
				Click here to start making a new widget!
			</div>
		)
	}

	// Go through a series of cascading conditional checks to determine what will be rendered on the right side of the page
	const mainContentRender = () => {
		if (isLoading) {
			return <section className='directions no-widgets'>
				<h1 className='loading-text'>Loading</h1>
				<LoadingIcon size='lrg' />
			</section>
		}

		const widgetSpecified = (state.widgetHash || state.selectedInst)

		if (isFetching && widgetSpecified) {
			return <section className='directions error'>
				<div className='error error-nowidget'>
					<p className='errorWindowPara'>
						Almost done! Just making sure you have access to this widget.
					</p>
				</div>
			</section>
		}

		if (state.noAccess) {
			return <section className='directions error'>
				<div className='error error-nowidget'>
					<p className='errorWindowPara'>
						You do not have access to this widget or this widget does not exist.
					</p>
				</div>
			</section>
		}

		if (widgetsList?.length < 1) {
			return <section className='directions no-widgets'>
				<h1>You have no widgets!</h1>
				<p>Make a new widget in the widget catalog.</p>
			</section>
		}

		if (!widgetSpecified) {
			return <section className={`directions unchosen ${beardMode ? 'bearded' : ''}`}>
				<h1>Your Widgets</h1>
				<p>Choose a widget from the list on the left.</p>
			</section>
		}

		if (state.selectedInst) {
			return <MyWidgetSelectedInstance
				inst={state.selectedInst}
				onDelete={onDelete}
				onCopy={onCopy}
				currentUser={user}
				myPerms={state.myPerms}
				otherUserPerms={state.otherUserPerms}
				setOtherUserPerms={(p) => setState({ ...state, otherUserPerms: p })}
				beardMode={beardMode}
				beard={state.currentBeard}
			/>
		}
	}

	return (
		<>
			<Header />
			<div className='my_widgets'>

				{widgetCatalogCalloutRender}

				<div className='container'>
					<div>
						{mainContentRender()}
					</div>
					<MyWidgetsSideBar
						key='widget-side-bar'
						isLoading={isLoading}
						instances={widgetsList}
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