import React, { useState, useEffect } from 'react'
import { iconUrl } from '../util/icon-url'
import useSearchInstances from './hooks/useSearchInstances'
import useDebounce from './hooks/useDebounce'
import LoadingIcon from './loading-icon'

const SupportSearch = ({onClick = () => {}}) => {
	const [searchText, setSearchText] = useState('')
	const [showDeleted, setShowDeleted] = useState(false)
	const debouncedSearchTerm = useDebounce(searchText, 500)
	const instanceList = useSearchInstances(debouncedSearchTerm)

	useEffect(() => {
		if (instanceList.error) console.log(instanceList.error)
	}, [instanceList.instances])

	const handleSearchChange = e => setSearchText(e.target.value)
	const handleShowDeletedClick = () => setShowDeleted(!showDeleted)

	let loadingRender = null
	if ((instanceList.isFetching || !instanceList.instances) && searchText.length > 0) {
		loadingRender = (
			<div className='loading'>
				<LoadingIcon size="sm" width="50px"></LoadingIcon>
				<p className="loading-text">Searching Widget Instances ...</p>
			</div>
		)
	} else if (instanceList.isFetching) {
		loadingRender = <div className="loading">
			<LoadingIcon size="sm" width="50px"></LoadingIcon>
			<p className="loading-text">Loading widget instances...</p>
		</div>
	}

	let searchPromptRender = (
		<div>
			<p>{`${searchText.length == 0 || (instanceList.instances && instanceList.instances.length > 0) || instanceList.isFetching ? 'Search for a widget instance by entering its name or ID' : 'No widgets match your description'}`}</p>
		</div>
	)

	let searchResultsRender = null

	if (instanceList.instances && instanceList.instances.length !== 0) {
		searchResultsRender = (
			<div className='search_list'>
					{instanceList.instances.map((match) =>
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
				{ searchPromptRender }
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
			{ loadingRender }
			{ searchResultsRender }
		</section>
	)
}

export default SupportSearch
