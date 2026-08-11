import React, { useState, useEffect } from 'react'
import Modal from './modal'
import { useReportEntry } from './hooks/useCommunityLibrary'

const REASONS = [
	{ value: 'inappropriate', label: 'Inappropriate content' },
	{ value: 'incorrect', label: 'Incorrect content' },
	{ value: 'spam', label: 'Spam' },
	{ value: 'other', label: 'Other' },
]

const CommunityLibraryReportDialog = ({ entry, onClose, onSuccess }) => {
	const [reason, setReason] = useState('')
	const [details, setDetails] = useState('')
	const [errorText, setErrorText] = useState('')
	const [errorLock, setErrorLock] = useState(false)

	const reportMutation = useReportEntry()

	useEffect(()=>{
		setTimeout(()=>setErrorLock(false), 3000)
	}, [errorLock])

	const handleSubmit = () => {
		if (!reason) {
			setErrorText('Please select a reason.')
			setErrorLock(true)
			return
		}

		setErrorText('')

		reportMutation.mutate(
			{
				entryId: entry.id,
				data: { reason, details },
			},
			{
				onSuccess: () => {
					if (onSuccess) onSuccess()
				},
				onError: (err) => {
					setErrorText(err?.data?.error || 'Failed to submit report. Please try again.')
					setErrorLock(true)
				},
			},
		)
	}

	return (
		<Modal onClose={onClose}>
			<div className="report-dialog">
				<h2>Report Widget</h2>
				<p className="dialog-subtitle">
					Report "<b>{entry.instance_name}</b>" for review.
				</p>

				<div className="reason-options">
					<label style={{marginBottom: 4}}>Reason</label>
					{REASONS.map((r) => (
						<label key={r.value} className="reason-option">
							<input
								type="radio"
								name="reason"
								value={r.value}
								checked={reason === r.value}
								onChange={() => setReason(r.value)}
							/>
							{r.label}
						</label>
					))}
				</div>

				<label>
					Additional details (optional)
					<textarea
						value={details}
						onChange={(e) => setDetails(e.target.value)}
						placeholder="Provide more context about the issue..."
						rows={3}
					/>
				</label>

				{errorText && <p className="error-text">{errorText}</p>}

				<div className="dialog-actions">
					<button className="btn cancel" onClick={onClose}>
						Cancel
					</button>
					<button
						className="btn report-submit"
						onClick={handleSubmit}
						disabled={reportMutation.isLoading ?? errorLock}
					>
						{reportMutation.isLoading ? 'Submitting...' : 'Submit Report'}
					</button>
				</div>
			</div>
		</Modal>
	)
}

export default CommunityLibraryReportDialog
