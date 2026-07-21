import React, { useState, useEffect, useCallback } from 'react'
import { useQuery } from 'react-query'
import { iconUrl } from '../util/icon-url'
import { apiGetLibraryModeration } from '../util/api'
import useSearchInstances from './hooks/useSearchInstances'
import useDebounce from './hooks/useDebounce'
import LoadingIcon from './loading-icon'

import {
	useTagList,
	useDeleteTag,
	useRenameTag
} from './hooks/useCommunityLibrary'

const SupportSearch = ({onClick = () => {}}) => {
	const [searchText, setSearchText] = useState('')
	const [error, setError] = useState('')
	const [showDeleted, setShowDeleted] = useState(false)
	const [moderationFilter, setModerationFilter] = useState('')
	const debouncedSearchTerm = useDebounce(searchText, 500)
	const instanceList = useSearchInstances(debouncedSearchTerm, showDeleted)

	const { data: moderationData, isFetching: moderationLoading, refetch: refetchModeration } = useQuery({
		queryKey: ['library-moderation', moderationFilter, showDeleted],
		queryFn: () => apiGetLibraryModeration(moderationFilter, showDeleted),
		enabled: true,
		staleTime: 30000,
	})

	useEffect(() => {
		if (instanceList.error) {
			if (instanceList.error.message == "Invalid Login") {
				window.location.href = '/login'
			} else {
				setError((instanceList.error.message || "Error") + ": Failed to retrieve widget(s).")
			}
		}
	}, [instanceList.instances])

	const handleSearchChange = e => setSearchText(e.target.value)
	const handleShowDeletedClick = () => setShowDeleted(!showDeleted)

	const renderInstanceSearch = () => {
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
								<img className='icon' src={iconUrl('/widget/', match.widget.dir, 275)} alt="widget icon" />
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
			<>
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
						<label className='checkbox-wrapper'>
							<input tabIndex='0'
								type='checkbox'
								checked={showDeleted}
								onChange={handleShowDeletedClick}
							/>
							<span className='custom-checkbox'></span>
							Show Deleted Instances?
						</label>
					</div>
				</div>
				{ loadingRender }
				{ searchResultsRender }
			</>
		)
	}

	return (
		<section className='page'>
			<div className='top'>
				<h1>Instance Admin</h1>
			</div>
			{ renderInstanceSearch() }
		</section>
	)
}

export default SupportSearch
