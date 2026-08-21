import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiUserVerify } from '../util/api'
import './cl-detail.scss'
import CommunityLibraryReportDialog from './community-library-report-dialog'
import { iconUrl } from '../util/icon-url'

import {
	useCopyFromLibrary,
	useToggleLike,
} from './hooks/useCommunityLibrary'

const HEART_FILLED =
	'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
const HEART_OUTLINE =
	'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z'
const FLAG_ICON = 'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z'
const EXTERNAL_PATH = "M18 10.82C17.7348 10.82 17.4804 10.9254 17.2929 11.1129C17.1054 11.3004 17 11.5548 17 11.82V19C17 19.2652 16.8946 19.5196 16.7071 19.7071C16.5196 19.8946 16.2652 20 16 20H5C4.73478 20 4.48043 19.8946 4.29289 19.7071C4.10536 19.5196 4 19.2652 4 19V8C4 7.73478 4.10536 7.48043 4.29289 7.29289C4.48043 7.10536 4.73478 7 5 7H12.18C12.4452 7 12.6996 6.89464 12.8871 6.70711C13.0746 6.51957 13.18 6.26522 13.18 6C13.18 5.73478 13.0746 5.48043 12.8871 5.29289C12.6996 5.10536 12.4452 5 12.18 5H5C4.20435 5 3.44129 5.31607 2.87868 5.87868C2.31607 6.44129 2 7.20435 2 8V19C2 19.7956 2.31607 20.5587 2.87868 21.1213C3.44129 21.6839 4.20435 22 5 22H16C16.7956 22 17.5587 21.6839 18.1213 21.1213C18.6839 20.5587 19 19.7956 19 19V11.82C19 11.5548 18.8946 11.3004 18.7071 11.1129C18.5196 10.9254 18.2652 10.82 18 10.82ZM21.92 2.62C21.8185 2.37565 21.6243 2.18147 21.38 2.08C21.2598 2.02876 21.1307 2.00158 21 2H15C14.7348 2 14.4804 2.10536 14.2929 2.29289C14.1054 2.48043 14 2.73478 14 3C14 3.26522 14.1054 3.51957 14.2929 3.70711C14.4804 3.89464 14.7348 4 15 4H18.59L8.29 14.29C8.19627 14.383 8.12188 14.4936 8.07111 14.6154C8.02034 14.7373 7.9942 14.868 7.9942 15C7.9942 15.132 8.02034 15.2627 8.07111 15.3846C8.12188 15.5064 8.19627 15.617 8.29 15.71C8.38296 15.8037 8.49356 15.8781 8.61542 15.9289C8.73728 15.9797 8.86799 16.0058 9 16.0058C9.13201 16.0058 9.26272 15.9797 9.38458 15.9289C9.50644 15.8781 9.61704 15.8037 9.71 15.71L20 5.41V9C20 9.26522 20.1054 9.51957 20.2929 9.70711C20.4804 9.89464 20.7348 10 21 10C21.2652 10 21.5196 9.89464 21.7071 9.70711C21.8946 9.51957 22 9.26522 22 9V3C21.9984 2.86932 21.9712 2.74022 21.92 2.62Z"
const COPY_PATH = "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
const CHECK_PATH = "M18.7 7.20039C18.3 6.80039 17.7 6.80039 17.3 7.20039L9.8 14.7004L6.7 11.6004C6.3 11.2004 5.7 11.2004 5.3 11.6004C4.9 12.0004 4.9 12.6004 5.3 13.0004L9.1 16.8004C9.3 17.0004 9.5 17.1004 9.8 17.1004C10.1 17.1004 10.3 17.0004 10.5 16.8004L18.7 8.60039C19.1 8.20039 19.1 7.60039 18.7 7.20039Z"

