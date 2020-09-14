import React, { useState, useCallback, useEffect } from 'react'
import Header from './header'
import './my-widgets-page.scss'
import MyWidgetsInstanceCard from './my-widgets-instance-card'
import MyWidgetsSideBar from './my-widgets-side-bar'
import MyWidgetSelectedInstance from './my-widgets-selected-instance'
import fetchOptions from '../util/fetch-options'

const fetchWidgets = () => fetch('/api/json/widget_instances_get/', fetchOptions({body: 'data=%5B%5D'}))
const fetchCopyWidget = (id, title, copyPermissions) => fetch('/api/json/widget_instance_copy', fetchOptions({body: `data=%5B%22${id}%22%2C%22${encodeURIComponent(title)}%22%2C${copyPermissions?'true':'false'}%5D`}))

const MyWidgetsPage = () => {
	const [noAccess, setNoAccess] = useState(false)
	const [selectedInst, setSelectedInst] = useState(null)
	const [isLoading, setIsLoading] = useState(true)
	const [widgets, setWidgets] = useState([])

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

	const onCopy = useCallback(
		(instId, title, copyPermissions) => {
			setIsLoading(true)
			setSelectedInst(null)
			fetchCopyWidget(instId, title, copyPermissions)
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
								refreshWidgets={refreshWidgets}
							/>
							: null
						}

					</div>
					<MyWidgetsSideBar
						isLoading={isLoading}
						instances={widgets}
						selectedId={selectedInst ? selectedInst.id : null}
						onClick={setSelectedInst}
						Card={MyWidgetsInstanceCard}
					/>

				</div>
			</div>

		</>
	)
}

export default MyWidgetsPage
