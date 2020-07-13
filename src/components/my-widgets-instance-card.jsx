import React from 'react'
import ReactDOM from 'react-dom'
import { iconUrl } from '../util/icon-url'

const MyWidgetsInstanceCard = ({inst, hidden = false, selected = false, onClick = () => {}}) => {
	const {id, widget, name, is_draft, beard} = inst
	return (
		<div
			id={`widget_${id}`}
			className={`my-widgets-instance-card widget small_${beard} ${hidden ? 'hidden' : ''} ${is_draft ? 'is_draft' : ''} ${selected ? 'gameSelected' : ''} ${beard ? 'bearded' : ''} `}
			onClick={() => {onClick(inst)}}
		>
			<img className="icon" src={iconUrl('http://localhost/widget/', widget.dir, 275)} />
			<ul>
				<li className="title searchable">
					{name}
				</li>
				<li className="type searchable">
					{widget.name}
				</li>
				<li className="score">
					{is_draft ? "Draft" : ""}
				</li>
			</ul>
		</div>
	)
}

export default MyWidgetsInstanceCard