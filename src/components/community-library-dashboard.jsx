import React, { useState, useMemo, useCallback, useEffect, useRef, useDeferredValue } from 'react'
import { useQuery } from 'react-query'
import { apiGetUser, apiGetSiteImages, apiGetSiteMessages } from '../util/api'
import './community-library.scss'
import CommunityLibraryCard from './community-library-card'
import {
	useCommunityLibraryList,
} from './hooks/useCommunityLibrary'

import { CATEGORIES } from './community-library'

const stemCategories = ["math", "science", "engineering"]
const liberalCategories = ["history", "art", "english", "language"]
const businessCategories = ["business", "education", "hospitality"]
const healthCategories = ["medicine", "health"]

const CommunityLibraryDashboard = ({setCategories}) => {

    const [carouselShift, setCarouselShift] = useState(0)
    const [carouselDrag, setCarouselDrag] = useState(0)
    const [carouselDragging, setCarouselDragging] = useState(false)
    const [biggerFeatured, setBiggerFeatured] = useState([])

    const [lastTouchX, setLastTouchX] = useState(0)

    const { entries: featured } = useCommunityLibraryList(null, "", "", [], "", "", [], true)
    const { entries: stem } = useCommunityLibraryList(4, "", "", stemCategories, "", "", [], false)
    const { entries: liberal } = useCommunityLibraryList(4, "", "", liberalCategories, "", "", [], false)
    const { entries: business } = useCommunityLibraryList(4, "", "", businessCategories, "", "", [], false)
    const { entries: health } = useCommunityLibraryList(4, "", "", healthCategories, "", "", [], false)

    const mappedCategories = {}
	CATEGORIES.forEach((v)=>{mappedCategories[v.value] = {color: v.color, label: v.label}})

    useEffect(() => {
        setBiggerFeatured([...featured, ...featured, ...featured])
    }, [featured])
    
    // includes gap
    const featuredCardSize = 264

    const carouselContent = useRef(null)
    const shiftCarousel = useCallback((amount) => {
        if(!carouselContent.current) return

        setCarouselShift(Math.max(Math.min(carouselShift + amount, maxShift()), 0))
    }, [carouselContent.current, featured, carouselShift])

    const maxShift = useCallback(() => {
        const cardSpace = featuredCardSize * featured.length
        const width = carouselContent.current ? carouselContent.current.clientWidth : 0
        const excess = cardSpace - width
        return Math.ceil(excess / featuredCardSize)
    }, [carouselContent.current, featured])

    const maxTranslate = useCallback(() => {
        const width = carouselContent.current ? carouselContent.current.clientWidth : 0
        return (featured.length * featuredCardSize) - width
    }, [featured, carouselContent.current])

    // first in array order should be correct image to pull
    const {data: catalogImages, refetch: refetchCatalogImages } = useQuery({
        queryKey: ['catalog-images'],
        queryFn: async () => {
            const images = await apiGetSiteImages('catalog')
            return images.sort((a,b)=>b.id-a.id)
        },
        staleTime: Infinity,
        retry: false
    })

    const {data: catalogTexts} = useQuery({
        queryKey: ['catalog-texts'],
        queryFn: async () => {
            const messages = await apiGetSiteMessages(["CATALOG_TEXT"])
            return messages.sort((a,b)=>b.id-a.id)
        }
    })

    const {data: catalogHeaders} = useQuery({
        queryKey: ['catalog-headers'],
        queryFn: async () => {
            const messages = await apiGetSiteMessages(["CATALOG_HEADER"])
            return messages.sort((a,b)=>b.id-a.id)
        }
    })

    const mouseStopDrag = (e) => {
        if(carouselDragging) {
            setCarouselShift(Math.min(Math.max(carouselShift + Math.round(carouselDrag / featuredCardSize), 0), maxShift()))
            setCarouselDrag(0)
            carouselContent.current.classList.remove("dragging")

            // use timeout so a drag doesnt cause a link click
            setTimeout(()=>setCarouselDragging(false),50)
        }
    }
    
    return (
    <div className='dashboard' onMouseUp={mouseStopDrag} onMouseLeave={mouseStopDrag}>
        <div className='welcome-banner'>
            <div className='column'>
                <h2>Welcome to the Community Library!</h2>
                <a href='/my-widgets'>My Widgets</a>
            </div>
        </div>
        
        <div className='category-box featured'>
            
            <div className='row'>
                <div style={{margin: "auto"}}>
                    <h3 className='featured-header'>
                        {catalogHeaders && catalogHeaders.length > 0 ? catalogHeaders[0].message_text : "Featured Widgets"}
                    </h3>
                    {
                        catalogTexts && catalogTexts.length > 0 ? <p>{catalogTexts[0].message_text}</p>
                        :
                        <p>Explore a curated collection of widgets selected by our LS&T staff. Browse available options to find tools and resources that can enhance your course and support your teaching goals.</p>
                    }
                </div>
                { catalogImages && catalogImages.length > 0 && <img className="catalog-image" src={catalogImages[0].image_path}/>}
            </div>
            <div className='content-container'>
                <button className='carousel left' aria-label='Move carousel to the left.'
                disabled={carouselShift <= 0} onClick={()=>shiftCarousel(-1)}>{'<'}</button>
                <div id="carousel-content" className='content' ref={carouselContent}
                onMouseMove={(e) => {
                    if(e.buttons > 0) {
                        let delta = e.movementX

                        let current = Math.min(carouselShift * featuredCardSize, maxTranslate()) + carouselDrag
                        if(current >= maxTranslate() || current <= 0)
                            delta /= 4

                        setCarouselDrag(Math.min(carouselDrag - delta, maxTranslate()))
                        setCarouselDragging(true)
                        carouselContent.current.classList.add("dragging")
                    } else if(carouselDragging) {
                       
                        setCarouselDragging(false)
                    }
                }}
                onTouchStart={(e) => {
                    setLastTouchX(e.changedTouches.item(0).clientX)
                    setCarouselDragging(true)
                    carouselContent.current.classList.add("dragging")
                }}
                onTouchMove={(e) => {
                    e.preventDefault()
                    
                    let delta = e.changedTouches.item(0).clientX - lastTouchX
                    let current = Math.min(carouselShift * featuredCardSize, maxTranslate()) + carouselDrag
                    if(current >= maxTranslate() || current <= 0)
                        delta /= 4
                    setCarouselDrag(Math.min(carouselDrag - delta, maxTranslate()))
                    setLastTouchX(e.changedTouches.item(0).clientX)
                }}
                onTouchEnd={(e) => {
                    if(e.touches.length === 0 && carouselDragging) {
                        setCarouselShift(Math.min(Math.max(carouselShift + Math.round(carouselDrag / featuredCardSize), 0), maxShift()))
                        setCarouselDrag(0)
                        carouselContent.current.classList.remove("dragging")
                        setCarouselDragging(false)
                    }
                }}>
                    {featured.map((entry, i) => (
                        <div className='carousel-card'
                        onClick={(e)=>{
                            if(carouselDragging) {
                                e.preventDefault()
                                e.stopPropagation()
                            }
                        }}
                        style={{transform: `translateX(${-Math.min(carouselShift * featuredCardSize, maxTranslate()) - carouselDrag}px)`}}>
                            <CommunityLibraryCard
                                key={entry.id + `_${i}`}
                                entry={entry}
                                highlightedTags={[]}
                                color={mappedCategories[entry.category].color}
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
        <div className='category-box liberal'>
            <div className='row'>
                <h4>Arts & Humanities</h4>
                <button className='see-all' 
                aria-label='See all Arts & Humanities widgets'
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
                    color={mappedCategories[entry.category].color}
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
                    color={mappedCategories[entry.category].color}
                    />
                ))}
            </div>
            :
            <div className='none-found'>No widgets in this category were found.</div>
            }
        </div>
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
                        color={mappedCategories[entry.category].color}
                    />
                ))}
            </div>
            :
            <div className='none-found'>No widgets in this category were found.</div>
            }
        </div>
        <div className='category-box health'>
            <div className='row'>
                <h4>Healthcare</h4>
                <button className='see-all' 
                aria-label='See all Healthcare widgets'
                onClick={()=>setCategories(new Set([...healthCategories]))}>
                    {">"} See all</button>
            </div>
            {
            health && health.length > 0 ?
            <div className='content'>
                {health.map((entry, i) => (
                    <CommunityLibraryCard
                    key={entry.id + `_stem_${i}`}
                    entry={entry}
                    highlightedTags={[]}
                    color={mappedCategories[entry.category].color}
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
