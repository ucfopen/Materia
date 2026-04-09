import React, { useState } from 'react'
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

	const reportMutation = useReportEntry()

	const handleSubmit = () => {
		if (!reason) {
			setErrorText('Please select a reason.')
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
						disabled={reportMutation.isLoading}
					>
						{reportMutation.isLoading ? 'Submitting...' : 'Submit Report'}
					</button>
				</div>
			</div>
		</Modal>
	)
}

export default CommunityLibraryReportDialog
