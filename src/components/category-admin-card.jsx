import React, { useEffect, useMemo, useState } from 'react'
import './library-admin-page.scss'

const HEART_FILLED =
    'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
const HEART_OUTLINE =
    'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z'
const COPY_PATH = "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"

const CategoryAdminCard = ({category, handleUpdate, handleDelete, isCreating = false}) => {

    const [changed, setChanged] = useState(null)
    const [newColor, setNewColor] = useState(category ? category.color : "#CCCCCC")
    const [path, setPath] = useState(category ? category.banner_path : "")
    const [label, setLabel] = useState(category ? category.label : "Category Name")
    const [slug, setSlug] = useState(category ? category.slug : "")
    const [confirmDelete, setConfirmDelete] = useState(false)

    useEffect(() => {
        if(changed === null)
            setChanged(false)
        else
            setChanged(true)
    },[newColor, path, label])

    useEffect(() => {
        if(!isCreating) return

        setSlug(label.toLowerCase().trim().replaceAll(" ", "-"))
    },[label])

    const updateBody = useMemo(()=>({
        label: label,
        banner_path: path,
        color: newColor
    }), [path, label, newColor])

    const handleSave = () => {
        handleUpdate(slug, updateBody)
        setChanged(false)
    }

    const handleConfirmDelete = () => {
        if(confirmDelete)
            handleDelete(slug)
        else
            setConfirmDelete(true)
    }

    return (
        <div className={`category-entry ${isCreating ? "creating" : ""}`}>
            <div className='controls'>
                <div className='names'>
                    <h3 contentEditable suppressContentEditableWarning
                    onInput={(e)=>setLabel(e.target.innerHTML)} className='name'>
                        {category ? category.label : "Category Name"}
                    </h3>
                    {slug != "" && <span className='small'>("{slug}")</span>}
                </div>
                <div className='buttons'>
                    {(changed || isCreating) && <button type='button' onClick={handleSave} className='cat-btn save'>
                        {isCreating ? "Create" : "Save"}
                    </button>}
                    {!isCreating &&
                    <button type='button' className='cat-btn delete' onClick={handleConfirmDelete}>
                        {confirmDelete ? "Confirm?" : "Delete"}
                    </button>
                    }
                </div>
            </div>
            <details className='preview'>
                <summary>
                    <span>Preview Widget Card</span> 
                    <div className='banner-controls'>
                        <input title='Change Banner Color' aria-label='Change Banner Color' 
                        type='color' value={newColor} onChange={(e)=>setNewColor(e.target.value)}/>
                        <input title='Change Banner Image Path' aria-label='Change Banner Image Path' 
                        placeholder="Banner Image Path" type="text" className='path' value={path} onChange={(e)=>setPath(e.target.value)}></input>
                    </div>
                </summary>
                <div className={`library-card`} role='presentation'>
                    <div className='banner' style={{backgroundColor: newColor}}></div>
                    <img className='banner-img' src={path}/>

                    <div className='card-content'>
                        <div className="img-holder">
                            <img src='/static/img/default-avatar.jpg' style={{width: '92px', height: '92px', borderRadius: '8px'}}></img>
                        </div>
                        <div className="card-details">
                            <h3>Preview Widget</h3>
                            <span className="owner">by Kogneato</span>
                            <div className='row' style={{gap:"4px"}}>
                                <span className="badge level">Beginner</span>
                                <span className="badge category">{label}</span>
                            </div>
                        </div>
                    </div>
                    <hr/>
                    <div className='row meta'>
                        <div className='badges'>
                            <span className="badge">#widget</span>
                            <span className="badge">#testing</span>
                            <span className="tiny-text">+1</span>
                        </div>

                        <div className='badges'>
                            <span className="copy-count">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                    <path d={COPY_PATH} />
                                </svg>
                                26
                            </span>
                            <span
                                className={`like-btn`}
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16">
                                    <path d={HEART_OUTLINE} />
                                </svg>
                                14
                            </span>
                        </div>
                    </div>
                </div>
            </details>
        </div>
    )
}

export default CategoryAdminCard
