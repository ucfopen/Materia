import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from 'react-query'
import { apiGetUser, readFromStorage, apiGetUserPermsForInstance } from '../util/api'
import rawPermsToObj from '../util/raw-perms-to-object'
import Header from './header'
import MyWidgetsSideBar from './my-widgets-side-bar'
import MyWidgetSelectedInstance from './my-widgets-selected-instance'
import InvalidLoginModal from './invalid-login-modal'
import LoadingIcon from './loading-icon'
import useInstanceList from './hooks/useInstanceList'
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

const localBeard = window.localStorage.beardMode

const MyWidgetsPage = () => {
	readFromStorage()
	const [state, setState] = useState({
		selectedInst: null,
		otherUserPerms: null,
		myPerms: null,
		noAccess: false,
		widgetHash: window.location.href.split('#')[1]?.split('-')[0],
		currentBeard: ''
	})

	const instanceList = useInstanceList()
	const [invalidLogin, setInvalidLogin] = useState(false)
	const [showCollab, setShowCollab] = useState(false)

	const [beardMode, setBeardMode] = useState(!!localBeard ? localBeard === 'true' : false)
	const validCode = useKonamiCode()
	const copyWidget = useCopyWidget()
	const deleteWidget = useDeleteWidget()

	const { data: user } = useQuery({
		queryKey: 'user',
		queryFn: apiGetUser,
		staleTime: Infinity
	})

	const { data: permUsers } = useQuery({
		queryKey: ['user-perms', state.selectedInst?.id, state.widgetHash],
		queryFn: () => apiGetUserPermsForInstance(state.selectedInst?.id),
		enabled: !!state.selectedInst && !!state.selectedInst.id && state.selectedInst?.id !== undefined,
		placeholderData: null,
		staleTime: Infinity
	})

	// konami code activate (or deactivate)
	useEffect(() => {
		if (validCode) {
			window.localStorage.beardMode = !beardMode
			setBeardMode(!beardMode)
		}
	}, [validCode])

	// hook to attach the hashchange event listener to the window
	useEffect(() => {
		window.addEventListener('hashchange', listenToHashChange)

		// check for collab hash on page load
		setShowCollab(hashContainsCollab())

		return () => {
			window.removeEventListener('hashchange', listenToHashChange)
		}
	}, [])

	// checks whether "-collab" is contained in hash id
	const hashContainsCollab = () => {
		const match = window.location.hash.match(/#(?:[A-Za-z0-9]{5})(-collab)*$/)

		if (match != null && match[1] != null)
		{
			return match[1] == '-collab'
		}
		return false
	}

	// hook associated with updates to the selected instance and perms associated with that instance
	useEffect(() => {
		if (state.selectedInst && permUsers && permUsers.user_perms?.hasOwnProperty(user.id)) {
			const isEditable = state.selectedInst.widget.is_editable === "1"
			const othersPerms = new Map()
			for (const i in permUsers.widget_user_perms) {
				othersPerms.set(parseInt(i), rawPermsToObj(permUsers.widget_user_perms[i], isEditable))
			}
			let _myPerms
			for (const i in permUsers.user_perms) {
				_myPerms = rawPermsToObj(permUsers.user_perms[i], isEditable)
			}
			setState({ ...state, otherUserPerms: othersPerms, myPerms: _myPerms })
		}
		else if (state.selectedInst && permUsers) {
			setState({...state, noAccess: true})
		}
	}, [state.selectedInst, JSON.stringify(permUsers)])

	// hook associated with updates to the widget list OR an update to the widget hash
	// if there is a widget hash present AND the selected instance does not match the hash, perform an update to the selected widget state info
	useEffect(() => {
		if (instanceList.error) setInvalidLogin(true)

		// if a widget hash exists in the URL OR a widget is already selected in state
		if ((state.widgetHash && state.widgetHash.length > 0) || state.selectedInst) {

			// the desired ID defaults to the widget hash
			// selectedInst may lag behind for several reasons, including loading of the list or changes to the hash in the url
			let desiredId = state.widgetHash ? state.widgetHash : state.selectedInst.id

			let hashParams = desiredId.split('-')
			if (hashParams.length > 1)
			{
				desiredId = hashParams[0];
			}

			// if the selected widget is loaded, go ahead and display it. The remaining widget list can comtinue to load concurrently
			if (selectedInstanceHasLoaded(desiredId)) {
				// prompt the new instance to be selected if it's different from the one in the hash (or not selected at all)
				let selectWidget = state.widgetHash && (!state.selectedInst || state.selectedInst.id != state.widgetHash)

				if (selectWidget) {
					// locate the desired widget instance from the widgetList
					let widgetFound = null
					instanceList.instances.forEach((widget, index) => {
						if (widget.id == desiredId) {
							widgetFound = widget
							if (selectWidget) onSelect(widget, index)
						}
					})

					setState({
						...state,
						selectedInst: widgetFound,
						noAccess: widgetFound == null,
					})
				}
			}
			else if (!instanceList.isFetching) {
				// widgetList is fully loaded and the selected instance is not found
				// let the user know it's missing or unavailable
				setState({
					...state,
					selectedInst: null,
					noAccess: true,
				})
			}
		}
	}, [instanceList.instances, state.widgetHash, showCollab])

	// hook to watch otherUserPerms (which despite the name also includes the current user perms)
	// if the current user is no longer in the perms list, purge the selected instance & force a re-fetch of the list
	useEffect(() => {
		if (state.selectedInst && !state.otherUserPerms?.get(user.id)) {
			setState({
				...state,
				selectedInst: null,
				widgetHash: null
			})
		}
	},[state.otherUserPerms])

	// event listener to listen to hash changes in the URL, so the selected instance can be updated appropriately
	const listenToHashChange = () => {
		const match = window.location.hash.match(/#([A-Za-z0-9]{5})(-collab)*$/)
		if (match != null && match[1] != null)
		{
			setShowCollab(hashContainsCollab())
			setState({...state, widgetHash: match[1]})
		}
	}
	// boolean to verify if the current instance list in state contains the specified instance
	const selectedInstanceHasLoaded = (inst) => {
		if (!inst) return false
		return instanceList.instances.some(instance => instance.id == inst)
	}

	// updates necessary state information for a newly selected widget
	const onSelect = (inst, index) => {
		if (inst.is_fake) return
		setState({ ...state, selectedInst: inst, widgetHash: inst.id, noAccess: false, currentBeard: beards[index] })

		// updates window URL history with current widget hash
		window.history.pushState(document.body.innerHTML, document.title, `#${inst.id}`)
	}

	// an instance has been copied: the mutation will optimistically update the widget list while the list is re-fetched from the server
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
					if (data && (data.type == 'error'))
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
				onSettled: newInst => {
					setState({
						...state,
						selectedInst: null,
						widgetHash: newInst.id
					})
				}
			}
		)
	}

	// an instance has been deleted: the mutation will optimistically update the widget list while the list is re-fetched from the server
	const onDelete = inst => {

		deleteWidget.mutate(
			{
				instId: inst.id,
				successFunc: (data) => {
					if (data && data.type == 'error')
					{
						console.error(`Error: ${data.msg}`);
						if (data.title == "Invalid Login")
						{
							setInvalidLogin(true)
						}
					} else if (!data) {
						console.error(`Delete widget failed.`);
					}
				}
			},
			{
				// Still waiting on the widget list to refresh, return to a 'loading' state and indicate a post-fetch change is coming.
				onSettled: () => {
					setState({
						...state,
						selectedInst: null,
						widgetHash: null
					})
				}
			}
		)
	}

	// Note this method is only used when a widget setting is updated via the settings dialog (attempts, availability, guest mode)
	// It is NOT called when actually editing a widget (going to the creator)
	const onEdit = (inst) => {
		setState({
			...state,
			selectedInst: inst,
			widgetHash: inst.id
		})
	}

	const beards = useMemo(
		() => {
			const result = []
			instanceList.instances?.forEach(() => {
				result.push(randomBeard())
			})
			return result
		},
		[instanceList.instances]
	)

	let widgetCatalogCalloutRender = null
	if (!instanceList.isFetching && instanceList.instances?.length === 0) {
		widgetCatalogCalloutRender = (
			<div className='qtip top nowidgets'>
				Click here to start making a new widget!
			</div>
		)
	}

	let invalidLoginRender = null
	if (invalidLogin) {
		invalidLoginRender = (
			<InvalidLoginModal onClose={() => { window.location.href = 'users/logout' }}></InvalidLoginModal>
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

		const widgetSpecified = (state.widgetHash || state.selectedInst)

		// A widget is selected, we're in the process of fetching it but it hasn't returned from the API yet
		if (instanceList.isFetching && widgetSpecified && !selectedInstanceHasLoaded(widgetSpecified)) {
			return <section className='page directions no-widgets'>
					<h2 className='loading-text'>Loading Your Widget</h2>
				</section>
		}

		// No widget specified, fetch in progress
		if (instanceList.isFetching && !widgetSpecified) {
			return <section className='page directions no-widgets'>
				<h1 className='loading-text'>Loading</h1>
			</section>
		}

		// A widget was specified but we don't have access rights to it
		if (state.noAccess) {
			return <section className='page directions no-widgets'>
				<div className='error-nowidget'>
					You do not have access to this widget or this widget does not exist.
				</div>
			</section>
		}

		// Not loading anything and no widgets returned from the API
		if (!instanceList.isFetching && instanceList.instances?.length < 1) {
			return <section className='page directions no-widgets'>
				<h1>You have no widgets!</h1>
				<p>Make a new widget in the widget catalog.</p>
			</section>
		}

		// Not loading anything, widgets are waiting to be selected
		if (!widgetSpecified) {
			return <section className={`page directions unchosen ${beardMode ? 'bearded' : ''}`}>
				<h1>Your Widgets</h1>
				<p>Choose a widget from the list on the left.</p>
			</section>
		}

		// Not loading anything, a widget is currently selected
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
				showCollab={showCollab}
				setShowCollab={setShowCollab}
			/>
		}

		// Fallback to keep the selected instance content area intact (presumably some other state is forthcoming)
		else {
			return <section className='page directions no-widgets'>
				<h1 className='loading-text'>Loading</h1>
			</section>
		}
	}

	return (
		<>
			<Header />
			<div className='my_widgets'>

				{widgetCatalogCalloutRender}
				{invalidLoginRender}

				<div className='container'>
					<div className="container_main-content">
						{mainContentRender()}
					</div>
					<MyWidgetsSideBar
						key='widget-side-bar'
						isFetching={instanceList.isFetching}
						instances={instanceList.instances}
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