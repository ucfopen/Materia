import React, { useState, useCallback, useEffect } from 'react'
import Header from './header'
import './my-widgets-page.scss'
import MyWidgetsInstanceCard from './my-widgets-instance-card'
import MyWidgetsSideBar from './my-widgets-side-bar'
import MyWidgetSelectedInstance from './my-widgets-selected-instance'
import fetchOptions from '../util/fetch-options'

const fetchWidgets = () => fetch('/api/json/widget_instances_get/', fetchOptions({body: `data=${encodeURIComponent('[]')}`}))
const fetchCopyInstance = (instId, title, copyPermissions) => fetch('/api/json/widget_instance_copy', fetchOptions({body: 'data=' + encodeURIComponent(`["${instId}","${title}","${copyPermissions.toString()}"]`)}))
const fetchCurrentUser = () => fetch('/api/json/user_get', fetchOptions({body: `data=${encodeURIComponent('[]')}`}))
const fetchUserPermsForInstance = (instId) => fetch('/api/json/permissions_get', fetchOptions({body: 'data=' + encodeURIComponent(`["4","${instId}"]`)}))

const PERM_VISIBLE = 1
const PERM_PLAY = 5
const PERM_SCORE = 10
const PERM_DATA = 15
const PERM_EDIT = 20
const PERM_COPY = 25
const PERM_FULL = 30
const PERM_SHARE = 35
const PERM_SU = 90

const rawPermsToObj = ([permCode = PERM_VISIBLE, expireTime = null], isEditable) => {
	console.log('code', permCode)
	permCode = parseInt(permCode, 10)
	return {
		accessLevel: permCode,
		expireTime,
		editable: permCode > PERM_VISIBLE && (parseInt(isEditable, 10) === 1),
		shareable: permCode > PERM_VISIBLE, // old, but difficult to replace with can.share :/
		can: {
			view: [PERM_VISIBLE, PERM_COPY, PERM_SHARE, PERM_FULL, PERM_SU].includes(permCode),
			copy: [PERM_COPY, PERM_SHARE, PERM_FULL, PERM_SU].includes(permCode),
			edit: [PERM_FULL, PERM_SU].includes(permCode),
			delete: [PERM_FULL, PERM_SU].includes(permCode),
			share: [PERM_SHARE, PERM_FULL, PERM_SU].includes(permCode)
		}
	}
}

const MyWidgetsPage = () => {
	const [noAccess, setNoAccess] = useState(false)
	const [selectedInst, setSelectedInst] = useState(null)
	const [isLoading, setIsLoading] = useState(true)
	const [widgets, setWidgets] = useState([])
	const [user, setUser] = useState(null)
	const [otherUserPerms, setOtherUserPerms] = useState(null)
	const [myPerms, setMyPerms] = useState(null)

	const refreshWidgets = useCallback(
		() => {
			fetchWidgets()
			.then(resp => resp.json())
			.then(widgets => {
				setIsLoading(false)
				setWidgets(widgets)
			})
		}, []
	)

	const onSelect = (inst) => {
		setSelectedInst(inst)

		fetchUserPermsForInstance(inst.id)
			.then(resp => resp.json())
			.then(perms => {
				const isEditable = inst.widget.is_editable === "1"
				const othersPerms = new Map()
				for(const i in perms.widget_user_perms){
					othersPerms.set(i, rawPermsToObj(perms.widget_user_perms[i], isEditable))
				}
				let myPerms
				for(const i in perms.user_perms){
					myPerms = rawPermsToObj(perms.user_perms[i], isEditable)
				}
				setMyPerms(myPerms)
				setOtherUserPerms(othersPerms)
			})

	}

	const onCopy = useCallback(
		(instId, title, copyPermissions) => {
			setIsLoading(true)
			setSelectedInst(null)
			fetchCopyInstance(instId, title, copyPermissions)
			.then(refreshWidgets)
		}, []
	)

	const onDelete = useCallback(
		inst => {
			setIsLoading(true)
			setSelectedInst(null)

			fetch('/api/json/widget_instance_delete/', fetchOptions({body:`data=%5B%22${inst.id}%22%5D`}))
			.then(refreshWidgets)
		}, []
	)

	// load instances after initial render
	useEffect(() => {
		refreshWidgets()
		fetchCurrentUser()
			.then(resp => resp.json())
			.then(user => {
				setUser(user)
			})
	}, [])

	return (
		<>
			<Header />
			<div className="my_widgets">

				{!isLoading && widgets.length == 0
					? <div className="qtip top nowidgets">
							Click here to start making a new widget!
						</div>
					: null

				}

				<div className="container">
					<div>
						{isLoading
							? <section className="directions no-widgets">
								<h1>Loading.</h1>
								<p>Just a sec...</p>
							</section>
							: null
						}

						{!isLoading && noAccess
							? <section className="directions error">
								<div className="error error-nowidget">
									<p className="errorWindowPara">
										You do not have access to this widget or this widget does not exist.
									</p>
								</div>
							</section>
							: null
						}

						{!isLoading && widgets.length < 1 && !noAccess
							? <section className="directions no-widgets">
									<h1>You have no widgets!</h1>
									<p>Make a new widget in the widget catalog.</p>
								</section>
							: null
						}

						{!isLoading && widgets.length > 0 && !selectedInst && !noAccess
							? <section className="directions unchosen">
									<h1>Your Widgets</h1>
									<p>Choose a widget from the list on the left.</p>
								</section>
							: null
						}

						{!isLoading && selectedInst
							? <MyWidgetSelectedInstance
								inst={selectedInst}
								onDelete={onDelete}
								onCopy={onCopy}
								currentUser={user}
								myPerms={myPerms}
								otherUserPerms={otherUserPerms}
								setOtherUserPerms={(p) => setOtherUserPerms(p)}
								refreshWidgets={refreshWidgets}
							/>
							: null
						}

					</div>
					<MyWidgetsSideBar
						isLoading={isLoading}
						instances={widgets}
						selectedId={selectedInst ? selectedInst.id : null}
						onClick={onSelect}
						Card={MyWidgetsInstanceCard}
					/>

				</div>
			</div>

		</>
	)
}

export default MyWidgetsPage
