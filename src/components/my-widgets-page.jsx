import React, { useState, useMemo, useEffect } from 'react'
import ReactDOM from 'react-dom'
import Header from './header'
import './my-widgets-page.scss'
import MyWidgetsInstanceCard from './my-widgets-instance-card'
import MyWidgetsSideBar from './my-widgets-side-bar'
import MyWidgetSelectedInstance from './my-widgets-selected-instance'

const MyWidgetsPage = () => {
	const [noAccess, setNoAccess] = useState(false)
	const [selectedInst, setSelectedInst] = useState(null)
	const [isLoading, setIsLoading] = useState(true)
	const [widgets, setWidgets] = useState([])

	// load instances after initial render
	useEffect(() => {
		const options = {
			"headers": {
			  "cache-control": "no-cache",
			  "pragma": "no-cache",
			  "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
			},
			"body": "data=%5B%5D",
			"method": "POST",
			"mode": "cors",
			"credentials": "include"
		  }

		fetch('/api/json/widget_instances_get/', options)
			.then(resp => resp.json())
			.then(widgets => {
				setIsLoading(false)
				setWidgets(widgets)
				// setSelectedInst(widgets[0])
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
							? <MyWidgetSelectedInstance inst={selectedInst} />
							: null
						}

					</div>

					<MyWidgetsSideBar
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
