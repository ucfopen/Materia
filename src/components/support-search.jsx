import React, { useState, useEffect } from 'react'
import { iconUrl } from '../util/icon-url'

const searchWidgets = (input) => fetch(`/api/admin/widget_search/${input}`)

const SupportSearch = ({onClick = () => {}}) => {
	const [searchText, setSearchText] = useState('')
	const [lastSearch, setLastSearch] = useState('')
	const [searchResults, setSearchResults] = useState([])
	const [isSearching, setIsSearching] = useState(false)
	const [showDeleted, setShowDeleted] = useState(false)

	
	useEffect(() => {
		//get search results using search text
		if(searchText !== lastSearch)
		{
			setLastSearch(searchText)
			
			if(searchText === '') 
			{
				setSearchResults([])
			}
			else 
			{
				setIsSearching(true)
				searchWidgets(searchText)
				.then(resp => {
					// no content
					if(resp.status == 204) return []
					return resp.json()
				})
				.then(instances => 
					{
						console.log(instances)
						setSearchResults(instances)
						setIsSearching(false)
					})
			}
			
		}
		
	})

	return (
		<section className="page">
			<div className="top">
				<h1>Instance Admin</h1>
			</div>
			<span className="input_label">Search:</span>
			<input
				tabIndex="0"
				value={searchText}
				onChange={(e) => setSearchText(e.target.value)}
				className="instance_search"
				type="text"
				placeholder="Enter a Materia widget instance's info"/>
			<div className="show_deleted">
				<input
					tabIndex="1"
					type="checkbox"
					checked={showDeleted}
					onChange={() => setShowDeleted(!showDeleted)}/>
				<span className="deleted_label">Show Deleted Instances?</span>
			</div>
			{ searchResults.length !== 0
				? <div className="search_list">
							{searchResults.map((match) => 
								<div 
									key={match.id}
									className={`search_match clickable ${(match.is_deleted && !showDeleted) ? 'hidden' : ''} ${match.is_deleted ? 'deleted' : ''}`}
									onClick={() => {onClick(match)} }>
									<div className="img-holder">
										<img className="icon" src={iconUrl('http://localhost/widget/', match.widget.dir, 275)} />
									</div>
									<div className="info-holder">
										<ul>
											<li className="title">{match.name}</li>
											<li className="type">{match.widget.name}</li>
											{match.is_deleted
												? <li className="deleted">Deleted</li>
												: null
											}
										</ul>
									</div>
								</div>
							)}
					</div>
				: null
			}
			{	isSearching
				? <div className="searching">
						<b>Searching Widget Instances ...</b>
					</div>
				
				: null
			}
			
		</section>
	)
}

export default SupportSearch