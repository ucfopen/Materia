import React, { useState, useEffect } from 'react'
import { iconUrl } from '../util/icon-url'
import useDebounce from './use-debounce'

const searchWidgets = (input) => fetch(`/api/admin/widget_search/${input}`)

const SupportSearch = ({onClick = () => {}}) => {
	const [searchText, setSearchText] = useState('')
	const [searchResults, setSearchResults] = useState([])
	const [isSearching, setIsSearching] = useState(false)
	const [showDeleted, setShowDeleted] = useState(false)
	const debouncedSearchTerm = useDebounce(searchText, 500)

	useEffect(() => {
		// Make sure we have a value (user has entered something in input)
		if (debouncedSearchTerm) {

			if (debouncedSearchTerm !== "")
				setIsSearching(true)
			
			searchWidgets(debouncedSearchTerm)
				.then(resp => {
					// no content
					if(resp.status === 502 || resp.status === 204) {
						setIsSearching(false)
						return []
					}
					
					return resp.json()
				})
				.then(instances => 
				{
					setSearchResults(instances)
					setIsSearching(false)
				})
		} else {
			setSearchResults([])
		}
	}, [debouncedSearchTerm])

	const setSearchVal = (e) => {
		if (!isSearching && e.target.value  !== "") setIsSearching(true)
		if (e.target.value === "") setIsSearching(false)

		setSearchText(e.target.value)
	}

	return (
		<section className="page">
			<div className="top">
				<h1>Instance Admin</h1>
			</div>
			<span className="input_label">Search:</span>
			<input
				tabIndex="0"
				value={searchText}
				onChange={(e) => setSearchVal(e)}
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
				: <div>
					{	isSearching
						? <div className="searching">
								<b>Searching Widget Instances ...</b>
							</div>
						: <p>{`${searchText.length == 0 ? "Search for a widget by entering it's name, ID, or creation time" : "No widgets match your description"}`}</p>
					}
				</div>
			}
			
		</section>
	)
}

export default SupportSearch
