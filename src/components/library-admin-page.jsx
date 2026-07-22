import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Header from './header'
import './library-admin-page.scss'
import { useQuery } from 'react-query'
import LoadingIcon from './loading-icon'
import { apiGetLibraryModeration, apiGetLibraryCategories } from '../util/api'
import { iconUrl } from '../util/icon-url'

import {
	useTagList,
	useDeleteTag,
	useRenameTag,
	useUpdateCategory,
	useDeleteCategory,
	useCreateCategory
} from './hooks/useCommunityLibrary'
import CategoryAdminCard from './category-admin-card'

const LibraryAdminPage = () => {

    const [pageState, setPageState] = useState({mode: "tags"})
    const [moderationFilter, setModerationFilter] = useState('')
    const [showDeleted, setShowDeleted] = useState(false)

    const [tagSearchText, setTagSearchText] = useState('')
    const [entrySearchText, setEntrySearchText] = useState('')

    const [renamingTag, setRenamingTag] = useState('')
    const [newTagName, setNewTagName] = useState('')
    const [deleteConfirm, setDeleteConfirm] = useState('')

	const [creatingCategory, setCreatingCategory] = useState(false)

    const handleShowDeletedClick = () => setShowDeleted(!showDeleted)
    
    useEffect(() => {
        const handleHashChange = () => {
            if(window.location.hash != "")
            setPageState((state => ({
                ...pageState, 
                mode: window.location.hash.replace("#", "")
            })))
        }

        handleHashChange()
        window.addEventListener('hashchange', handleHashChange)

        return () => {
            window.removeEventListener('hashchange', handleHashChange)
        }
    }, [])

    const { data: moderationData, isFetching: moderationLoading, refetch: refetchModeration } = useQuery({
        queryKey: ['library-moderation', moderationFilter, showDeleted, entrySearchText],
        queryFn: () => apiGetLibraryModeration(moderationFilter, showDeleted, entrySearchText),
        enabled: pageState.mode === 'entries',
        staleTime: 30000,
    })

    const {data: tags, status: status, refetch: refetchTags} = useTagList(-1, tagSearchText, [])

	const {data: categories, isFetching: categoryLoading, refetch: refetchCategories} = useQuery({
		queryKey: ['category-moderation'],
		queryFn: () => apiGetLibraryCategories(),
		enabled: pageState.mode === 'categories',
		staleTime: 30000
	})

    const renameTagMutation = useRenameTag()
    const deleteTagMutation = useDeleteTag()
	
	const updateCategoryMutation = useUpdateCategory()
	const deleteCategoryMutation = useDeleteCategory()
	const createCategoryMutation = useCreateCategory()

    const nameInputEnter = (e) => {
		if(e.key == "Enter")
			submitNewName()
	}

    const submitNewName = () => {
		const finalName = newTagName.toLowerCase().replaceAll(" ","-").trim()

		if(finalName != "")
			handleTagRename(renamingTag, finalName)

		setRenamingTag('')
	}

	const tryDelete = (name) => {
		if(deleteConfirm != name)
			setDeleteConfirm(name)
		else
			handleTagDelete(name)
	}

    const handleTagRename = useCallback(
        (name, to) => {
            renameTagMutation.mutate({name, to}, {
                onSuccess: () => {
                    refetchTags()
                }
            })
        },
        [renameTagMutation],
    )
    
    const handleTagDelete = useCallback(
        (name) => {
            deleteTagMutation.mutate(name, {
                onSuccess: () => {
                    refetchTags()
                }
            })
        },
        [deleteTagMutation],
    )

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
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-tag-icon lucide-tag"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>
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

    const renderLibraryModeration = () => {
        const entries = moderationData?.results || []

		return (
			<>
                <input type="text" className='search-field' placeholder="Search for an entry..." value={entrySearchText} onChange={(e)=>setEntrySearchText(e.target.value)}/>
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
						<p className="loading-text">Loading library entries... {entries.length}</p>
					</div>
				)}
				{!moderationLoading && entries.length === 0 && (
					<div><p>No entries found.</p></div>
				)}
				{entries.length > 0 && (
					<div className='search_list'>
						{entries.map((entry) => (
							<a
								key={entry.id}
								className={`search_match clickable ${entry.featured ? 'featured' : ''} ${entry.is_banned ? 'banned' : ''} ${entry.report_count > 0 ? 'reported' : ''} ${!entry.is_available ? 'unpublished' : ''} ${entry.is_deleted ? 'deleted' : ''}`}
                                href={`/admin/instance#${entry.instance_id}`}
                                >
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
											{!entry.is_available && <div className='badge badge-unpublished'>Unpublished</div>}
											{entry.is_banned && <div className='badge badge-banned'>Banned</div>}
											{entry.report_count > 0 && <div title={`Last reported ${new Date(entry.last_reported_at).toLocaleDateString()}`} className='badge badge-reported'>{entry.report_count} report{entry.report_count !== 1 ? 's' : ''}</div>}
											{entry.is_deleted && <div className='badge badge-banned'>Deleted</div>}
										</li>
									</ul>
								</div>
							</a>
						))}
					</div>
				)}
			</>
		)
    }

	const handleCategoryUpdate = useCallback(
        (slug, changes) => {
            updateCategoryMutation.mutate({slug, changes}, {
                onSuccess: () => {
                    refetchCategories()
                }
            })
        },
        [updateCategoryMutation],
    )

	const handleCategoryCreate = useCallback(
        (slug, changes) => {
            createCategoryMutation.mutate({slug, changes}, {
                onSuccess: () => {
					setCreatingCategory(false)
                    refetchCategories()
                }
            })
        },
        [createCategoryMutation],
    )

	const handleCategoryDelete = useCallback(
        (slug) => {
            deleteCategoryMutation.mutate({slug}, {
                onSuccess: () => {
                    refetchCategories()
                }
            })
        },
        [updateCategoryMutation],
    )

    const renderCategories = () => {
		return (
			<>	
				<div className='row'>
					<div>Showing {categories ? categories.length : 0} categories</div>
					<button type='button' onClick={()=>setCreatingCategory(!creatingCategory)} className={`cat-btn ${!creatingCategory ? "save" : "delete"}`}>
						{creatingCategory ? "Cancel" : "Create New Category"}
					</button>
				</div>
				{
					creatingCategory &&
					<CategoryAdminCard isCreating category={null} handleUpdate={handleCategoryCreate} handleDelete={null}/>
				}
				<hr/>
				<div className='category-list'>
				{
					categoryLoading ? 
						<div>Loading...</div>
						:
					categories && categories.map((v) => (
						<CategoryAdminCard category={v} handleUpdate={handleCategoryUpdate} handleDelete={handleCategoryDelete}/>
					))
				}
				</div>
			</>
		)
	}

    const selectionRender = () => {
        if(pageState.mode === "tags") return renderTagModeration()
        if(pageState.mode === "entries") return renderLibraryModeration()
        if(pageState.mode === "categories") return renderCategories()

        return tagsRender
    }

    return (
        <>
            <Header/>
            <div className="support-page">
                <section className='page'>
                    <div className='top'>
				        <h1>Community Library Admin</h1>
                    </div>
                    <nav>
						<a className={`nav_button ${pageState.mode == 'tags' ? 'selected' : ''}`} href='#tags'>Tags</a>
						<a className={`nav_button ${pageState.mode == 'entries' ? 'selected' : ''}`} href='#entries'>Entries</a>
                        <a className={`nav_button ${pageState.mode == 'categories' ? 'selected' : ''}`} href='#categories'>Categories</a>
					</nav>
                    <div className='content'>
                        { selectionRender() }
                    </div>
                </section>
			</div>
        </>
    )
}

export default LibraryAdminPage
