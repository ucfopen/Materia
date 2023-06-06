import React, { useState, useEffect} from 'react'
import { iconUrl } from '../util/icon-url'

const Summary = () => {

	const [name, setName] = useState(null)
	const [icon, setIcon] = useState(null)
	const [avail, setAvail] = useState(null)

	useEffect(() => {
		waitForWindow().then(() => {
			setName(window.NAME)
			setIcon(iconUrl(`${window.ICON_DIR}`,'',92))
			setAvail(window.AVAIL)
		})
	})

	const waitForWindow = async () => {
		while(!window.hasOwnProperty('NAME')
		&& !window.hasOwnProperty('ICON_DIR')) {
			await new Promise(resolve => setTimeout(resolve, 500))
		}
	}

	let bodyRender = null
	if (!!name) {
		bodyRender = (
			<section className="widget_info">
				<div className="widget_icon">
					<img src={ icon } alt=""/>
				</div>
				<ul className="widget_about">
					{ name && <li className="widget_name">{ name }</li>}
					{ avail && <li className="widget_availability">{ avail }</li>}
				</ul>
			</section>
		)
	}

	return (
		<>
			{ bodyRender }
		</>
	)
}

export default Summary
