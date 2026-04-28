import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import CommunityLibraryCard from './community-library-card'
import CommunityLibraryReportDialog from './community-library-report-dialog'
import {
	useCommunityLibraryList,
	useCopyFromLibrary,
	useToggleLike,
} from './hooks/useCommunityLibrary'
import useDebounce from './hooks/useDebounce'
import './community-library.scss'

const CATEGORIES = [
	{ value: '', label: 'All Categories' },
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
	const [selectedWidgetType, setSelectedWidgetType] = useState('')
	const [selectedCategory, setSelectedCategory] = useState('')
	const [selectedCourseLevel, setSelectedCourseLevel] = useState('')
	const [sortBy, setSortBy] = useState('newest')
	const [reportingEntry, setReportingEntry] = useState(null)
	const [copySuccess, setCopySuccess] = useState(null)

	const searchText = useDebounce(searchInput, 500)

	const clearSearch = () => {
		setSearchInput('')
	}

	const { entries, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
		useCommunityLibraryList(
			searchText,
			selectedWidgetType,
			selectedCategory,
			selectedCourseLevel,
			sortBy,
		)

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

	const featuredEntries = useMemo(() => entries.filter((e) => e.featured), [entries])

	const isFiltered = searchText || selectedWidgetType || selectedCategory || selectedCourseLevel

	const widgetTypeOptions = useMemo(() => {
		if (!widgets.length) return []
		return widgets.filter((w) => w.in_catalog).sort((a, b) => a.name.localeCompare(b.name))
	}, [widgets])

	let featuredRender = null
	if (!isFiltered && featuredEntries.length > 0) {
		featuredRender = (
			<div className="featured-section">
				<h2 className="section-label">Featured</h2>
				<div className="entries-grid featured">
					{featuredEntries.map((entry) => (
						<CommunityLibraryCard
							key={entry.id}
							entry={entry}
							onCopy={handleCopy}
							onLike={handleLike}
							onReport={handleReport}
							copySuccess={copySuccess === entry.id}
						/>
					))}
				</div>
			</div>
		)
	}

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
						onClick={() => {
							clearSearch()
							setSelectedWidgetType('')
							setSelectedCategory('')
							setSelectedCourseLevel('')
							document.getElementById("filter-form").reset();
						}}
					>
						Clear Filters
					</button>
				)}
				<div className='not-found-img' role='presentation'></div>
			</div>
		)
	} else {
		const displayEntries = isFiltered ? entries : entries.filter((e) => !e.featured)
		contentRender = (
			<>
				<div className="entries-grid">
					{displayEntries.map((entry) => (
						<CommunityLibraryCard
							key={entry.id}
							entry={entry}
							onCopy={handleCopy}
							onLike={handleLike}
							onReport={handleReport}
							copySuccess={copySuccess === entry.id}
						/>
					))}
				</div>
				<div ref={loadMoreRef} className="load-more-sentinel">
					{isFetchingNextPage && <span>Loading more...</span>}
				</div>
			</>
		)
	}

	return (
		<div className="community-library">
			<link rel="preload" href="/img/chevron-down.svg" />
			<div className="container">
				<section className="page">
					<div className="top">
						<h1>Community Library</h1>
						<h3>This is a somewhat detailed description of the Community Library.</h3>
					</div>

					<div className='row'>
						<form id="filter-form" className='sidebar'>
							<h3>FILTERS</h3>
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
											<input defaultChecked={v.value == ""} type='radio' name='discipline' value={v.value} id={`${v.value == "" ? "all" : v.value}-cat-check`} onChange={(e) => setSelectedCategory(e.target.value)}/>
											<label htmlFor={`${v.value == "" ? "all" : v.value}-cat-check`}>{v.label}</label>										
										</div>)
									})}
								</div>
							</details>
							<details open>
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
								<div className="search-bar">
									<div className="search-icon"><svg viewBox="0 0 250.313 250.313"><path d={`${GLASS_PATH}`} clipRule="evenodd" fillRule="evenodd"></path></svg></div>
									<input
										type="text"
										placeholder="Search widgets by title, keyword, or author..."
										value={searchInput}
										onChange={(e) => setSearchInput(e.target.value)}
									/>
									{searchInput && <button className="search-close" onClick={clearSearch} />}
								</div>

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
							</div>

							{featuredRender}
							{contentRender}
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
