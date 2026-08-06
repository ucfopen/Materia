import React, { useState, useRef, useEffect } from 'react'
import Modal from './modal'
import { usePublishToLibrary, useTagList, useCategoryList } from './hooks/useCommunityLibrary'
import './community-library-publish-dialog.scss'

const COURSE_LEVELS = [
	{ value: '', label: 'Not specified' },
	{ value: 'introductory', label: 'Introductory' },
	{ value: 'intermediate', label: 'Intermediate' },
	{ value: 'advanced', label: 'Advanced' },
]

const CommunityLibraryPublishDialog = ({ inst, onClose, onSuccess }) => {
	const [category, setCategory] = useState('')
	const [courseLevel, setCourseLevel] = useState('')

	const [errorText, setErrorText] = useState('')
	const [errorLock, setErrorLock] = useState(false)

	const [tagList, setTagList] = useState([])
	const [newTag, setNewTag] = useState("")
	const [focusedTag, setFocusedTag] = useState(-1)

	const tagListRef = useRef(null)
	const searchRef = useRef(null)

	const publishMutation = usePublishToLibrary()

	const {data: tags, status} = useTagList(5, newTag.replaceAll("#", ""), tagList)
	const { data: categories } = useCategoryList()

	// prevent spamming bad publish calls
	useEffect(()=>{
		setTimeout(()=>setErrorLock(false), 3000)
	}, [errorLock])

	const handlePublish = () => {
		if (!category) {
			setErrorText('Please select a category.')
			setErrorLock(true)
			return
		}
		
		if (tagList.length > 10) {
			setErrorText('Widgets cannot have more than 10 tags applied.')
			setErrorLock(true)
			return
		}
		
		setErrorText('')

		publishMutation.mutate(
			{
				instId: inst.id,
				data: { category, course_level: courseLevel, tags: tagList },
				successFunc: entry => {
					onSuccess(entry)
				},
				errorFunc: (err) => {
					if(err?.data?.title === "Unknown Error")
						setErrorText("Tag names can be no longer than 50 characters.")
					else
						setErrorText(err?.data?.error || 'Failed to publish. Please try again.')

					setErrorLock(true)
				}
			}
		)
	}

	const enterTag = (tag) => {
		tag = tag.toLowerCase().trim().replaceAll(" ", "-").replaceAll("#", "")
		if(!tagList.includes(tag)) setTagList([...tagList, tag])
		setNewTag("")
		setFocusedTag(-1)

		if(searchRef.current)
			searchRef.current.focus()
	}

	const handleSearchKey = (e) => {
		if(e.key == "Enter" && newTag != "") {
			e.preventDefault()
			if(tags && tags.length > 0)
				enterTag(tags.at(focusedTag).name)
			else
				enterTag(newTag)
		}

		if(tags && tags.length > 1 && newTag != "") {
			if(e.key == "ArrowDown") {
				e.preventDefault()
				let newInd = focusedTag + 1 < tags.length ? focusedTag + 1 : -1
				setFocusedTag(newInd)
			} else if(e.key == "ArrowUp") {
				e.preventDefault()
				let newInd = focusedTag - 1 >= -1 ? focusedTag - 1 : tags.length - 1
				setFocusedTag(newInd)
			}
		}
	}
	
	useEffect(() => {
		if(!tagListRef.current) return

		const tagEls = tagListRef.current.querySelectorAll(".drop-entry")
		if(focusedTag >= 0) 
			tagEls[focusedTag].focus()
		else if(searchRef.current)
			searchRef.current.focus()
	}, [focusedTag])

	return (
		<Modal onClose={onClose}>
			<div className="publish-dialog">
				<h2>Share to Community Library</h2>
				<p className="dialog-subtitle">
					Share "<b>{inst.name}</b>" with the Materia community! Other instructors will be able to find, copy, and adapt this widget for their own courses. Your original widget will remain unchanged.
				</p>
				<label>
					Discipline <span className="required">*</span>
					<select value={category} onChange={(e) => setCategory(e.target.value)}>
						<option value="">Select a category...</option>
						{categories && categories.map((c) => (
							<option key={c.slug} value={c.slug}>
								{c.label}
							</option>
						))}
					</select>
				</label>

				<label>
					Course Level
					<select value={courseLevel} onChange={(e) => setCourseLevel(e.target.value)}>
						{COURSE_LEVELS.map((l) => (
							<option key={l.value} value={l.value}>
								{l.label}
							</option>
						))}
					</select>
				</label>

				<div className='label'>
					Tags
					<div className='input-cont'>
						{
							newTag != "" &&
							<div className='tag-dropdown' ref={tagListRef} aria-label="Tag selection menu." onKeyDown={handleSearchKey}>
							{
								!tags ? <div className='notice'>Loading...</div>
								: 
								tags.length == 0 && status == "success" ?
								<div className='notice'>Create a new tag <b>#{newTag.toLowerCase().trim().replaceAll(" ", "-").replaceAll("#", "")}</b></div>
								:
								tags.map((t,i)=>{
									return <button 
									className={`drop-entry ${i == focusedTag ? 'selected' : ''}`}
									key={`dropdown_tag_${i}`}
									tabIndex={-1}
									aria-label={`#${t.name}: used in ${t.used_count} widget${t.used_count > 1 ? "s" : ""}.`}
									onClick={()=>(enterTag(t.name))}>
										<div>#{t.name}</div>
										<div className='used-count'>{t.used_count}</div>
									</button>
								})
							}
							</div>
						}
						<input id="tag-input" maxLength={50} ref={searchRef} type='text' autoComplete='off' value={newTag} onChange={(e)=>setNewTag(e.target.value)} onKeyDown={handleSearchKey} placeholder='Press Enter to create a tag...'/>
					</div>
					
					<div className='tag-cont' aria-label='Currently applied tags:'>
						{
							tagList.length == 0 ? (
								<p className='empty'>Your tags will appear here.</p>
							) : 
							tagList.map((t, i) => (
								<button onClick={()=>{setTagList(tagList.filter((_, j)=>j!=i))}}  
								aria-label={`#${t}. Press Enter to remove.`} className='tag' key={`tag_${i}`}>
									{t}
								</button>
							))
						}
						
					</div>
				</div>

				{errorText && <p className="error-text">{errorText}</p>}
				
				<div className="dialog-actions">
					<button className="btn cancel" onClick={onClose}>
						Cancel
					</button>
					<button
						className="btn publish"
						onClick={handlePublish}
						disabled={publishMutation.isLoading || category == "" || errorLock}
					>
						{publishMutation.isLoading ? 'Sharing...' : 'Share'}
					</button>
				</div>
			</div>
		</Modal>
	)
}

export default CommunityLibraryPublishDialog
