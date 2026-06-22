import React, { useState, useMemo, useCallback, useEffect, useRef, useDeferredValue } from 'react'
import CommunityLibraryCard from './community-library-card'
import CommunityLibraryReportDialog from './community-library-report-dialog'
import {
	useCommunityLibraryList,
	useCopyFromLibrary,
	useTagList,
	useToggleLike,
} from './hooks/useCommunityLibrary'
import useDebounce from './hooks/useDebounce'
import './community-library.scss'
import CommunityLibraryDashboard from './community-library-dashboard'

const CATEGORIES = [
	// { value: '', label: 'All Categories' },
	{ value: 'math', label: 'Math' },
	{ value: 'science', label: 'Science' },
	{ value: 'english', label: 'English' },
	{ value: 'history', label: 'History' },
	{ value: 'art', label: 'Art' },
	{ value: 'music', label: 'Music' },
	{ value: 'language', label: 'World Languages' },
	{ value: 'cs', label: 'Computer Science' },
	{ value: 'health', label: 'Health & PE' },
	{ value: 'business', label: 'Business' },
	{ value: 'education', label: 'Education' },
	{ value: 'other', label: 'Other' },
]

const COURSE_LEVELS = [
	{ value: '', label: 'All Levels' },
	{ value: 'introductory', label: 'Introductory' },
	{ value: 'intermediate', label: 'Intermediate' },
	{ value: 'advanced', label: 'Advanced' },
]

const SORT_OPTIONS = [
	{ value: 'newest', label: 'Newest' },
	{ value: 'most_copied', label: 'Most Copied' },
	{ value: 'most_liked', label: 'Most Recommended' },
	{ value: 'alphabetical', label: 'A-Z' },
]

const GLASS_PATH = "m244.19 214.6l-54.379-54.378c-0.289-0.289-0.628-0.491-0.93-0.76 10.7-16.231 16.945-35.66 16.945-56.554 0-56.837-46.075-102.91-102.91-102.91s-102.91 46.075-102.91 102.91c0 56.835 46.074 102.91 102.91 102.91 20.895 0 40.323-6.245 56.554-16.945 0.269 0.301 0.47 0.64 0.759 0.929l54.38 54.38c8.169 8.168 21.413 8.168 29.583 0 8.168-8.169 8.168-21.413 0-29.582zm-141.28-44.458c-37.134 0-67.236-30.102-67.236-67.235 0-37.134 30.103-67.236 67.236-67.236 37.132 0 67.235 30.103 67.235 67.236s-30.103 67.235-67.235 67.235z"

