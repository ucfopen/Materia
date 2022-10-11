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

// Helper function to sort widgets
const _compareWidgets = (a, b) => { return (b.created_at - a.created_at) }

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
	readFromStorage()
	const [state, setState] = useState(initState())
	const [beardMode, setBeardMode] = useState(!!localBeard ? localBeard === 'true' : false)
	const validCode = useKonamiCode()
	const copyWidget = useCopyWidget()
	const deleteWidget = useDeleteWidget()
	const [widgetCopy, setWidgetCopy] = useState(false)
	const [widgetDelete, setWidgetDelete] = useState(false)
	const [loadingWidgets, setLoadingWidgets] = useState(true)
	const [page, setPage] = useState(1)
	const [widgetsList, setWidgetsList] = useState([])
	const {
		data,
		isLoading,
		isFetching,
		refetch,
	} = useQuery(
		'widgets',
		() => apiGetWidgetInstances(page),
		{
			keepPreviousData: true,
			refetchOnWindowFocus: false,
			onSuccess: (data) => {

				if (widgetCopy == true) { setWidgetCopy(false) }
				else {

					if (page <= data.total_num_pages && !widgetCopy) {
						setWidgetsList(current => [...current, ...data.pagination].sort(_compareWidgets))

					} else { //
						if (!widgetDelete) {
							let temp = widgetsList
							temp.unshift(data.pagination[0]) // place the new copy inst in the current widgetList.
							setWidgetsList(temp) // no need for sorting since the new copy is appended to the beginning.
							setWidgetDelete(false)
						}
					}
					setPage(page + 1)
				}

			},
		})

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

	/**
	 * If we have a widget ID in the URL, select that widget. If we don't, select the first widget in the
	 * list
	 * @param {array} widgets
	 * @returns the onSelect function with the parameters of widgets[0] and 0.
	 */
	const checkPreselectedWidgetAccess = widgets => {
		// If a widget ID was provided in the URL or a widget was selected from the sidebar before the API finished
		// fetching, double-check that the current user actually has access to it
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

	/**
	 * It sets the state of the app to the selected to the selected widget instance by the user.
	 * @param {string} inst
	 * @param {int} index
	 * @return nothing
	 */
	const onSelect = (inst, index) => {
		if (inst.is_fake) return

		setState({ ...state, selectedInst: inst, noAccess: false, currentBeard: beards[index], postFetch: false })
		setUrl(inst)
	}

	/**
	 * Creates a copy of currently selected widget.
	 * @param {string} instId
	 * @param {string} newTitle
	 * @param {boolean} newPerm
	 * @param {object} inst
	 * @return nothing
	 */
	const onCopy = (instId, newTitle, newPerm, inst) => {
		setState({ ...state, selectedInst: null })
		data.pagination = [...widgetsList]
		setLoadingWidgets(true)
		setWidgetCopy(true)
		setPage(1)

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

	/**
	 * When the user clicks the delete button, delete the widget and set the state to a loading state.
	 * The first thing we do is set the state to null. This is to avoid race conditions
	 * @param {object} inst
	 * @return null
	 */
	const onDelete = inst => {
		setState({ ...state, selectedInst: null, widgetHash: null })
		setWidgetDelete(true)

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

	/**
	 * It takes an instance of a component and sets the URL to the component's ID.
	 * @param {object}
	 */
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

	/**
	 * If the user is loading, show a loading screen. If the user is fetching, show a loading screen. If
	 * the user has no widgets, show a message. If the user has no selected widget, show a message. If the
	 * user has a selected widget, show the widget
	 * @returns The main content of the page.
	 */
	const mainContentRender = () => {
		// Go through a series of cascading conditional checks to determine what will be rendered on the right side of the page
		// The function is trigger only once; Which cause complication when using pagination.
		if (loadingWidgets || isLoading) {
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

	// The state.postFetch does NOT contribute to anything at this point.
	useEffect(() => {
		if (page <= data?.total_num_pages) { refetch() }
		if (page >= data?.total_num_pages) { setLoadingWidgets(false) } // if change to else the loading in not display.
		if (widgetCopy) { setPage(data.total_num_pages + 2) }
		checkPreselectedWidgetAccess(widgetsList)
	}, [page, widgetsList])

	useEffect(() => {
		setState({ ...state, loading: true })
	}, [loadingWidgets])

	// ones a copy is exec a refetch
	useEffect(() => {
		if (widgetCopy) { refetch() }
	}, [widgetCopy])

	return (
		<>
			<Header />
			<div className='my_widgets'>

				{widgetCatalogCalloutRender}

				<div className='container'>
					<div className="container_main-content">
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