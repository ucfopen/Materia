import React, { useState } from 'react'
import { iconUrl } from '../util/icon-url'
import { useQuery } from 'react-query'
import { apiSearchWidgets } from '../util/api'
import useDebounce from './hooks/useDebounce'

const SupportSearch = ({onClick = () => {}}) => {
	const [searchText, setSearchText] = useState('')
	const [showDeleted, setShowDeleted] = useState(false)
	const debouncedSearchTerm = useDebounce(searchText, 500)
	const { data: searchedWidgets, isFetching} = useQuery({
		queryKey: ['search-widgets', debouncedSearchTerm],
		queryFn: () => apiSearchWidgets(debouncedSearchTerm),
		enabled: !!debouncedSearchTerm && debouncedSearchTerm.length > 0,
		placeholderData: null,
		staleTime: Infinity
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
			{ searchedWidgets && searchedWidgets.length !== 0
				? <div className="search_list">
							{searchedWidgets.map((match) => 
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
					{	(isFetching || !searchedWidgets) && searchText.length > 0
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
