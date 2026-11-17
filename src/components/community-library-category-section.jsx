import React, { useCallback } from 'react'
import CommunityLibraryCard from './community-library-card'
import { useCommunityLibraryList } from './hooks/useCommunityLibrary'

// converts a "#RRGGBB" color into an rgba() string with the given alpha
const hexToRgba = (hex, alpha) => {
	const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '')
	if (!match) return hex

	const [, r, g, b] = match
	return `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${alpha})`
}

const CommunityLibraryCategorySection = ({ category, setCategories }) => {

	const { entries } = useCommunityLibraryList(6, "", "", [category.slug], "", "", [], false)

	const categoryObject = {
		color: category.color,
		label: category.label,
		banner: category.banner_path
	}

	const getCatObject = useCallback(() => categoryObject, [category])

	return (
		<div className='category-box' style={{ backgroundColor: hexToRgba(category.color, 0.15) }}>
			<div className='row'>
				<h4>{category.label}</h4>
				<button className='see-all'
				aria-label={`See all ${category.label} widgets`}
				onClick={() => setCategories(new Set([category.slug]))}>
					{">"} See all</button>
			</div>
			{
			entries && entries.length > 0 ?
			<div className='content'>
				{entries.map((entry, i) => (
					<CommunityLibraryCard
					key={entry.id + `_${category.slug}_${i}`}
					entry={entry}
					highlightedTags={[]}
					categoryObject={getCatObject(entry.category)}
					/>
				))}
			</div>
			:
			<div className='none-found'>No widgets in this category were found.</div>
			}
		</div>
	)
}

export default CommunityLibraryCategorySection