const CommunityLibrary = ({ widgets = [] }) => {
	const [searchInput, setSearchInput] = useState('')
	const [finallInput, setFinalInput] = useState('')
	const [selectedWidgetType, setSelectedWidgetType] = useState('')

	const [selectedCategories, setSelectedCategories] = useState(new Set([]))

	const [selectedCourseLevel, setSelectedCourseLevel] = useState('')
	const [sortBy, setSortBy] = useState('newest')
	const [reportingEntry, setReportingEntry] = useState(null)
	const [copySuccess, setCopySuccess] = useState(null)

	// list of tags currently being searched
	const [tagList, setTagList] = useState([])

	// current in-progress tag being typed
	const [tempTag, setTempTag] = useState("")

	// determines whether tag detection is active
	const [breakTempTag, setBreakTempTag] = useState(false)

	// stores which tag in the dropdown is "focused"
	const [focusedTag, setFocusedTag] = useState(-1)

	// only works on mobile screen sizes
	const [showSidebar, setShowSidebar] = useState(false)

	const searchText = useDebounce(finallInput, 500)
	const inputElement = document.getElementById("searchinput")
	const assertiveRegion = document.getElementById("searchinput")

	useEffect(()=>{
		if(tempTag == "")
			setFinalInput(searchInput)
	},[searchInput, tempTag])

	const clearSearch = () => {
		setSearchInput('')
	}

	const { entries, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
		useCommunityLibraryList(
			null,
			searchText,
			selectedWidgetType,
			[...selectedCategories],
			selectedCourseLevel,
			sortBy,
			tagList,
			false
		)

	const defEntries = useDeferredValue(entries)

	const loadMoreRef = useRef(null)

	useEffect(() => {
		if (!loadMoreRef.current) return
		const observer = new IntersectionObserver(
			([sentinel]) => {
				if (sentinel.isIntersecting && hasNextPage && !isFetchingNextPage) {
					fetchNextPage()
				}
			},
			{ threshold: 0 },
		)
		observer.observe(loadMoreRef.current)
		return () => observer.disconnect()
	}, [hasNextPage, isFetchingNextPage, fetchNextPage])

	const copyMutation = useCopyFromLibrary()
	const likeMutation = useToggleLike()

	// list of 5 most relevant tags from database
	const {data: tags, status} = useTagList(5, tempTag.replace("#", ""), tagList)
	const defTags = useDeferredValue(tags)
	
	const handleCopy = useCallback(
		(entryId) => {
			copyMutation.mutate(entryId, {
				onSuccess: () => {
					setCopySuccess(entryId)
					setTimeout(() => setCopySuccess(null), 3000)
				},
			})
		},
		[copyMutation],
	)

	const handleLike = useCallback(
		(entryId) => {
			likeMutation.mutate(entryId)
		},
		[likeMutation],
	)

	const handleReport = useCallback((entry) => {
		setReportingEntry(entry)
	}, [])

	const clearFilters = () => {
		clearSearch()
		setSelectedWidgetType('')
		setSelectedCategories(new Set([]))
		setSelectedCourseLevel('')
		setTagList([])
		document.getElementById("filter-form").reset();
	}

	const featuredEntries = useMemo(() => entries.filter((e) => e.featured), [entries])

	const isFiltered = searchText || selectedWidgetType || selectedCategories.size > 0 || selectedCourseLevel || tagList.length > 0

	const widgetTypeOptions = useMemo(() => {
		if (!widgets.length) return []
		return widgets.filter((w) => w.in_catalog).sort((a, b) => a.name.localeCompare(b.name))
	}, [widgets])

	let contentRender = null
	if (isFetching && entries.length === 0) {
		contentRender = (
			<div className="status-message">
				<span>Loading...</span>
			</div>
		)
	} else if (entries.length === 0) {
		contentRender = (
			<div className="status-message">
				<span>No shared widgets found.</span>
				{isFiltered && (
					<button
						className="clear-filters"
						onClick={()=>clearFilters()}
					>
						Clear Filters
					</button>
				)}
				<div className='not-found-img' role='presentation'></div>
			</div>
		)
	} else {
		const displayEntries = isFiltered ? defEntries : defEntries.filter((e) => !e.featured)
		contentRender = (
			<>
				<div className="entries-grid">
					{displayEntries.map((entry) => (
						<CommunityLibraryCard
							key={entry.id}
							entry={entry}
							highlightedTags={tagList.filter((v, i)=>(entry.tags ?? []).includes(v))}
						/>
					))}
				</div>
				<div ref={loadMoreRef} className="load-more-sentinel">
					{isFetchingNextPage && <span>Loading more...</span>}
				</div>
			</>
		)
	}

	const handleSearch = (e) => {
		setSearchInput(e.target.value)

		if(breakTempTag) return

		const tagStart = e.target.value.lastIndexOf("#")
		if(tagStart != -1) {
			const tagStr = e.target.value.slice(tagStart)
			setTempTag(tagStr.toLowerCase().replaceAll(" ","-").trim())
			setFocusedTag(0)
		} else {
			setTempTag("")
			setFocusedTag(-1)
		}
	}

	const handleSearchEnter = (e) => {
		if(e.key == "Enter" && tempTag != "" && tags && tags.length > 0) {
			e.preventDefault()
			enterTag(tags.at(focusedTag).name)
		}

		if(e.key == "Backspace" && searchInput == "") {
			let newList = tagList
			newList.splice(newList.length-1, 1)

			setTagList([...newList])
		}

		if(tags && tags.length > 1 && tempTag != "") {
			if(e.key == "ArrowDown") {
				e.preventDefault()
				let newInd = focusedTag + 1 < tags.length ? focusedTag + 1 : 0
				setFocusedTag(newInd)
			} else if(e.key == "ArrowUp") {
				e.preventDefault()
				let newInd = focusedTag - 1 >= 0 ? focusedTag - 1 : tags.length - 1
				setFocusedTag(newInd)
			}
		}

		if(e.key == "#") {
			// resets tag detection
			setBreakTempTag(false)
		}

		if(e.key == " ") {
			if(tempTag.length == 1) {
				// breaks tag detection if first tag char is space
				e.preventDefault()
				setBreakTempTag(true)
				setTempTag("")
				setFocusedTag(-1)
			}
		}

		if(e.key == "Escape") {
			// breaks tag detection via escape
			setBreakTempTag(true)
			setTempTag("")
			setFocusedTag(-1)
		}
	}

	const enterTag = (t) => {
		const tagStart = inputElement.value.lastIndexOf("#")

		let newVal = [...inputElement.value]
		newVal.splice(tagStart, tempTag.length)

		setSearchInput(newVal.join(""))

		setFocusedTag(-1)
		setTagList([...tagList, t])
		setTempTag("")

		inputElement.focus()
	}

	const triggerTagMenu = () => {
		setTempTag("#")
		setFocusedTag(0)
		setTimeout(()=>{
			inputElement.focus()
			inputElement.value += "#"
		}, 50)
	}

	return (
		<div className="community-library">
			<div aria-live='assertive' className='live'>
				{tags && tags.length > 0 && focusedTag > -1 && 
				`Tag selection menu: Selected "${tags.at(focusedTag).name}", used in ${tags.at(focusedTag).used_count} widget${tags.at(focusedTag).used_count > 1 ? "s" : ""}.`}
			</div>
			<link rel="preload" href="/img/chevron-down.svg" />
			<div className="container">
				<section className="page">
					<div className="top">
						<h1>Community Library</h1>
					</div>

					<div className='row'>
						<form id="filter-form" className={`sidebar ${showSidebar ? 'show' : ''}`} onFocus={()=>setShowSidebar(true)} onBlur={()=>setShowSidebar(false)}>
							<div className='row filter-cont'>
								<button type="button" className='filter-button' title="Close Filter Sidebar" onClick={()=>setShowSidebar(!showSidebar)}>
									<div className='close-icon'></div>
								</button>
								<h3>FILTERS</h3>
								<button aria-label='Reset Filters' type='button' title='Reset Filters' onClick={()=>clearFilters()}>
									<div className='rotate-icon'></div>
								</button>
							</div>
							<details open>
								<summary>Level of Study</summary>
								<div className='col small-labels'>
									{COURSE_LEVELS.map((v,i)=> {
										return(<div className='row' key={`level${i}`}>
											<input defaultChecked={v.value == ""} type='radio' name='level' value={v.value} id={`${v.value == "" ? "all" : v.value}-level-check`} onChange={(e) => setSelectedCourseLevel(e.target.value)}/>
											<label htmlFor={`${v.value == "" ? "all" : v.value}-level-check`}>{v.label}</label>										
										</div>)
									})}
								</div>
							</details>
							<details open>
								<summary>Discipline</summary>
								<div className='col small-labels'>
									{CATEGORIES.map((v,i)=> {
										return(<div className='row' key={`cat${i}`}>
											<input defaultChecked={v.value == ""} checked={selectedCategories.has(v.value)} type='checkbox' name='discipline' value={v.value} id={`${v.value == "" ? "all" : v.value}-cat-check`} 
											onChange={(e) => {
												if(e.target.checked)
													selectedCategories.add(e.target.value)
												else selectedCategories.delete(e.target.value)

												setSelectedCategories(new Set([...selectedCategories]))
											}}
											/>
											<label htmlFor={`${v.value == "" ? "all" : v.value}-cat-check`}>{v.label}</label>										
										</div>)
									})}
								</div>
							</details>
							<details>
								<summary>Widget Engine</summary>
								<div className='col small-labels'>
									<div className='row'>
										<input defaultChecked={true} type='radio' name='widget' value={""} id={`all-check`} onChange={(e) => setSelectedWidgetType(e.target.value)}/>
										<label htmlFor={`all-check`}>All Widget Types</label>
									</div>
									{widgetTypeOptions.map((v,i)=> {
										return(<div className='row' key={`widget${i}`}>
											<input type='radio' name='widget' value={v.id} id={`${v.id}-check`} onChange={(e) => setSelectedWidgetType(e.target.value)}/>
											<label htmlFor={`${v.id}-check`}>{v.name}</label>										
										</div>)
									})}
								</div>
							</details>
						</form>
						<div className='content'>
							<div className="controls">
								<div className='row'>
									<button type="button" className='filter-button' title="Open Filter Sidebar" onClick={()=>setShowSidebar(!showSidebar)}>
										<div className='filter-icon'></div>
									</button>
									<div className="search-bar">
										<div className="search-icon"><svg viewBox="0 0 250.313 250.313"><path d={`${GLASS_PATH}`} clipRule="evenodd" fillRule="evenodd"></path></svg></div>
										<div className='search-tags'>
											{tagList.map((v,i)=>(
												<div role='button' key={`tag_${i}`} tabIndex={0} 
												aria-label={`#${v}: tag in search list. Press Enter to remove.`} className='tag'
												onKeyDown={(e)=>{
													if(e.key === "Enter") {
														tagList.splice(i, 1)
														inputElement.focus()
														setTagList([...tagList])
													}
												}}
												onClick={()=>{
													tagList.splice(i, 1)
													setTagList([...tagList])
													inputElement.focus()
												}}>{v}</div>
											))}
										</div>
										{tempTag != "" && 
												
											<div className='tag-dropdown'>
											{
												!defTags ? <div className='notice'>Loading...</div>
												: 
												defTags.length == 0 && status == "success" ?
												<div className='notice'>No tags found.</div>
												:
												defTags.map((t,i)=>{
													return <button 
													className={`drop-entry ${i == focusedTag ? 'selected' : ''}`}
													key={`dropdown_tag_${i}`}
													onClick={()=>(enterTag(t.name))}>
														<div>#{t.name}</div>
														<div className='used-count'>{t.used_count}</div>
													</button>
												})
											}
											</div>	
										}
										<input
											type="text"
											id='searchinput'
											autoComplete='off'
											placeholder="Search widgets by title, author, or #tag..."
											value={searchInput}
											onChange={handleSearch}
											onKeyDown={handleSearchEnter}
										/>
										{searchInput && <button className="search-close" onClick={clearSearch} />}
										{
											tempTag == "" &&
											<button className='add-tag'
											onClick={triggerTagMenu}>
												<b>+</b> add new tag
											</button>
										}
									</div>
								</div>
								
								{ isFiltered && 
								<div className="filters">
									<div className='sublabel'>Showing <b>{entries.length}</b> widgets</div>
									<div>
										<span className='sublabel'>Sort by: </span>
										<select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
											{SORT_OPTIONS.map((s) => (
												<option key={s.value} value={s.value}>
													{s.label}
												</option>
											))}
										</select>
									</div>
								</div>
								}
							</div>
							{
								!isFiltered ?
								<CommunityLibraryDashboard setCategories={setSelectedCategories}/>
								:
								<>
								{contentRender}
								</>
							}
						</div>
					</div>
				</section>
			</div>

			{reportingEntry && (
				<CommunityLibraryReportDialog
					entry={reportingEntry}
					onClose={() => setReportingEntry(null)}
					onSuccess={() => {
						setReportingEntry(null)
					}}
				/>
			)}
		</div>
	)
}

export default CommunityLibrary
