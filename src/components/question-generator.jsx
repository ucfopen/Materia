import useQuestionGeneration from "./hooks/useQuestionGeneration"
import React, { useState } from "react"
import './question-generator.scss'
import LoadingIcon from './loading-icon'

const getInstId = () => {
	const l = document.location.href
	const id = l.substring(l.lastIndexOf('=') + 1)
	return id
}

const QsetGenerator = () => {
	const generateQuestion = useQuestionGeneration()

	const [instId, setInstId] = useState(getInstId())
    const [topic, setTopic] = useState('')
    const [includeImages, setIncludeImages] = useState(false)
    const [numQuestions, setNumQuestions] = useState(8)
    const [buildOffExisting, setBuildOffExisting] = useState(false)

    const [topicError, setTopicError] = useState('')
    const [numberError, setNumberError] = useState('')
    const [warning, setWarning] = useState('')
    const [loading, setLoading] = useState(false)
    const [serverError, setServerError] = useState('')

    const onClickGenerate = () => {
        if (loading) return

        let is_valid = validateTopic()
        let is_valid_num = validateNumQuestions()
        if (!is_valid || !is_valid_num) return

        setLoading(true)

        generateQuestion.mutate({
            inst_id: instId,
            topic: topic,
            include_images: includeImages,
            num_questions: numQuestions,
            build_off_existing: buildOffExisting,
            successFunc: (result) => {
                let created_at = new Date().toISOString()
                window.parent.Materia.Creator.onQsetReselectionComplete(
                    JSON.stringify(result.qset),
                    true,  // is generated
                    result.version,
                    created_at
                )
                setLoading(false)
            },
            errorFunc: (err) => {
                console.error(err)
                setServerError('Error generating questions. Please try again.')
                setLoading(false)
            }
        })
    }

	const closeDialog = () => window.parent.Materia.Creator.onQsetReselectionComplete(null)

    const validateTopic = () => {
        let words_in_topic = topic.split(' ')

        if (words_in_topic.length < 3) {
            document.getElementById('topic').classList.add('invalid')
            setTopicError('Please enter a topic with at least 3 words')
            return false
        }
        else {
            document.getElementById('topic').classList.remove('invalid')
            setTopicError('')
            return true
        }
    }

    const validateNumQuestions = () => {
        if (numQuestions < 1) {
            document.getElementById('num-questions').classList.add('invalid')
            setNumberError('Please enter a number greater than 0')
            return false
        } else if (numQuestions > 8) {
            document.getElementById('num-questions').classList.add('warning')
            setWarning('Note: Generating this many questions may not work, or will take a while.')
            return true
        } else {
            document.getElementById('num-questions').classList.remove('invalid')
            document.getElementById('num-questions').classList.remove('warning')
            setNumberError('')
            setWarning('')
            return true
        }
    }

    const onTopicChange = (e) => {
        setTopic(e.target.value)
        validateTopic()
    }

    const onNumberChange = (e) => {
        setNumQuestions(e.target.value)
        validateNumQuestions()
    }

    return (
        <div>
            <h1>Generate Questions (Beta Feature)</h1>
            {loading && <div className="loading">
                <LoadingIcon/>
                <p>Generating questions. Do not close this window.</p>
            </div>}
            <div id="generate_form">
                <span><strong>This question generator is powered by AI, so errors in the generated content can occur</strong>. There will be an option after generation is complete to keep or revert all changes.</span>
                <span className="error">{serverError}</span>
                <div id="topic-field">
                    <label htmlFor="topic">Topic</label>
                    <span className="error">{topicError}</span>
                    <input type="text" id="topic" placeholder="Enter a topic with more than three words" onChange={onTopicChange}/>
                </div>
                <div id="num-questions-field">
                    <label htmlFor="num-questions">Number of questions to generate</label>
                    <span className="error">{numberError}</span>
                    <input id="num-questions" type="number" defaultValue="8" min="1" placeholder="Number to generate" onChange={onNumberChange}/>
                </div>
                <div>
                    <input type="checkbox" id="include-images" name="include-images" onChange={(e) => setIncludeImages(e.target.checked)}/>
                    <label htmlFor="include-images">Include images</label>
                </div>
                <div>
                    <input type="checkbox" id="build-off-existing" name="build-off-existing" onChange={(e) => setBuildOffExisting(e.target.checked)}/>
                    <label htmlFor="build-off-existing">Keep current questions <span className="warning">(If left unselected, this will replace all existing questions)</span></label>
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