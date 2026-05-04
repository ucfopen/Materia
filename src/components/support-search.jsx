import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { iconUrl } from '../util/icon-url'
import { apiGetLibraryModeration } from '../util/api'
import useSearchInstances from './hooks/useSearchInstances'
import useDebounce from './hooks/useDebounce'
import LoadingIcon from './loading-icon'

const SupportSearch = ({onClick = () => {}}) => {
	const [activeTab, setActiveTab] = useState('instances')
	const [searchText, setSearchText] = useState('')
	const [error, setError] = useState('')
	const [showDeleted, setShowDeleted] = useState(false)
	const [moderationFilter, setModerationFilter] = useState('banned')
	const debouncedSearchTerm = useDebounce(searchText, 500)
	const instanceList = useSearchInstances(debouncedSearchTerm, showDeleted)

	const { data: moderationData, isFetching: moderationLoading, refetch: refetchModeration } = useQuery({
		queryKey: ['library-moderation', moderationFilter],
		queryFn: () => apiGetLibraryModeration(moderationFilter),
		enabled: activeTab === 'library',
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

	const renderLibraryModeration = () => {
		const entries = moderationData?.results || []

		return (
			<>
				<div className='moderation-filters'>
					<label>Show:</label>
					<select value={moderationFilter} onChange={(e) => setModerationFilter(e.target.value)}>
						<option value="banned">Banned</option>
						<option value="reported">Reported</option>
						<option value="">All</option>
					</select>
				</div>
				{moderationLoading && (
					<div className='loading'>
						<LoadingIcon size="sm" width="50px"></LoadingIcon>
						<p className="loading-text">Loading library entries...</p>
					</div>
				)}
				{!moderationLoading && entries.length === 0 && (
					<div><p>No entries found.</p></div>
				)}
				{entries.length > 0 && (
					<div className='search_list'>
						{entries.map((entry) => (
							<div
								key={entry.id}
								className={`search_match clickable ${entry.is_banned ? 'banned' : ''}`}
								onClick={() => {
									const instanceData = {
										id: entry.instance_id,
										name: entry.instance_name,
										widget: entry.widget,
										is_shared: true,
										library_entry: {
											id: entry.id,
											category: entry.category,
											category_display: entry.category_display,
											course_level: entry.course_level,
											course_level_display: entry.course_level_display,
											featured: entry.featured,
											is_banned: entry.is_banned,
											report_count: entry.report_count,
											copy_count: entry.copy_count,
											like_count: entry.like_count,
										},
										preview_url: entry.preview_url,
									}
									onClick(instanceData)
								}}>
								<div className='img-holder'>
									<img className='icon' src={iconUrl('/widget/', entry.widget.dir, 275)} alt="widget icon" />
								</div>
								<div className='info-holder'>
									<ul>
										<li className='title'>{entry.instance_name}</li>
										<li className='type'>{entry.widget.name}</li>
										<li className='owner'>{entry.owner_display_name}</li>
										{entry.last_reported_at && <li className='date'>Last reported {new Date(entry.last_reported_at).toLocaleDateString()}</li>}
										{entry.is_banned && <li className='badge badge-banned'>Banned</li>}
										{entry.report_count > 0 && <li className='badge badge-reported'>{entry.report_count} report{entry.report_count !== 1 ? 's' : ''}</li>}
									</ul>
								</div>
							</div>
						))}
					</div>
				)}
			</>
		)
	}

	return (
		<section className='page'>
			<div className='top'>
				<h1>Instance Admin</h1>
			</div>
			<div className='admin-tabs'>
				<button
					className={`tab ${activeTab === 'instances' ? 'active' : ''}`}
					onClick={() => setActiveTab('instances')}>
					Instance Search
				</button>
				<button
					className={`tab ${activeTab === 'library' ? 'active' : ''}`}
					onClick={() => setActiveTab('library')}>
					Community Library
				</button>
			</div>
			{ activeTab === 'instances' ? renderInstanceSearch() : renderLibraryModeration() }
		</section>
	)
}

export default SupportSearch
