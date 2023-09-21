import React, { useState, useMemo } from 'react'
import CatalogCard from './catalog-card'
import KeyboardIcon from './keyboard-icon'
import ScreenReaderIcon from './screen-reader-icon'
import './catalog.scss'

const isMobileDevice = () => window.matchMedia('(max-width: 720px)').matches

const Catalog = ({widgets = [], isLoading = true}) => {
	const [state, setState] = useState({
		searchText: '',
		showingFilters: false,
		showingAccessibility: false,
		activeFilters: [],
		showMobileFilters: false,
		showMobileAccessibilityFilters: false
	})
	const totalWidgets = widgets.length

	// collect all unique features and supported data
	const filters = useMemo(() => {
			const features = new Set()
			const accessibility = new Set()
			widgets.forEach(w => {
				w.meta_data.features.forEach(f => {features.add(f)})
				w.meta_data.supported_data.forEach(f => {features.add(f)})
				if(w.meta_data.hasOwnProperty('accessibility_keyboard')) accessibility.add('Keyboard Accessible')
				if(w.meta_data.hasOwnProperty('accessibility_reader')) accessibility.add('Screen Reader Accessible')
			})
			return {
				features: Array.from(features),
				accessibility: Array.from(accessibility)
			}
		},
		[widgets]
	)

	// filter widgets based on search & features
	const [filteredWidgets, isFiltered] = useMemo(() => {
		let isFiltered = false

		// in_catalog widgets are already being rendered via featured widgets
		// append remaining widgets that are playable but not in_catalog
		let results = widgets.filter(w => {
			return parseInt(w.is_playable) == 1 && parseInt(w.in_catalog) == 0
		})
		// filters are active, only match active filters
		if(state.activeFilters.length){
			isFiltered = true

			// find widgets that have all the active filters
			results = widgets.filter(w => {
				const {features, supported_data, accessibility_keyboard, accessibility_reader} = w.meta_data
				return state.activeFilters.every(f =>{
					if (features.includes(f) || supported_data.includes(f)) return true
					if (accessibility_keyboard && f === 'Keyboard Accessible') return true
					if (accessibility_reader && f === 'Screen Reader Accessible') return true

					return false
				})
			})
		}

		// search widget names
		if(state.searchText !== '') {
			isFiltered = true
			const re = new RegExp(state.searchText, 'i')
			results = results.filter(w => re.test(w.name))
		}

		return [results, isFiltered]
	}, [widgets, state.searchText, state.activeFilters])

	const toggleFilter = filter => {
		const newFilters = state.activeFilters.includes(filter)
		? state.activeFilters.filter(f => f != filter)
		: [...state.activeFilters, filter]

		setState({...state, activeFilters: newFilters, showMobileFilters: false})
	}

	const accessibilityLinkClickHandler = () => {
		if (state.showingAccessibility){
			setState({...state, showingAccessibility: !state.showingAccessibility, activeFilters: []})
		}
		else {
			setState({...state, showingAccessibility: !state.showingAccessibility})
		}
	}

	const filterLinkClickHandler = () => {
		if(state.showingFilters){
			setState({...state, showingFilters: !state.showingFilters, activeFilters: []})
		}
		else {
			setState({...state, showingFilters: !state.showingFilters})
		}
	}

	let searchCloseRender = null
	if (state.searchText) {
		searchCloseRender = (
			<button className='search-close'
				tabIndex='0'
				onClick={ () => { setState({...state, searchText: ''}) } } />
		)
	}

	let mobileFilterRender = null
	if (state.showMobileFilters) {
		const mobileFilterOptionsRender = filters.features.map(filter => (
			<label key={filter}>
				<input type='checkbox'
					className='filter-button'
					checked={state.activeFilters.includes(filter)}
					readOnly={true}
					onClick={ () => toggleFilter(filter) }
				/>
				{filter}
			</label>
		))

		mobileFilterRender = (
			<div
				id='filter-dropdown'
				className='mobile-only'
				aria-hidden={!isMobileDevice()}>
				{ mobileFilterOptionsRender }
			</div>
		)
	} else if (state.showMobileAccessibilityFilters) {
		const mobileFilterOptionsRender = filters.accessibility.map(filter => (
			<label key={filter}>
				<input type='checkbox'
					className='filter-button'
					checked={state.activeFilters.includes(filter)}
					readOnly={true}
					onClick={ () => toggleFilter(filter) }
				/>
				{filter}
			</label>
		))

		mobileFilterRender = (
			<div
				id='filter-dropdown'
				className='mobile-only accessibility'
				aria-hidden={!isMobileDevice()}>
				{ mobileFilterOptionsRender }
			</div>
		)
	}

	const filterOptionsRender = filters.features.map((filter, index) => {
		const isEnabled = state.activeFilters.includes(filter)
		const filterOptionClickHandler = () => toggleFilter(filter)
		return <button key={index}
				className={'feature-button' + (isEnabled ? ' selected' : '')}
				aria-label={`Filter by ${filter}. ${isEnabled ? 'Selected.' : ''}`}
				aria-hidden={!state.showingFilters}
				disabled={!state.showingFilters}
				onClick={ filterOptionClickHandler }>
				{filter}
			</button>
		}
	)

	const accessibilityOptionsRender = filters.accessibility.map((filter, index) => {
		const isEnabled = state.activeFilters.includes(filter)
		const filterOptionClickHandler = () => toggleFilter(filter)
		return <button key={index}
				className={'feature-button' + (isEnabled ? ' selected' : '')}
				aria-label={`Filter by ${filter}. ${isEnabled ? 'Selected.' : ''}`}
				aria-hidden={!state.showingAccessibility}
				disabled={!state.showingAccessibility}
				onClick={ filterOptionClickHandler }>
				{ filter == 'Keyboard Accessible' ? <KeyboardIcon color='#000' /> : '' }
				{ filter == 'Screen Reader Accessible' ? <ScreenReaderIcon color='#000' /> : '' }
				{filter}
			</button>
		}
	)

	let featuredWidgetsRender = null
	if (!isFiltered && totalWidgets > 0 ) {
		const featuredWidgetListRender = widgets.filter(w => w.in_catalog==='1')
		.map(w => <CatalogCard {...w} key={w.id} />)
		featuredWidgetsRender = (
			<div className='widget-group'>
				<h1 className='container-label'>
					<span>Featured Widgets</span>
				</h1>
				<div data-testid='featured-widgets' className='widgets-container featured'>
					{ featuredWidgetListRender }
				</div>
			</div>
		)
	}

	const filteredWidgetsRender = filteredWidgets.map(w =>
		<CatalogCard {...w} key={w.id} isFiltered activeFilters={state.activeFilters} />
	)

	let loadingOrWarningsRender = null
	if (filteredWidgets.length < 1) {
		const loadingMessageRender = isLoading ? <span>Loading Widgets...</span> : null

		let noWidgetsRender = null
		if (!isLoading) {
			if (isFiltered) {
				noWidgetsRender = (
					<span>
						No widgets match the filters you set.
						<button className='cancel_button'
							onClick={() => {
								setState({...state, searchText: '', activeFilters: []})
							}}>
							Show All
						</button>
					</span>
				)
			} else if (!widgets.length) {
				noWidgetsRender = <span>No Widgets Installed</span>
			} else {
				noWidgetsRender = null
			}
		}

		loadingOrWarningsRender = (
			<div id='no-widgets-message'>
				{ loadingMessageRender }
				{ noWidgetsRender }
			</div>
		)
	}

	let filterHiddenRender = null
	if (isFiltered) {
		filterHiddenRender = (
			<div id='hidden-count'>
				{totalWidgets - filteredWidgets.length} hidden by filters.
				<button className='cancel_button'
					onClick={() => {
						setState({...state, searchText: '', activeFilters: []})
					}}>
					Show All
				</button>
			</div>
		)
	}

	return (
		<div className='catalog'>
			<div className='container' id='widget-catalog-container'>
				<section className='page'>

					<div className='top'>
						<h1>Widget Catalog</h1>
						<aside>
							<span className='label'>Filter by:</span>
							<button
								className={`filter-toggle desktop-only ${state.showingFilters ? 'close-mode' : ''}`}
								aria-label={state.showingFilters ? 'Feature filters drawer open' : 'Filter catalog by features'}
								onClick={ filterLinkClickHandler }>
								Feature</button>
							<button
								className={`filter-toggle desktop-only ${state.showingAccessibility ? 'close-mode' : ''}`}
								aria-label={state.showingAccessibility ? 'Accessibility filters drawer open' : 'Filter catalog by accessibility'}
								onClick={ accessibilityLinkClickHandler }>
								Accessibility</button>
							<div className={'search' + (state.searchText === '' ? '' : ' not-empty')}>
								<input value={state.searchText} onChange={(e) => {setState({...state, searchText: e.target.value})}} type='text'/>
								<div className='search-icon'>
									<svg viewBox='0 0 250.313 250.313'>
										<path d='m244.19 214.6l-54.379-54.378c-0.289-0.289-0.628-0.491-0.93-0.76 10.7-16.231 16.945-35.66 16.945-56.554 0-56.837-46.075-102.91-102.91-102.91s-102.91 46.075-102.91 102.91c0 56.835 46.074 102.91 102.91 102.91 20.895 0 40.323-6.245 56.554-16.945 0.269 0.301 0.47 0.64 0.759 0.929l54.38 54.38c8.169 8.168 21.413 8.168 29.583 0 8.168-8.169 8.168-21.413 0-29.582zm-141.28-44.458c-37.134 0-67.236-30.102-67.236-67.235 0-37.134 30.103-67.236 67.236-67.236 37.132 0 67.235 30.103 67.235 67.236s-30.103 67.235-67.235 67.235z'
											clipRule='evenodd'
											fillRule='evenodd'/>
									</svg>
								</div>
								{ searchCloseRender }
							</div>
						</aside>
						
					</div>

					<div aria-hidden={!isMobileDevice()} className='mobile-filter-select mobile-only'>
						<button className='add-filter'
							onClick={ () =>  { setState({...state, showMobileFilters: !state.showMobileFilters, showMobileAccessibilityFilters: false}) } }>
							{state.activeFilters.length ? 'Filters' : 'Filter by Feature'}
						</button>
						<button className='add-filter'
							onClick={ () =>  { setState({...state, showMobileAccessibilityFilters: !state.showMobileAccessibilityFilters, showMobileFilters: false}) } }>
							{state.activeFilters.length ? 'Accessibility' : 'Filter by Accessibility'}
						</button>
						<div className='active-filters'>
							{ state.activeFilters.join(', ') }
						</div>
					</div>
					{ mobileFilterRender }
					<div id='filters-container'
						className={`ready ${state.showingFilters ? 'open' : 'closed'}`} aria-hidden={!state.showingFilters}>
						<div className='filter-labels-container' disabled={!state.showingFilters}>
							{ filterOptionsRender }
						</div>
					</div>
					<div id='filters-container'
						className={`ready ${state.showingAccessibility ? 'open' : 'closed'}`} aria-hidden={!state.showingAccessibility}>
						<div className='filter-labels-container accessibility' disabled={!state.showingAccessibility}>
							{ accessibilityOptionsRender }
						</div>
					</div>

					{ featuredWidgetsRender }

					<div data-testid='non-featured-widgets'
						className='widgets-container'>
						{ filteredWidgetsRender }
					</div>

					{ loadingOrWarningsRender }

					{ filterHiddenRender }
				</section>
			</div>
		</div>
	)
}

export default Catalog
