import React, { useState } from 'react'
import Modal from './modal'
import { usePublishToLibrary } from './hooks/useCommunityLibrary'
import './community-library-publish-dialog.scss'

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

	const publishMutation = usePublishToLibrary()

	const handlePublish = () => {
		if (!category) {
			setErrorText('Please select a category.')
			return
		}

		setErrorText('')

		publishMutation.mutate(
			{
				instId: inst.id,
				data: { category, course_level: courseLevel },
			},
			{
				onSuccess: () => {
					if (onSuccess) onSuccess()
				},
				onError: (err) => {
					setErrorText(err?.data?.error || 'Failed to publish. Please try again.')
				},
			},
		)
	}

	return (
		<Modal onClose={onClose}>
			<div className="publish-dialog">
				<h2>Share to Community Library</h2>
				<p className="dialog-subtitle">
					Share "<b>{inst.name}</b>" so other teachers can discover and use it.
				</p>

				<label>
					Category <span className="required">*</span>
					<select value={category} onChange={(e) => setCategory(e.target.value)}>
						<option value="">Select a category...</option>
						{CATEGORIES.map((c) => (
							<option key={c.value} value={c.value}>
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

				{errorText && <p className="error-text">{errorText}</p>}

				<div className="dialog-actions">
					<button className="btn cancel" onClick={onClose}>
						Cancel
					</button>
					<button
						className="btn publish"
						onClick={handlePublish}
						disabled={publishMutation.isLoading}
					>
						{publishMutation.isLoading ? 'Publishing...' : 'Publish'}
					</button>
				</div>
			</div>
		</Modal>
	)
}

export default CommunityLibraryPublishDialog
