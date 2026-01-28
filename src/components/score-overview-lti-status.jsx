import React, {useState, useEffect} from 'react'
import { useQuery } from 'react-query'
import { apiPlayResubmit } from '../util/api'


const ScoreOverviewLtiStatus = ({ lti, single, playId }) => {

	const [status, setStatus] = useState(lti.status)
	const [attempts, setAttempts] = useState(lti.submit_attempts)

	const MAX_SUBMISSIONS = 3
	const canResubmit = lti.submission_available && MAX_SUBMISSIONS - attempts > 0

	const { data: result, error, refetch: queryResubmit, isFetching } = useQuery({
		queryKey: ['resubmit', playId],
		queryFn: async () => {
			try {
				const data = await apiPlayResubmit(playId)
				return { success: true, status: 'SUCCESS', ...data }
			} catch (err) {
				if (err.data?.status) {
					return { success: false, status: err.data.status, httpStatus: err.status }
				}
				return { success: false, message: err.message, httpStatus: err.status }
			}
		},
		staleTime: Infinity,
		retry: false,
		enabled: false
	})

	useEffect(() => {
		if (!!lti?.status) {
			setStatus((status) => lti.status)
			setAttempts((attempts) => lti.submit_attempts)
		}
	},[lti?.status])

	useEffect(() => {
		if (result) {

			if (result.status) {
				setStatus(result.status)
			}

			// Increment attempts if the resubmission was attempted
			// (both 200 and 403 responses mean a submission was attempted)
			if (result.httpStatus === 403 || result.success === true) {
				setAttempts((attempts) => attempts + 1)
			}
		}
	}, [result])

	const handleRequestResubmit = (e) => {
		if (canResubmit) queryResubmit()
	}

	let ltiContentBody = null
	if (lti.is_legacy) {
		ltiContentBody = (
			<>
				<h3>No Grade Submission Status</h3>
				<p>The grade status of historical play records is not available.</p>
			</>
		)
	}
	else {
		const article = single ? 'The' : 'Your'
		console.log('rendering status based on value: ' + status)
		switch (status) {
			case 'SUCCESS':
				ltiContentBody = (
					<>
						<h3>Grade Submitted</h3>
						<p>{article} score was successfully synced with the gradebook.</p>
					</>
				)
				break
			case 'AGS_NOT_INCLUDED':
			case 'NOT_GRADED':
				ltiContentBody = (
					<>
						<h3>No Grade Submission</h3>
						<p>The LMS indicated this play session was not graded.</p>
					</>
				)
				break
			case 'ERR_NO_ATTEMPTS':
				ltiContentBody = (
					<>
						<h3>Attempt Limit Reached</h3>
						<p>{article} grade was not submitted because the submission limit was reached for the assignment.</p>
					</>
				)
				break
			case 'ERR_FAILURE':
				let resubmitContent = null
				const submitAvailableText = canResubmit ? 
					<p>You can retry {MAX_SUBMISSIONS - attempts} more times.</p> :
					<p>Submission retries are no longer available.</p>
				resubmitContent = (
					<div className="resubmit-section">
						{ canResubmit ? <button className="action_button" disabled={isFetching || !canResubmit} onClick={handleRequestResubmit}>Retry</button> : null }
						{ submitAvailableText }
					</div>
				)

				ltiContentBody = (
					<>
						<h3>Submission Error</h3>
						<p>There was an error during the grade submission process.</p>
						{ single ? null : resubmitContent }
					</>
				)
				break
			default:
				ltiContentBody = (
					<>
						<h3>Not Submitted</h3>
						<p>Well that's weird. How did you manage to do that?</p>
					</>
				)
		}
	}

	return (
		<section className={`lti-status ${lti.is_legacy ? 'legacy' : ''} ${ status ? status : '' }`}>
			{ltiContentBody}
		</section>
	)

}

export default ScoreOverviewLtiStatus