const CommunityLibraryDetail = ({entry, queryError}) => {
	const [errorState, setErrorState] = useState(false)
	const [entryName, setEntryName] = useState(false)
	const [copySuccess, setCopySuccess] = useState(false)
	const [likeSuccess, setLikeSuccess] = useState(false)
	const [reportingEntry, setReportingEntry] = useState(null)
	
	const copyMutation = useCopyFromLibrary()
	const likeMutation = useToggleLike()

	useEffect(() => {
		if (!!queryError && queryError?.status === 403) {
			setErrorState('banned')
		}
		else if (!!queryError) {
			setErrorState('error')
		}
	}, [queryError])

	useEffect(() => {
		if (!!entry && !errorState) {
			setEntryName(entry.instance_name)
		} else if (errorState == 'banned') {
			setEntryName('Banned Entry')
		} else {
			setEntryName('Entry Unavailable')
		}
	},[entry, errorState])

	const handleCopy = useCallback(
		(entryId) => {
			copyMutation.mutate(entryId, {
				onSuccess: (data) => {
					setCopySuccess(true)
					setTimeout(()=>setCopySuccess(false), 3000)
					entry.copy_count++
					entry.user_copy = data.id
				},
			})
		},
		[copyMutation],
	)

	const { data: userPerms } = useQuery({
		queryKey: ['isLoggedIn'],
		queryFn: apiUserVerify,
		staleTime: Infinity,
		retry: false
	})

	const dontAllow = useMemo(()=>{
		return !userPerms?.isAuthenticated || userPerms?.permLevel == "student" || errorState != false
	}, [userPerms, errorState])

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
				{!entry && !errorState ? "Loading..." : entryName}
			</div>
			<section className='entry'>
				<div className={`card shadow ${errorState != false ? 'error' : ''}`}>
					<div className='header'>
						<div className='row between'>
							<h1>{!entry && !errorState ? "Loading..." : entryName}</h1>
							<div className='row fit' style={{gap:"4px"}}>
								<div className='tag category'>{!entry ? "" : entry.category_display}</div>
								{entry && entry.course_level_display != "" &&
								<div className='tag course-level'>{entry.course_level_display}</div>
								}
							</div>
						</div>
						
						<div rel='author' className='author'>Created by <b>{!entry ? "Loading" : entry.owner_display_name}</b></div>
					</div>
					<div className='content'>
						<h3>WIDGET ENGINE</h3>
						<div className='card alt-border'>
							<div className='content row small'>
								{
									entry ?
									<img src={iconUrl('/widget/', entry.widget.dir, 92)}/>
									:
									<div style={{width: "92px", height: "92px", borderRadius: "4px", backgroundColor: "#aaa", flexShrink: 0}}></div>
								}
								<div className='col'>
									<h2>{!entry ? "" : entry.widget.name}</h2>
									{!entry ? "" : entry.widget.meta_data.excerpt}
								</div>
								<a target="_blank" href={`/widgets/${!entry ? "" : entry.widget.dir}`} aria-label={`Link to Widget Catalog`}>
									<svg className='ext-link' viewBox="0 0 24 24" width="24" height="24" aria-label='External Link Icon'>
										<path d={EXTERNAL_PATH} />
									</svg>
								</a>
							</div>
						</div>
						<br/>
						<h3>TAGS</h3>
						<div className='row wrap' style={{gap: "8px"}}>
						{
							entry && entry.tags.length != 0 ? entry.tags.map((t, i)=>(
								<div className='tag' key={i}>#{t}</div>
							)) : <div>This entry has no tags.</div>
						}
						</div>
						<br/>
						<h3>METADATA</h3>
						<div>{!entry ? "Loading" : `Created ${(new Date(entry.created_at)).toLocaleDateString(undefined, dateOptions)}`}</div>
					</div>
				</div>
				{
					
				}
				<div className='col' style={{gap:"16px"}}>
					{
						dontAllow && errorState == 'error' &&
						<div className='card side red center shadow alt-border'>
							<div className='content'>
								There was an error accessing this Community Library entry.
							</div>
						</div>
					}
					{
						((dontAllow && errorState == 'banned') || entry?.is_banned) &&
						<div className='card side red center shadow alt-border'>
							<div className='content'>
								This entry has been banned from the Community Library.
							</div>
						</div>
					}
					{
						dontAllow && errorState == false &&
						<div className='card side blue center shadow alt-border'>
							<div className='content'>
								You must be authenticated as an instructor to access widgets in the Community Library.
							</div>
						</div>
					}
					<div className='card side blue center shadow alt-border'>
						<div className='content'>
							{
								entry && entry.user_copy ?
								<a href={`/my-widgets/#${entry.user_copy}`}>
									<button className='blue space row center' style={{gap:"8px"}} type='button'>
										{copySuccess ?
										<>
											<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
												<path d={CHECK_PATH} />
											</svg>
											Copied!
										</>
										:
										<>
											<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="none" aria-label='External Link Icon'>
												<path d={EXTERNAL_PATH} />
											</svg>
											Go to Your Copy	
										</>
										}
									</button>
								</a>
								:
								<button className='blue space row center' style={{gap:"8px"}} disabled={dontAllow} onClick={() => handleCopy(entry.id)}>
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
										<path d={COPY_PATH} />
									</svg>
									Copy to My Widgets
								</button>
							}
							<a target='_blank' className='no-under' href={`/preview/snapshot/${!entry ? 0 : entry.latest_snapshot_id}`}>
								<button disabled={dontAllow} className='yellow h-sm space row center' style={{gap:"8px"}}>
									<svg viewBox="0 0 24 24" width="16" height="16" aria-label='External Link Icon'>
										<path d={EXTERNAL_PATH} />
									</svg>
									Preview Widget
								</button>
							</a>
							{(!dontAllow && !(entry && entry.user_copy)) &&
							<div>This creates a private copy in your account. The original widget will not be affected.</div>
							}
						</div>
					</div>
					<div className='card side shadow alt-border'>
						<div className='content'>
							<div className='row'>
								<button className={`col ${dontAllow ? "" : "copy-btn"}`} disabled={dontAllow || !entry || entry.user_copy} onClick={() => handleCopy(entry.id)}>
									<div className='big'>{!entry ? 0 : entry.copy_count}</div>
									<div className='row center' style={{gap:"4px"}}>
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
											<path d={COPY_PATH} />
										</svg>
										{`Cop${(!entry ? 0 : entry.copy_count) == 1 ? 'y' : 'ies'}`}
									</div>
								</button>
								<button className='col like' disabled={dontAllow} onClick={() => handleLike(entry.id)}>
									<div className='big'>{!entry ? 0 : entry.like_count}</div>
									<div className='row center' style={{gap:"4px"}}>
										<svg viewBox="0 0 24 24" width="16" height="16" className='like'>
											<path d={!entry ? HEART_OUTLINE : entry.user_has_liked ? HEART_FILLED : HEART_OUTLINE} />
										</svg>
										{`Recommendation${(!entry ? 0 :entry.like_count) != 1 ? 's' : ''}`}
									</div>
								</button>
							</div>
							<hr/>
							<button disabled={dontAllow} className='h-sm row center' style={{gap: "4px"}} onClick={() => handleReport()}>
								<svg viewBox="0 0 24 24" width="18" height="18" fill='currentColor'>
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
