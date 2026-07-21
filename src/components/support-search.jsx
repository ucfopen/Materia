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
	const [activeTab, setActiveTab] = useState('instances')
	const [searchText, setSearchText] = useState('')
	const [tagSearchText, setTagSearchText] = useState('')
	const [error, setError] = useState('')
	const [showDeleted, setShowDeleted] = useState(false)
	const [moderationFilter, setModerationFilter] = useState('')
	const debouncedSearchTerm = useDebounce(searchText, 500)
	const instanceList = useSearchInstances(debouncedSearchTerm, showDeleted)

	const [renamingTag, setRenamingTag] = useState('')
	const [newTagName, setNewTagName] = useState('')
	const [deleteConfirm, setDeleteConfirm] = useState('')

	const { data: moderationData, isFetching: moderationLoading, refetch: refetchModeration } = useQuery({
		queryKey: ['library-moderation', moderationFilter, showDeleted],
		queryFn: () => apiGetLibraryModeration(moderationFilter, showDeleted),
		enabled: activeTab === 'library',
		staleTime: 30000,
	})

	const {data: tags, status: status, refetch: refetchTags} = useTagList(-1, tagSearchText, [])

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

	const renameTagMutation = useRenameTag()
	const deleteTagMutation = useDeleteTag()

	const handleRename = useCallback(
		(name, to) => {
			renameTagMutation.mutate({name, to}, {
				onSuccess: () => {
					refetchTags()
				}
			})
		},
		[renameTagMutation],
	)

	const handleDelete = useCallback(
		(name) => {
			deleteTagMutation.mutate(name, {
				onSuccess: () => {
					refetchTags()
				}
			})
		},
		[deleteTagMutation],
	)

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
						<option value="">All</option>
						<option value="banned">Banned</option>
						<option value="reported">Reported</option>
						<option value="unpublished">Unpublished</option>
						<option value="featured">Featured</option>
					</select>
					<div>
						<input id='showDeletedCL' type='checkbox' value={showDeleted} onChange={handleShowDeletedClick}/>
						<label htmlFor='showDeletedCL'>Show Deleted Instances?</label>
					</div>
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
								className={`search_match clickable ${entry.featured ? 'featured' : ''} ${entry.is_banned ? 'banned' : ''} ${entry.report_count > 0 ? 'reported' : ''} ${!entry.shared_to_library ? 'unpublished' : ''} ${entry.is_deleted ? 'deleted' : ''}`}
								onClick={() => {
									const instanceData = {
										id: entry.instance_id,
										name: entry.instance_name,
										widget: entry.widget,
										shared_to_library: true,
										is_deleted: entry.is_deleted,
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
											is_available: entry.is_available,
											is_deleted: entry.is_deleted
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
										<li className='row'>
											{entry.featured && <div className='badge badge-featured'>Featured</div>}
											{!entry.shared_to_library && <div className='badge badge-unpublished'>Unpublished</div>}
											{entry.is_banned && <div className='badge badge-banned'>Banned</div>}
											{entry.report_count > 0 && <div title={`Last reported ${new Date(entry.last_reported_at).toLocaleDateString()}`} className='badge badge-reported'>{entry.report_count} report{entry.report_count !== 1 ? 's' : ''}</div>}
											{entry.is_deleted && <div className='badge badge-banned'>Deleted</div>}
										</li>
									</ul>
								</div>
							</div>
						))}
					</div>
				)}
			</>
		)
	}

	const nameInputEnter = (e) => {
		if(e.key == "Enter")
			submitNewName()
	}

	const submitNewName = () => {
		const finalName = newTagName.toLowerCase().replaceAll(" ","-").trim()

		if(finalName != "")
			handleRename(renamingTag, finalName)

		setRenamingTag('')
	}

	const tryDelete = (name) => {
		if(deleteConfirm != name)
			setDeleteConfirm(name)
		else
			handleDelete(name)
	}

	const renderTagModeration = () => {
		return (
			<div className="tag-moderation">
				<input type="text" placeholder="Search for a tag..." value={tagSearchText} onChange={(e)=>setTagSearchText(e.target.value)}/>
				<div className="tag-grid">
				{tags ? 
				tags.length == 0 ? <div>No tags found.</div>
				: tags.map((v)=>(
					<div className={`tag-item ${renamingTag == v.name ? "renaming":""}`}>
						<div className="row">
							<div className="tag-name">
								#{renamingTag != v.name ? v.name : 
								<input type="text" value={newTagName} onKeyDown={nameInputEnter} onChange={(e)=>{setNewTagName(e.target.value)}}/>}
							</div>
							<div className="used-count">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tag-icon lucide-tag"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>
								<b>{v.used_count}</b>
							</div>
						</div>
						<div className="row">
							{
								renamingTag == v.name ?
								<>
									<button type="button" onClick={submitNewName} className="confirm">Confirm</button>
									<button type="button" onClick={()=>{setRenamingTag("")}} className="cancel">Cancel</button>
								</>
								:
								<>
									<button type="button" onClick={()=>{setRenamingTag(v.name); setNewTagName(v.name)}} className="rename">Rename</button>
									<button type="button" onClick={()=>{tryDelete(v.name)}} 
									className="delete">{deleteConfirm == v.name ? "Confirm?" : "Delete"}</button>
								</>
							}
							
						</div>
					</div>
				))
				: <div>Loading...</div>
				}
				</div>
			</div>
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
				<button
					className={`tab ${activeTab === 'tags' ? 'active' : ''}`}
					onClick={() => setActiveTab('tags')}>
					Tags
				</button>
			</div>
			{ activeTab === 'instances' ? renderInstanceSearch() : activeTab === 'library' ? renderLibraryModeration() : renderTagModeration() }
		</section>
	)
}

export default SupportSearch
