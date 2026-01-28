import React, {useState} from 'react'
import { useQuery } from 'react-query'
import { apiPlayResubmit } from '../util/api'


const ScoreOverviewLtiStatus = ({ lti, single, playId }) => {

	const MAX_SUBMISSIONS = 3
	const canResubmit = lti.submission_available && MAX_SUBMISSIONS - lti.submit_attempts > 0

	const { data: result, refetch: queryResubmit, isFetching } = useQuery({
		queryKey: ['resubmit', playId],
		queryFn: () => apiPlayResubmit(playId),
		staleTime: Infinity,
		retry: false,
		enabled: false
	})

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
		switch (lti.status) {
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
					<p>You can retry {MAX_SUBMISSIONS - lti.submit_attempts} more times.</p> :
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
		<section className={`lti-status ${lti.is_legacy ? 'legacy' : ''} ${ lti.status ? lti.status : '' }`}>
			{ltiContentBody}
		</section>
	)

}

export default ScoreOverviewLtiStatus