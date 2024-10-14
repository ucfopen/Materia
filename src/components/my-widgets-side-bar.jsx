import React, { useState, useMemo } from 'react'
// import { useQuery } from 'react-query'
import MyWidgetsInstanceCard from './my-widgets-instance-card'
import LoadingIcon from './loading-icon'
import CheckboxButton from './checkbox-button'
import { apiGetScoreSummaryBatch } from '../util/api';


const MyWidgetsSideBar = ({ instances, isFetching, selectedId, onClick, beardMode, beards }) => {
	const [searchText, setSearchText] = useState('')
	const [filterDrafts, setFilterDrafts] = useState(false);
	const [filterPublished, setFilterPublished] = useState(false);
	const [filterAttempts, setFilterAttempts] = useState(false);
	const [filterGuestAccess, setFilterGuestAccess] = useState(false);
	const [filterOpen, setFilterOpen] = useState(false); // Separate filter for open widgets
	const [filterExpired, setFilterExpired] = useState(false);
	const [filterEmbedded, setFilterEmbedded] = useState(false);
	const [resetFilters, setResetFilters] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const handleToggleFilters = (isChecked) => {
		setShowFilters(isChecked);
	};

	const hiddenSet = useMemo(() => {
		const result = new Set()
		const re = RegExp(searchText, 'i')
		const currentTime = Math.floor(Date.now()/1000);
		instances.forEach(i => {
			const matchesSearch = re.test(`${i.name} ${i.widget.name} ${i.id}`)
			const matchesDrafts = filterDrafts ? i.is_draft : true
			const matchesPublished = filterPublished ? !i.is_draft : true
			const hasAttempts = filterAttempts ? i.attempts !== -1 : true;
			const hasGuestAccess = filterGuestAccess ? i.guest_access : true;
			//filtering open widgets
			const isOpen = i.open_at <= currentTime && (i.close_at === -1 || i.close_at > currentTime);
			const matchesOpen = filterOpen ? isOpen : true;
			//filtering expired widgets
			const isExpired = i.close_at !== -1 && i.close_at < currentTime;
			const matchesExpired = filterExpired ? isExpired : true;
			//filtering for embedded widgets
			const isEmbedded = filterEmbedded ? i.is_embedded : true;

			if (!matchesSearch || !matchesDrafts || !matchesPublished ||
				!hasAttempts || !hasGuestAccess || !matchesOpen || !matchesExpired || !isEmbedded ) {
				result.add(i.id)
			}
		})

		return result
	}, [instances, searchText, filterDrafts, filterPublished, filterAttempts, filterGuestAccess,
		filterOpen, filterExpired, filterEmbedded])

	const handleSearchInputChange = e => setSearchText(e.target.value)

	const handleSearchCloseClick = () => {
		setSearchText('');
		setFilterDrafts(false);
		setFilterPublished(false);
		setFilterAttempts(false);
		setFilterGuestAccess(false);
		setFilterOpen(false);
		setFilterExpired(false);
		setFilterEmbedded(false);
		setResetFilters(true);
		setTimeout(() => setResetFilters(false), 0); // Clear reset after it propagates
	};

	const handleDraftsChange = (isChecked) => setFilterDrafts(isChecked);
	const handlePublishedChange = (isChecked) => setFilterPublished(isChecked);
	const handleAttemptsChange = (isChecked) => setFilterAttempts(isChecked);
	const handleGuestAccessChange = (isChecked) => setFilterGuestAccess(isChecked);
	const handleOpenChange = isChecked => setFilterOpen(isChecked);
	const handleExpiredChange = isChecked => setFilterExpired(isChecked);
	const handleEmbeddedChange = isChecked => setFilterEmbedded(isChecked);

	let widgetInstanceElementsRender = null
	if (!isFetching || instances?.length > 0) {
		widgetInstanceElementsRender = instances?.map((inst, index) => (
			<MyWidgetsInstanceCard
				key={inst.id}
				inst={inst}
				indexVal={index}
				onClick={onClick}
				selected={inst.id === selectedId}
				hidden={hiddenSet.has(inst.id)}
				beard={beardMode ? beards[index] : ''}
				searchText={searchText}
			/>
		))
	}

	let searchBoxRender = null
	if (isFetching) {
		searchBoxRender =
		<div className='search loading'>
			<LoadingIcon size='sm' width='20px' left='10px'/>
			<span className='loading-message'>Loading Widgets...</span>
		</div>
	} else {
		searchBoxRender =
			<div className='searchContainer'>
				<div className='searchBarGroup' >
					<div className='search'>
						<div className="textbox-background">
							{/* Search Icon */}
							<div className="search-icon">
								<svg viewBox="0 0 250.313 250.313">
									<path d={`m244.19 214.6l-54.379-54.378c-0.289-0.289-0.628-0.491-0.93-0.76 10.7-16.231 16.945-35.66 16.945-56.554 0-56.837-46.075-102.91-102.91-102.91s-102.91 46.075-102.91 102.91c0 56.835 46.074 102.91 102.91 102.91 20.895 0 40.323-6.245 56.554-16.945 0.269 0.301 0.47 0.64 0.759 0.929l54.38 54.38c8.169 8.168 21.413 8.168 29.583 0 8.168-8.169 8.168-21.413 0-29.582zm-141.28-44.458c-37.134 0-67.236-30.102-67.236-67.235 0-37.134 30.103-67.236 67.236-67.236 37.132 0 67.235 30.103 67.235 67.236s-30.103 67.235-67.235 67.235z`}
									clipRule="evenodd"
									fillRule="evenodd"/>
								</svg>
							</div>

							{/* Search Input */}
							<input
								className="textbox"
								type="text"
								value={searchText}
								onChange={handleSearchInputChange}
							/>

							{/* Search Close */}
							<div className="search-close" onClick={handleSearchCloseClick}>
								x
							</div>

						</div>

				</div>

				{/* add a button to toggle filters */}
				<CheckboxButton
					labelOn='&#9660;'
					labelOff='&#9654;'
					onChange={handleToggleFilters}
					reset={resetFilters}
					customStyle={{ maxHeight: '17px', marginTop: '10px', fontSize: '0.57rem' }}
					fontSize={'0.57rem'}
				/>

			</div>
				<div className={`filtersGroup ${showFilters ? 'show' : ''}`}>
						<CheckboxButton
							labelOn="Drafts: On"
							labelOff="Drafts: Off"
							onChange={handleDraftsChange}
							reset={resetFilters}
							ID="focus1"
						/>
						<CheckboxButton
							labelOn="Published: On"
							labelOff="Published: Off"
							onChange={handlePublishedChange}
							reset={resetFilters}
							ID="focus11"
						/>
						<CheckboxButton
							labelOn="Limited Attemps: On"
							labelOff="Limited Attemps: Off"
							onChange={handleAttemptsChange}
							reset={resetFilters}
							ID="focus111"
						/>
						<CheckboxButton
							labelOn="Guest Access: On"
							labelOff="Guest Access: Off"
							onChange={handleGuestAccessChange}
							reset={resetFilters}
							ID="focus1111"
						/>
						<CheckboxButton
							labelOn="Open: On"
							labelOff="Open: Off"
							onChange={handleOpenChange}
							reset={resetFilters}
							ID="focus11111"
						/>
						<CheckboxButton
							labelOn="Expired: On"
							labelOff="Expired: Off"
							onChange={handleExpiredChange}
							reset={resetFilters}
							ID="focus111111"
						/>
						<CheckboxButton
							labelOn="Embedded: On"
							labelOff="Embedded: Off"
							onChange={handleEmbeddedChange}
							reset={resetFilters}
							ID="focus1111111"
						/>
				</div>

			</div>
	}

	return (
		<aside className='my-widgets-side-bar'>
			<div className='top'>
				<h1>Your Widgets:</h1>
			</div>
			{searchBoxRender}
			<div className='widget_list' data-container='widget-list'>
				{widgetInstanceElementsRender}
			</div>
		</aside>
	)
}

export default MyWidgetsSideBar
