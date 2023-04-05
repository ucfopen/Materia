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

// Helper function to sort widgets
const _compareWidgets = (a, b) => { return (b.created_at - a.created_at) }

const localBeard = window.localStorage.beardMode

const MyWidgetsPage = () => {
	readFromStorage()
	const [state, setState] = useState({
		page: 1,
		totalPages: 0,
		widgetList: [],
		selectedInst: null,
		otherUserPerms: null,
		myPerms: null,
		noAccess: false,
		loadingWidgets: true,
		widgetHash: window.location.href.split('#')[1],
		currentBeard: ''
	})
	const [invalidLogin, setInvalidLogin] = useState(false);

	const [beardMode, setBeardMode] = useState(!!localBeard ? localBeard === 'true' : false)
	const validCode = useKonamiCode()
	const copyWidget = useCopyWidget()
	const deleteWidget = useDeleteWidget()
	const {
		data,
		isLoading,
		isFetching,
	} = useQuery(
		['widgets', state.page],
		() => apiGetWidgetInstances(state.page),
		{
			keepPreviousData: true,
			refetchOnWindowFocus: false,
			onSuccess: (data) => {
				if (!data || data.type == 'error')
				{
					console.error(`Widget instances failed to load with error: ${data.msg}`);
					if (data.title =="Invalid Login")
					{
						setInvalidLogin(true)
					}
				}
				// Removes duplicates
				let widgetSet = new Set([...(data.pagination ? data.pagination : []), ...state.widgetList])

				setState({
					...state,
					totalPages: data.total_num_pages || state.totalPages,
					widgetList: [...widgetSet].sort(_compareWidgets)
				})
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

	useEffect(() => {
		if (validCode) {
			window.localStorage.beardMode = !beardMode
			setBeardMode(!beardMode)
		}
	}, [validCode])

	useEffect(() => {
		if (invalidLogin)
		{
			window.location.reload();
		}
	}, [invalidLogin])

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

	useEffect(() => {
		// forcedRefresh flag is enabled when the widgetList is purged manually by copying or deleting an instance
		if (state.forcedRefresh) {
			setState({...state, forcedRefresh: false, loadingWidgets: true})
		}
		// pagination in progress but incomplete
		// this triggers the 'widgets' query
		else if (state.page < state.totalPages) {
			setState({...state, page: state.page + 1})
		}
		// pagination complete, widgetList assumed to be fully loaded
		else {
			// if a widget hash exists in the URL OR a widget is already selected in state
			if ((state.widgetHash && state.widgetHash.length > 0) || state.selectedInst) {
				let desiredId = state.widgetHash ? state.widgetHash : state.selectedInst.id
				// should the widget be selected?
				let selectWidget = state.widgetHash && (!state.selectedInst || state.selectedInst.id != state.widgetHash)

				// locate the desired widget instance from the widgetList
				let widgetFound = null
				state.widgetList.forEach((widget, index) => {
					if (widget.id == desiredId) {
						widgetFound = widget
						if (selectWidget) onSelect(widget, index)
					}
				})

				setState({
					...state,
					selectedInst: widgetFound,
					loadingWidgets: false,
					noAccess: widgetFound == null,
				})
			} else {
				// no instance selected (either in state or the url), for example when the my-widgets page is first loaded
				setState({ ...state, loadingWidgets: false})
			}
		}
	}, [state.widgetList])

	useEffect(() => {
		if (isLoading == true) {
			setState({ ...state, loadingWidgets: true})
		}
	}, [isLoading])

	/**
	 * If we have a widget ID in the URL, select that widget. If we don't, select the first widget in the
	 * list
	 * @param {array} widgets
	 * @returns the onSelect function with the parameters of widgets[0] and 0.
	 */

	/**
	 * It sets the state of the app to the selected to the selected widget instance by the user.
	 * @param {string} inst
	 * @param {int} index
	 * @return nothing
	 */
	const onSelect = (inst, index) => {
		if (inst.is_fake) return

		setState({ ...state, selectedInst: inst, noAccess: false, currentBeard: beards[index], loadingWidgets: false })
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

		copyWidget.mutate(
			{
				instId: instId,
				title: newTitle,
				copyPermissions: newPerm,
				widgetName: inst.widget.name,
				dir: inst.widget.dir,
				successFunc: (data) => {
					if (!data || (data.type == 'error'))
					{
						console.error(`Failed to copy widget with error: ${data.msg}`);
						if (data.title == "Invalid Login")
						{
							setInvalidLogin(true)
						}
					}
				}
			},
			{
				// Still waiting on the widget list to refresh, return to a 'loading' state and indicate a post-fetch change is coming.
				onSettled: newInstId => {
					// Setting selectedInst to null again to avoid race conditions.
					setState({
						...state,
						selectedInst: null,
						widgetHash: newInstId,
						page: 1,
						widgetList: [],
						forcedRefresh: true
					})
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

		deleteWidget.mutate(
			{
				instId: inst.id,
				successFunc: (data) => {
					if (!data || (data.type == 'error')) 
					{
						console.error(`Deletion failed with error: ${data.msg}`);
						if (data.title =="Invalid Login")
						{
							setInvalidLogin(true)
						}
					}
				}
			},
			{
				// Still waiting on the widget list to refresh, return to a 'loading' state and indicate a post-fetch change is coming.
				onSettled: () => {
					setState({
						...state,
						selectedInst: null,
						widgetHash: null,
						page: 1,
						widgetList: [],
						forcedRefresh: true
					})
				}
			}
		)
	}

	const onEdit = (inst) => {
		setState({
			...state,
			selectedInst: inst,
			widgetHash: inst.id,
			page: 1,
			widgetList: [],
			forcedRefresh: true
		})
	}

	/**
	 * It takes an instance of a component and sets the URL to the component's ID.
	 * @param {object}
	 */
	const setUrl = inst => window.history.pushState(document.body.innerHTML, document.title, `#${inst.id}`)

	const beards = useMemo(
		() => {
			const result = []
			state.widgetList?.forEach(() => {
				result.push(randomBeard())
			})
			return result
		},
		[data]
	)

	let widgetCatalogCalloutRender = null
	if (!isFetching && (!state.widgetList || state.widgetList?.pagination?.length === 0)) {
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
		if (state.loadingWidgets) {
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

		if (state.widgetList?.length < 1) {
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
				onEdit={onEdit}
				currentUser={user}
				myPerms={state.myPerms}
				otherUserPerms={state.otherUserPerms}
				setOtherUserPerms={(p) => setState({ ...state, otherUserPerms: p })}
				beardMode={beardMode}
				beard={state.currentBeard}
				setInvalidLogin={setInvalidLogin}
			/>
		}
	}

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
						instances={state.widgetList}
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