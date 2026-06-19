import React, { useState, useMemo, useCallback, useEffect, useRef, useDeferredValue } from 'react'
import './community-library.scss'
import CommunityLibraryCard from './community-library-card'
import {
	useCommunityLibraryList,
} from './hooks/useCommunityLibrary'

const CATEGORIES = [
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

const stemCategories = ["math", "science", "cs", "health"]
const liberalCategories = ["music", "history", "art", "english", "language"]
const businessCategories = ["business, education"]

const CommunityLibraryDashboard = ({setCategories}) => {

    const [carouselShift, setCarouselShift] = useState(0)
    const [biggerFeatured, setBiggerFeatured] = useState([])

    const { entries: featured } = useCommunityLibraryList(null, "", "", [], "", "", [], true)
    const { entries: stem } = useCommunityLibraryList(4, "", "", stemCategories, "", "", [], false)
    const { entries: liberal } = useCommunityLibraryList(4, "", "", liberalCategories, "", "", [], false)
    const { entries: business } = useCommunityLibraryList(4, "", "", businessCategories, "", "", [], false)

    useEffect(() => {
        setBiggerFeatured([...featured, ...featured, ...featured])
    }, [featured])
    
    // includes gap
    const featuredCardSize = 264

    const carouselContent = useRef(null)
    const shiftCarousel = useCallback((amount) => {
        if(!carouselContent.current) return

        setCarouselShift(Math.max(Math.min(carouselShift + amount, maxShift()), 0))
    }, [carouselContent.current, biggerFeatured, carouselShift])

    const maxShift = useCallback(() => {
        const cardSpace = featuredCardSize * biggerFeatured.length
        const width = carouselContent.current ? carouselContent.current.clientWidth : 0
        const excess = cardSpace - width
        return Math.ceil(excess / featuredCardSize)
    }, [carouselContent.current, biggerFeatured])

    const maxTranslate = useCallback(() => {
        const width = carouselContent.current ? carouselContent.current.clientWidth : 0
        return (biggerFeatured.length * featuredCardSize) - width
    }, [biggerFeatured, carouselContent.current])
    
    return (
    <div className='dashboard'>
        <div className='welcome-banner'>
            <h2>Welcome to the Community Library!</h2>
        </div>
        <h3>Featured Widgets</h3>
        <div className='category-box featured'>
            <div className='row'>
                <div style={{width: 180, height: 150, backgroundColor: "#ccc", flexShrink: 0, borderRadius: 8}}></div>
                <p>Explore a curated collection of widgets selected by our LS&T staff. Browse available options to find tools and resources that can enhance your course and support your teaching goals.</p>
            </div>
            <div className='content-container'>
                <button className='carousel left' aria-label='Move carousel to the left.'
                disabled={carouselShift <= 0} onClick={()=>shiftCarousel(-1)}>{'<'}</button>
                <div id="carousel-content" className='content' ref={carouselContent}>
                    {biggerFeatured.map((entry, i) => (
                        <div className='carousel-card'
                        style={{transform: `translateX(-${Math.min(carouselShift * featuredCardSize, maxTranslate())}px)`}}>
                            <CommunityLibraryCard
                                key={entry.id + `_${i}`}
                                entry={entry}
                                highlightedTags={[]}
                                skinFeatured
                            />
                        </div>
                    ))}
                </div>
                <button className='carousel right'  aria-label='Move carousel to the right.'
                disabled={carouselShift >= maxShift()} onClick={()=>shiftCarousel(1)}>{'>'}</button>
            </div>
        </div>
        <h3>Community Widgets</h3>
        <div className='category-box stem'>
            <div className='row'>
                <h4>STEM</h4>
                <button className='see-all' 
                aria-label='See all STEM widgets'
                onClick={()=>setCategories(new Set([...stemCategories]))}>
                    {">"} See all</button>
            </div>
            {
            stem && stem.length > 0 ?
            <div className='content'>
                {stem.map((entry, i) => (
                    <CommunityLibraryCard
                        key={entry.id + `_stem_${i}`}
                        entry={entry}
                        highlightedTags={[]}
                    />
                ))}
            </div>
            :
            <div className='none-found'>No widgets in this category were found.</div>
            }
        </div>
        <div className='category-box business'>
            <div className='row'>
                <h4>Business & Administration</h4>
                <button className='see-all' 
                aria-label='See all Business & Administration widgets'
                onClick={()=>setCategories(new Set([...businessCategories]))}>
                    {">"} See all</button>
            </div>
            {
            business && business.length > 0 ?
            <div className='content'>
                {business.map((entry, i) => (
                    <CommunityLibraryCard
                    key={entry.id + `_stem_${i}`}
                    entry={entry}
                    highlightedTags={[]}
                    />
                ))}
            </div>
            :
            <div className='none-found'>No widgets in this category were found.</div>
            }
        </div>
        <div className='category-box liberal'>
            <div className='row'>
                <h4>Liberal Arts & Humanities</h4>
                <button className='see-all' 
                aria-label='See all Liberal Arts & Humanities widgets'
                onClick={()=>setCategories(new Set([...liberalCategories]))}>
                    {">"} See all</button>
            </div>
            {
            liberal && liberal.length > 0 ?
            <div className='content'>
                {liberal.map((entry, i) => (
                    <CommunityLibraryCard
                    key={entry.id + `_stem_${i}`}
                    entry={entry}
                    highlightedTags={[]}
                    />
                ))}
            </div>
            :
            <div className='none-found'>No widgets in this category were found.</div>
            }
        </div>
    </div>
    )
}

export default CommunityLibraryDashboard
