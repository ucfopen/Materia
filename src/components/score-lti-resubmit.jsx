import React, {useState, useEffect} from 'react'
import { useQuery } from 'react-query'
import { apiPlayResubmit } from '../util/api'
import LoadingIcon from './loading-icon'

const ScoreLtiResubmit = ({ lti, playId, callback }) => {

	const [adminMode, setAdminMode] = useState(lti.adminMode ?? false)
	const [attempts, setAttempts] = useState(lti.submit_attempts)

	const MAX_SUBMISSIONS = 4
	const canResubmit = adminMode || (lti.submission_available && MAX_SUBMISSIONS - attempts > 0)

	const { data: submission, error, refetch: queryResubmit, isFetching } = useQuery({
		queryKey: ['resubmit', playId],
		queryFn: async () => {
			try {
				const data = await apiPlayResubmit(playId)
				return { success: true, status: 'SUCCESS', ...data }
			} catch (err) {
				if (err.data?.status) {
					return { success: false, status: err.data.status, httpStatus: err.status, submitted_at: err.data.submitted_at ?? null }
				}
				return { success: false, message: err.message, httpStatus: err.status }
			}
		},
		staleTime: Infinity,
		retry: false,
		enabled: false
	})

	useEffect(() => {
		if (submission) {

			// Always fire the callback if it exists and we have a status
			if (callback && submission.status) {
				callback(submission.status)
			}

			console.log(submission)
			console.log(submission.httpStatus)

			// Increment attempts if the resubmission was attempted
			// (both 200 and 403 responses mean a submission was attempted)
			if (submission.httpStatus === 403 || submission.success === true) {
				setAttempts((attempts) => attempts + 1)
			}
		}
	}, [submission, callback])

	const handleRequestResubmit = (e) => {
		e.stopPropagation()
		queryResubmit()
	}

	let resubmitContent = null
	if (isFetching) {
		resubmitContent = (
			<>
				<LoadingIcon size='sm' width='30px' position='relative' top='3px' />
				<p>Submission Processing...</p>
			</>
		)
	} else {
		let submitAvailableText = canResubmit ? 
			<p>You can retry {MAX_SUBMISSIONS - attempts} more times.</p> :
			<p>Submission retries are no longer available.</p>
		if (adminMode) submitAvailableText = <p>Select Resubmit to AGS to attempt gradebook sync for this play.</p>
		resubmitContent = (
			<>
				{ canResubmit ? (
						<button className="action_button" disabled={isFetching || !canResubmit} onClick={handleRequestResubmit}>
							{adminMode ? 'Resubmit to AGS' : 'Retry'}
						</button>
					) : null }
				{ submitAvailableText }
			</>
		)
	}

	return (
		<section className="resubmit-section">
			{ resubmitContent }
		</section>
	)
}

export default ScoreLtiResubmit