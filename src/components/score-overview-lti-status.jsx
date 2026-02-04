import React, {useState, useEffect} from 'react'
import ScoreLtiResubmit from './score-lti-resubmit'


const ScoreOverviewLtiStatus = ({ lti, single, playId }) => {

	const [status, setStatus] = useState(lti.status)

	useEffect(() => {
		if (!!lti?.status) {
			setStatus((status) => lti.status)
		}
	},[lti?.status])

	const resubmitCallback = (status) => {
		setStatus(status)
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

				ltiContentBody = (
					<>
						<h3>Submission Error</h3>
						<p>There was an error during the grade submission process.</p>
						{/* { single ? null : resubmitContent } */}
						<ScoreLtiResubmit lti={lti} playId={playId} callback={resubmitCallback} />
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