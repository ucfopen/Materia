import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import './cl-detail.scss'
import CommunityLibraryReportDialog from './community-library-report-dialog'

import {
	useCommunityLibraryList,
	useCopyFromLibrary,
	useToggleLike,
} from './hooks/useCommunityLibrary'

const HEART_FILLED =
	'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
const HEART_OUTLINE =
	'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z'
const FLAG_ICON = 'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z'

const CommunityLibraryDetail = ({entry}) => {
	const [copySuccess, setCopySuccess] = useState(false)
	const [likeSuccess, setLikeSuccess] = useState(false)
	const [reportingEntry, setReportingEntry] = useState(null)
	
	const copyMutation = useCopyFromLibrary()
	const likeMutation = useToggleLike()

	const handleCopy = useCallback(
		(entryId) => {
			copyMutation.mutate(entryId, {
				onSuccess: () => {
					setCopySuccess(true)
					entry.copy_count++
					// setTimeout(() => setCopySuccess(null), 3000)
				},
			})
		},
		[copyMutation],
	)

	const handleLike = useCallback(
		(entryId) => {
			likeMutation.mutate(entryId, {
				onSuccess: () => {
					setLikeSuccess(true)
					entry.user_has_liked = !entry.user_has_liked
					if(entry.user_has_liked) {
						entry.like_count++
					} else {
						entry.like_count--
					}
				}
			})
		},
		[likeMutation],
	)

	const handleReport = () => {
		setReportingEntry(entry)
	}

	console.log(entry)

	if(!entry) return (
		<div>Loading</div>
	)

	const dateCreated = new Date(entry.created_at)
	const dateOptions = {
		year: "numeric",
		month: "long",
		day: "numeric",
	};

	return (
		<section className='page'>
			<div className='cl-nav'>
				<a href='/community-library'>Community Library</a>
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
					<path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path>
					<path fill="none" d="M0 0h24v24H0V0z"></path>
				</svg>
				{entry.instance_name}
			</div>
			<section className='entry'>
				<div className='card shadow'>
					<div className='header'>
						<div className='row between'>
							<h1>{entry.instance_name}</h1>
							<div className='row fit' style={{gap:"4px"}}>
								<div className='tag category'>{entry.category_display}</div>
								{/* <div className='tag course-level'>{entry.course_level_display}</div> */}
							</div>
						</div>
						
						<div rel='author' className='author'>Created by <b>John Doe</b></div>
					</div>
					<div className='content'>
						<h3>WIDGET ENGINE</h3>
						<div className='card'>
							<div className='content row small'>
								{/* <div style={{width: "80px", height: "80px", borderRadius: "4px", backgroundColor: "#aaa", flexShrink: 0}}></div> */}
								<img src={`/widget/${entry.widget.dir}img/icon-92.png`}/>
								<div className='col'>
									<h2>{entry.widget.name}</h2>
									{entry.widget.meta_data.excerpt}
								</div>
								<a target="_blank" href={`/widgets/${entry.widget.dir}`} aria-label={`Link to ${entry.widget.name} Widget`}>
									<img className='ext-link' src='/img/external_link.svg' alt='External Link Icon'/>
								</a>
							</div>
						</div>
						<br/>
						<h3>TAGS</h3>
						<div className='row' style={{gap: "8px"}}>
							<div className='tag'>#test-a</div>
							<div className='tag'>#testingb</div>
						</div>
						<br/>
						<h3>METADATA</h3>
						<div>{`Created ${dateCreated.toLocaleDateString(undefined, dateOptions)}`}</div>
					</div>
				</div>
				<div className='col' style={{gap:"16px"}}>
					<div className='card side blue center shadow'>
						<div className='content'>
							<button className='blue space row center' style={{gap:"8px"}} onClick={() => handleCopy(entry.id)}>
								<img className='' src={`/img/${copySuccess ? "check" : "copy"}-white.svg`} alt='Copy Icon'/>
								{copySuccess ? 'Copied!' : 'Copy to My Widgets'}
							</button>
							<a target='_blank' className='no-under' href={`/preview/snapshot/${entry.id}`}>
								<button className='yellow h-sm space row center' style={{gap:"8px"}}>
									<img className='' src='/img/external_link.svg' alt='External Link Icon'/>
									Preview Widget
								</button>
							</a>
							This creates a private copy in your account. The original widget will not be affected.
						</div>
					</div>
					<div className='card side shadow'>
						<div className='content'>
							<div className='row'>
								<button className='col' onClick={() => handleCopy(entry.id)}>
									<div className='big'>{entry.copy_count}</div>
									<div className='row center' style={{gap:"4px"}}>
										<img className='' src={`/img/${copySuccess ? "check" : "copy"}.svg`} style={{width: "16px", height: "16px"}} alt='Copy Icon'/>
										{`Cop${entry.copy_count == 1 ? 'y' : 'ies'}`}
									</div>
								</button>
								<button className='col like' onClick={() => handleLike(entry.id)}>
									<div className='big'>{entry.like_count}</div>
									<div className='row center' style={{gap:"4px"}}>
										<svg viewBox="0 0 24 24" width="16" height="16" className='like'>
											<path d={entry.user_has_liked ? HEART_FILLED : HEART_OUTLINE} />
										</svg>
										{`Recommendation${entry.like_count != 1 ? 's' : ''}`}
									</div>
								</button>
							</div>
							<hr/>
							<button className='h-sm row center' style={{gap: "4px"}} onClick={() => handleReport()}>
								<svg viewBox="0 0 24 24" width="18" height="18">
									<path d={FLAG_ICON} />
								</svg>
								Report This Widget
							</button>
						</div>
					</div>
				</div>
			</section>

			{reportingEntry && (
				<CommunityLibraryReportDialog
					entry={reportingEntry}
					onClose={() => setReportingEntry(null)}
					onSuccess={() => {
						setReportingEntry(null)
					}}
				/>
			)}
		</section>
	)
}

export default CommunityLibraryDetail
