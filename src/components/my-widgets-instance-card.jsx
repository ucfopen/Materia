import React from 'react'
import { iconUrl } from '../util/icon-url'

const MyWidgetsInstanceCard = ({inst, indexVal, hidden = false, selected = false, onClick = () => {}, beard=""}) => {
	const {id, widget, name, is_draft} = inst
	return (
		<div
			id={`widget_${id}`}
			className={`my-widgets-instance-card widget small_${beard} bearded ${hidden ? 'hidden' : ''} ${is_draft ? 'is_draft' : ''} ${selected ? 'gameSelected' : ''} ${beard ? 'bearded' : ''} `}
			onClick={() => {onClick(inst, indexVal)}}
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
