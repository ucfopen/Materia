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

	const handleSearchChange = e => setSearchText(e.target.value)
	const handleShowDeletedClick = () => setShowDeleted(!showDeleted)

	let searchResultsRender = (
		<div>
			<p>{`${searchText.length == 0 ? 'Search for a widget by entering its name, ID, or creation time' : 'No widgets match your description'}`}</p>
		</div>
	)
	if ((isFetching || !searchedWidgets) && searchText.length > 0) {
		searchResultsRender = (
			<div className='searching'>
				<b>Searching Widget Instances ...</b>
			</div>
		)
	} else if (searchedWidgets && searchedWidgets.length !== 0) {
		searchResultsRender = (
			<div className='search_list'>
					{searchedWidgets.map((match) =>
						<div
							key={match.id}
							className={`search_match clickable ${(match.is_deleted && !showDeleted) ? 'hidden' : ''} ${match.is_deleted ? 'deleted' : ''}`}
							onClick={() => {onClick(match)} }>
							<div className='img-holder'>
								<img className='icon' src={iconUrl('/widget/', match.widget.dir, 275)} />
							</div>
							<div className='info-holder'>
								<ul>
									<li className='title'>{match.name}</li>
									<li className='type'>{match.widget.name}</li>
									{match.is_deleted
										? <li className='deleted'>Deleted</li>
										: null
									}
								</ul>
							</div>
						</div>
					)}
			</div>
		)
	}

	return (
		<section className='page'>
			<div className='top'>
				<h1>Instance Admin</h1>
			</div>
			<div className='search'>
				<input tabIndex='0'
					value={searchText}
					onChange={handleSearchChange}
					className='instance_search'
					type='text'
					placeholder="Enter a Materia widget instance's info"
				/>
				<div className='show_deleted'>
					<input tabIndex='1'
						type='checkbox'
						checked={showDeleted}
						onChange={handleShowDeletedClick}
					/>
					<span className='deleted_label'>Show Deleted Instances?</span>
				</div>
			</div>
			{ searchResultsRender }

		</section>
	)
}

export default SupportSearch
