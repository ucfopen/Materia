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
	{ value: 'most_liked', label: 'Most Liked' },
	{ value: 'alphabetical', label: 'A-Z' },
]

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
						}}
					>
						Clear Filters
					</button>
				)}
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
			<div className="container">
				<section className="page">
					<div className="top">
						<h1>Community Library</h1>
					</div>

					<div className="controls">
						<div className="search-bar">
							<input
								type="text"
								placeholder="Search by name..."
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
							/>
							{searchInput && <button className="search-close" onClick={clearSearch} />}
						</div>

						<div className="filters">
							<select
								value={selectedWidgetType}
								onChange={(e) => setSelectedWidgetType(e.target.value)}
							>
								<option value="">All Widget Types</option>
								{widgetTypeOptions.map((w) => (
									<option key={w.id} value={w.id}>
										{w.name}
									</option>
								))}
							</select>

							<select
								value={selectedCategory}
								onChange={(e) => setSelectedCategory(e.target.value)}
							>
								{CATEGORIES.map((c) => (
									<option key={c.value} value={c.value}>
										{c.label}
									</option>
								))}
							</select>

							<select
								value={selectedCourseLevel}
								onChange={(e) => setSelectedCourseLevel(e.target.value)}
							>
								{COURSE_LEVELS.map((l) => (
									<option key={l.value} value={l.value}>
										{l.label}
									</option>
								))}
							</select>

							<select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
								{SORT_OPTIONS.map((s) => (
									<option key={s.value} value={s.value}>
										{s.label}
									</option>
								))}
							</select>
						</div>
					</div>

					{featuredRender}
					{contentRender}
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
