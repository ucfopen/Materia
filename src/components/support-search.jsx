import React, { useState, useEffect } from 'react'

const SupportSearch = (onClick) => {
	const [searchText, setSearchText] = useState('')
	const [searchResults, setSearchResults] = useState([])
	const [isSearching, setIsSearching] = useState(false)
	useEffect(() => {
		//get search results using search text
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
			{ searchResults.length !== 0
				? <div className="search_list">
							{searchResults.map((match) => 
								<div 
									className="search_match clickable"
									onClick={() => onClick(match)}>
									<div className="img-holder">
										<img src={iconUrl('http://localhost/widget/', match.widget.dir, 275)} />
									</div>
									<div className="info-holder">
										<ul>
											<li className="title">{match.name}</li>
											<li className="type">{match.widget.name}</li>
										</ul>
									</div>
								</div>
							)}
					</div>
				: null
			}
			{	isSearching
				? <b>Searching Widget Instances ...</b>
				: null
			}
			
		</section>
	)
}

export default SupportSearch