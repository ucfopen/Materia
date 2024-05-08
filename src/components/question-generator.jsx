import useQuestionGeneration from "./hooks/useQuestionGeneration"
import React, { useState } from "react"

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
    const [numQuestions, setNumQuestions] = useState(1)
    const [buildOffExisting, setBuildOffExisting] = useState(false)

    const onClickGenerate = () => {
        generateQuestion.mutate({
            inst_id: instId,
            topic: topic,
            include_images: includeImages,
            num_questions: numQuestions,
            build_off_existing: buildOffExisting,
            successFunc: (qset) => {
                let created_at = new Date().toISOString()
                window.parent.Materia.Creator.onQsetHistorySelectionComplete(JSON.stringify(qset), 1, created_at)
            }
        })
    }

    const onTopicChange = (e) => {
        setTopic(e.target.value)
    }

    return (
        <div>
            <input type="text" placeholder="Enter a topic" onChange={onTopicChange}/>
            <input type="checkbox" id="include-images" name="include-images" onChange={(e) => setIncludeImages(e.target.checked)}/>
            <label htmlFor="include-images">Include images</label>
            <input type="checkbox" id="build-off-existing" name="build-off-existing" onChange={(e) => setBuildOffExisting(e.target.checked)}/>
            <label htmlFor="build-off-existing">Build off existing</label>
            <input type="number" placeholder="Enter number of questions" onChange={(e) => setNumQuestions(e.target.value)}/>
            <button onClick={onClickGenerate}>Generate Qset</button>
        </div>
    )
}

export default QsetGenerator;