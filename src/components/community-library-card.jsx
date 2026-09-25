import React, {useState} from 'react'
import { iconUrl } from '../util/icon-url'

const HEART_FILLED =
	'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
const HEART_OUTLINE =
	'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z'
const FLAG_ICON = 'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z'
const COPY_PATH = "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"


const CommunityLibraryCard = ({ entry, categoryObject, highlightedTags = [], skinFeatured = false }) => {
	const {
		instance_id,
		instance_name,
		widget,
		owner_display_name,
		category,
		category_display,
		course_level_display,
		copy_count,
		like_count,
		user_has_liked,
		featured,
		latest_snapshot_id,
	} = entry

	// count: number of tags to display
	const tagRender = (count) => {
		if(entry.tags.length <= 0)
			return (<p>No tags found.</p>)

		const tags = [...(new Set([...highlightedTags])).union(new Set([...entry.tags]))]

		return (<>
			{tags.map((t, i) => {
				if (i >= 2) return
				const name = t.slice(0,15)
				return (<span className={`badge ${highlightedTags.includes(t) ? 'highlighted' : ''}`} key={i}>
					#{`${name}${t.length > 15 ? '...':''}`}
				</span>)
			})}
			<span className='tiny-text'>{entry.tags.length > count ? `+${entry.tags.length-count}` : ""}</span>
		</>)
	}

	if(!categoryObject) return (<div>Loading...</div>)

	if(skinFeatured)
	return (
		<div className={`featured-card`} >
			<a href={`/community-library/${entry.id}/`} className="card-header" draggable="false"
			aria-label={`${instance_name}: a featured ${widget?.name} widget by ${owner_display_name != "" ? owner_display_name : "Unknown"}. 
			${category_display ? category_display : "Unknown category"}. ${course_level_display ? `${course_level_display}. ` : ""}
			${entry.tags && entry.tags.length > 0 ? `Tags: ${entry.tags.map((v,i) => `#${v}`)}` : `No tags`}.
			 Likes: ${entry.like_count}. Copies: ${entry.copy_count}`}>
				<div className='banner' style={{backgroundColor: categoryObject.color}}>
					<img className='banner-img' src={categoryObject.banner}/>
				</div>
				
				<div className="img-holder">
					<img src={iconUrl('/widget/', widget?.dir, 92)} alt={widget?.name} draggable="false"/>
				</div>
				<div className="card-content">
					
					<h3>{instance_name}</h3>
					<p className="owner">by {owner_display_name != "" ? owner_display_name : "Unknown"}</p>
					{category_display && <div className="badge category">{category_display}</div>}
					
					<div className='badges'>
						{tagRender(2)}
					</div>
				</div>
			</a>
		</div>
	)

	return (
		<div className={`library-card animate`}>
			<div className='banner' style={{backgroundColor: categoryObject.color}}></div>
			<img className='banner-img' src={categoryObject.banner}/>

			<a href={`/community-library/${entry.id}/`} className='card-content'
			aria-label={`${instance_name}: a ${widget?.name} widget by ${owner_display_name != "" ? owner_display_name : "Unknown"}. 
			${category_display ? category_display : "Unknown category"}. ${course_level_display ? `${course_level_display}. ` : ""}
			${entry.tags && entry.tags.length > 0 ? `Tags: ${entry.tags.map((v,i) => `#${v}`)}` : `No tags`}.
			 Likes: ${entry.like_count}. Copies: ${entry.copy_count}`}>
				<div className="img-holder">
					<img alt={`${widget?.name} widget icon`} src={iconUrl('/widget/', widget?.dir, 92)} alt={widget?.name} />
				</div>
				<div className="card-details">
					<h3>{instance_name}</h3>
					<span className="owner">by {owner_display_name != "" ? owner_display_name : "Unknown"}</span>
					<div className='row' style={{gap:"4px"}}>
						{course_level_display && <span className="badge level">{course_level_display}</span>}
						{category_display && <span className="badge category">{category_display}</span>}
					</div>
				</div>
			</a>
			<hr/>
			<div className='row meta'>
				<div className='badges'>
					{tagRender(2)}
				</div>

				<div className='badges'>
					<span className="copy-count" aria-label={`${copy_count} copies`}>
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
							<path d={COPY_PATH} />
						</svg>
						{copy_count}
					</span>
					<span
						className={`like-btn`}
						aria-label={`${like_count} likes`}
					>
						<svg viewBox="0 0 24 24" width="16" height="16">
							<path d={user_has_liked ? HEART_FILLED : HEART_OUTLINE} />
						</svg>
						<span>{like_count}</span>
					</span>
				</div>
			</div>
		</div>
	)
}

export default CommunityLibraryCard
