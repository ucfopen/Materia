import React from 'react'
import { iconUrl } from '../util/icon-url'

const HEART_FILLED =
	'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
const HEART_OUTLINE =
	'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z'
const FLAG_ICON = 'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z'

const CommunityLibraryCard = ({ entry, onCopy, onLike, onReport, copySuccess = false }) => {
	const {
		instance_id,
		instance_name,
		widget,
		owner_display_name,
		category_display,
		course_level_display,
		copy_count,
		like_count,
		user_has_liked,
		featured,
		latest_snapshot_id,
	} = entry

	return (
		<div className={`library-card ${featured ? 'featured' : ''}`}>
			<div className="card-header">
				<div className="img-holder">
					<img src={iconUrl('/widget/', widget?.dir, 275)} alt={widget?.name} />
				</div>
				<div className="card-title">
					<h3>{instance_name}</h3>
					<span className="widget-type">{widget?.name}</span>
					<span className="owner">by {owner_display_name}</span>
				</div>
			</div>

			<div className="card-meta">
				{category_display && <span className="badge category">{category_display}</span>}
				{course_level_display && <span className="badge level">{course_level_display}</span>}
			</div>

			<div className="card-stats">
				<button
					className={`like-btn ${user_has_liked ? 'liked' : ''}`}
					onClick={() => onLike(entry.id)}
					aria-label={user_has_liked ? 'Unlike this widget' : 'Like this widget'}
				>
					<svg viewBox="0 0 24 24" width="16" height="16">
						<path d={user_has_liked ? HEART_FILLED : HEART_OUTLINE} />
					</svg>
					<span>{like_count}</span>
				</button>
				<span className="copy-count">
					{copy_count} {copy_count === 1 ? 'copy' : 'copies'}
				</span>
			</div>

			<div className="card-actions">
				<a
					href={`/preview/snapshot/${latest_snapshot_id}/`}
					target="_blank"
					rel="noopener noreferrer"
					className="btn preview"
				>
					Preview
				</a>
				<button
					className={`btn use-this ${copySuccess ? 'success' : ''}`}
					onClick={() => onCopy(entry.id)}
					disabled={copySuccess}
				>
					{copySuccess ? 'Copied!' : 'Use This'}
				</button>
				<button
					className="btn report"
					onClick={() => onReport(entry)}
					aria-label="Report this widget"
					title="Report"
				>
					<svg viewBox="0 0 24 24" width="14" height="14">
						<path d={FLAG_ICON} />
					</svg>
				</button>
			</div>
		</div>
	)
}

export default CommunityLibraryCard
