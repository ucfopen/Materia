import React, { useState, useMemo } from 'react'
import MyWidgetsInstanceCard from './my-widgets-instance-card'

const MyWidgetsSideBar = ({instances, isLoading, selectedId, onClick, beardMode, beards}) => {
	const [searchText, setSearchText] = useState('')

	const hiddenSet = useMemo(() => {
		const result = new Set()
		if(searchText == '') return result

		const re = RegExp(searchText, 'i')
		instances.forEach(i => {
			if(!re.test(`${i.name} ${i.widget.name} ${i.id}`)){
				result.add(i.id)
			}
		})

		return result
	},
	[instances, searchText])

	return (
		<aside className="my-widgets-side-bar">
			<div className="top">
				<h1>Your Widgets:</h1>
			</div>

			<div className="search">
				<div className="textbox-background"></div>
				<input
					className="textbox"
					type="text"
					value={searchText}
					onChange={(e) => {setSearchText(e.target.value)}}
				/>
				<div className="search-icon"></div>
				<div className="search-close" onClick={() => {setSearchText('')}}>x</div>
			</div>

			<div className="courses">
				<div className="widget_list" data-container="widget-list">
					{!isLoading || instances?.length > 0
						? instances.map((inst, index) =>
							<MyWidgetsInstanceCard
								key={inst.id}
								inst={inst}
								indexVal={index}
								onClick={onClick}
								selected={inst.id === selectedId}
								hidden={hiddenSet.has(inst.id)}
								beard={beardMode ? beards[index] : ''}
							/>
						)
						: null
					}
				</div>
			</div>
		</aside>
	)
}

export default MyWidgetsSideBar