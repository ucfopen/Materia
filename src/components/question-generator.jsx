import useQuestionGeneration from "./hooks/useQuestionGeneration"
import React, { useState, useEffect, useRef } from "react"
import './question-generator.scss'
import LoadingIcon from './loading-icon'

const getInstId = () => {
	const urlParams = new URLSearchParams(window.location.search);
	const instId = urlParams.get('inst_id');
	return instId == 'undefined' ? null : instId;
}

const getWidgetId = () => {
	const urlParams = new URLSearchParams(window.location.search);
	const widgetId = urlParams.get('widget_id');
	return widgetId ? widgetId : null;
}

const QsetGenerator = () => {
	const generateQuestion = useQuestionGeneration()

	const [instId, setInstId] = useState(getInstId())
	const [widgetId, setWidgetId] = useState(getWidgetId())
	const [topic, setTopic] = useState('')
	const [includeImages, setIncludeImages] = useState(false)
	const [numQuestions, setNumQuestions] = useState(8)
	const [buildOffExisting, setBuildOffExisting] = useState(false)

	const [topicError, setTopicError] = useState('')
	const [numberError, setNumberError] = useState('')
	const [warning, setWarning] = useState('')
	const [serverError, setServerError] = useState('')

	const loading = useRef(false)

	useEffect(() => {
		if (numQuestions < 1) setNumberError('Please enter a number greater than 0')
		else if (numQuestions > 16) setWarning('Note: Generating this many questions will take a while and may not work at all.')
		else {
			setNumberError('')
			setWarning('')
		}
	},[numQuestions])

	const onClickGenerate = () => {

		// validation functions required since this is an event handler
		if (loading.current || ! validateNumQuestions() || ! validateTopic()) return false

		loading.current = true

		generateQuestion.mutate({
			instId,
			widgetId,
			topic,
			includeImages,
			numQuestions,
			buildOffExisting,
			successFunc: (result) => {
				window.parent.Materia.Creator.onQsetReselectionComplete(
					JSON.stringify(result.qset),
					true,  // is generated
					result.version,
					result.title
				)
				loading.current = false
			},
			errorFunc: (err) => {
				console.error(err)
				setServerError('Error generating questions. Please try again.')
				loading.current = false
			}
		})
	}

	const closeDialog = () => window.parent.Materia.Creator.onQsetReselectionComplete(null)

	const validateTopic = () => {
		if (!topic.length) {
			setTopicError('Don\'t forget to add a topic!')
			return false
		} else {
			setTopicError('')
			return true
		}
	}

	const validateNumQuestions = () => {
		return numQuestions > 0
	}

	const onTopicChange = (e) => {
		if (e.target.value.length > 0) {
			setTopic(e.target.value)
			setTopicError('')
		}
		else setTopicError('Don\'t forget to add a topic!')
	}

	const onNumberChange = (e) => {
		setNumQuestions(parseInt(e.target.value))
	}

	return (
		<div>
			<h1>Generate Questions</h1>
			{loading.current && <div className="loading">
				<LoadingIcon/>
				<p>Generating questions. Do not close this window.</p>
			</div>}
			<div id="generate_form">
				<span><strong>Question Generation is powered by AI, so errors in the generated content can occur</strong>. After generation is complete you will be prompted to keep the content or discard it. <strong>You may need
				to make edits to the generated content before saving your widget.</strong></span>
				<span>Note that this feature will only create text content. Image or media generation is not supported.</span>
				<span className="error">{serverError}</span>
				<div id="topic-field">
					<span className="error">{topicError}</span>
					<input type="text" id="topic" className={`${topicError ? 'invalid' : ''}`} placeholder="Enter the topic for your generated widget content" onChange={onTopicChange}/>
					<span className="description">
						The topic should be brief, concise, and describe the desired content of the widget. You may need to
						experiment with specificity to achieve desired results.
					</span>
				</div>
				<div id="num-questions-field">
					<label htmlFor="num-questions">Number of questions to generate</label>
					<span className="error">{numberError}</span>
					<input id="num-questions" className={`${numberError ? 'invalid' : ''}${warning ? 'warning' : ''}`} type="number" defaultValue="8" min="1" placeholder="Number to generate" onChange={onNumberChange}/>
				</div>
				{/* <div>
					<input type="checkbox" id="include-images" name="include-images" onChange={(e) => setIncludeImages(e.target.checked)}/>
					<label htmlFor="include-images">Include images</label>
				</div> */}
				<div id="build-off-existing-field">
					<label htmlFor="build-off-existing">Keep current questions</label>
					<input type="checkbox" id="build-off-existing" name="build-off-existing" onChange={(e) => setBuildOffExisting(e.target.checked)}/>
					<span className="description">
						If selected, generated content will be appended to existing content. If unselected, generated content will replace existing content.
					</span>
				</div>
				<span className="warning">{warning}</span>
				<button className="action_button" onClick={onClickGenerate}>Generate Questions</button>
			</div>
			<div className="actions">
				<a id="cancel-button" href="#" onClick={closeDialog}>Cancel</a>
			</div>
		</div>
	)
}

export default QsetGenerator;
