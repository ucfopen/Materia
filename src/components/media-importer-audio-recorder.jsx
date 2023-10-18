import React, { useEffect, useState, useRef } from 'react'

const MediaImporterAudioRecorder = ({uploadFromAudioRecorder}) => {

	const [unsupported, setUnsupported] = useState(false)
	const [recorder, setRecorder] = useState(null)
	const [recordingStatus, setRecordingStatus] = useState('inactive')
	const [recordingDuration, setRecordingDuration] = useState(0)
	const [clip, setClip] = useState(null)
	const [audioBlob, setAudioBlob] = useState(null)
	const [warningMessage, setWarningMessage] = useState('')
	const chunks = useRef(false)
	const nameInputRef = useRef(false)

	useEffect(() => {
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			navigator.mediaDevices.getUserMedia({ audio: true })
			.then((stream) => {
				const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm; codecs=opus', audioBitsPerSecond: 128000, videoBitsPerSecond: 0 })
				setRecorder(mediaRecorder)
				chunks.current = []
			})
			.catch((error) => {
				setUnsupported(true)
				console.warn(`error with enabling audio recording: ${error}`)
			})
		} else {
			setUnsupported(true)
		}
	},[])

	useEffect(() => {

		const onDataAvailable = (event) => {
			chunks.current.push(event.data)
		}

		const onRecorderStop = (event) => {
			const blob = new Blob(chunks.current, { type: 'audio/webm; codecs="opus"' })
			chunks.current = []

			const clipUrl = window.URL.createObjectURL(blob)
			setClip(clipUrl)
			setAudioBlob(blob)
		}

		if (recorder) {
			recorder.addEventListener('dataavailable', onDataAvailable)
			recorder.addEventListener('stop', onRecorderStop)

			return () => {
				recorder.removeEventListener('dataavailable', onDataAvailable)
				recorder.removeEventListener('stop', onRecorderStop)
			}
		}

	}, [recorder])

	useEffect(() => {
		let interval = null
		if (recordingStatus === 'recording') {
			interval = setInterval(() => {
				setRecordingDuration(prevDuration => prevDuration + 1)
			}, 1000)
		} else if (recordingStatus === 'inactive') {
			setRecordingDuration(0)
		}
		return () => clearInterval(interval)
	}, [recordingStatus])

	const recordingStart = () => {
		if (!recorder) return false
		chunks.current = []
		setRecordingStatus('recording')
		setClip(null)
		setAudioBlob(null)
		setWarningMessage('')
		recorder.start()
	}

	const recordingStop = () => {
		if (!recorder) return false
		setRecordingStatus('inactive')
		recorder.stop()
	}

	const saveAndUploadAudio = () => {

		if (!audioBlob && recordingStatus == 'inactive') {
			setWarningMessage('You need to record something first!')
			return false
		}
		else if (recordingStatus == 'recording') {
			setWarningMessage('Finish recording!')
			return false
		}

		const filename = nameInputRef.current.value.length > 0 ? `${nameInputRef.current.value}.webm` : 'my-audio-file.webm'
		const file = new File([audioBlob], filename, { type: 'audio/webm; codecs=opus' })
		uploadFromAudioRecorder(file)
	}

	const renderRecorderControls = (status) => {
		switch (status) {
			case 'inactive':
				return <button className='control record' onClick={recordingStart}></button>
			case 'recording':
				return <button className='control stop' onClick={recordingStop}></button>
			default:
				return <span>Recorder not yet initialized</span>
		}
	}

	const formatRecordingDuration = (recordingDuration) => {
		const minutes = Math.floor(recordingDuration / 60).toString().padStart(2, '0')
		const seconds = Math.floor(recordingDuration % 60).toString().padStart(2, '0')
		return `${minutes}:${seconds}`
	}

	let renderRecordinginProgress = (
		<>
			<div className={`wave-animation ${recordingStatus == 'recording' ? 'show' : ''}`}>
				<div className='wave'></div>
				<div className='wave'></div>
				<div className='wave'></div>
				<div className='wave'></div>
				<div className='wave'></div>
				<div className='wave'></div>
				<div className='wave'></div>
			</div>
			<div className={`recording-duration ${recordingStatus == 'recording' ? 'show' : ''}`}>
				{ formatRecordingDuration(recordingDuration) }
			</div>
		</>
	)

	let renderClipPlayback = null
	if (clip) {
		renderClipPlayback = (
			<>
				<label>Listen to your recording:</label>
				<audio controls src={clip}></audio>
			</>
		)
	}

	let controlsRender = null
	if (!unsupported) {
		controlsRender = (
			<div className='controls'>{ renderRecorderControls(recordingStatus) }</div>
		)
	} else {
		controlsRender = (
			<div className='controls unsupported'>
				<p>Unfortunately, audio recording is not enabled for your browser, or the recorder ran into an error.</p>
			</div>
		)
	}

	return (
		<section className='audio-recorder'>
			<div className='recorder-controls'>
				{ controlsRender }
			</div>
			<div className='audio-playback'>
				{ renderRecordinginProgress }
				{ renderClipPlayback }
			</div>
			<div className='recorder-options'>
				<label>Name your recording: </label>
				<input type='text' ref={nameInputRef} placeholder='my-audio-recording'></input>
			</div>
			<button className='action_button' onClick={saveAndUploadAudio}>Save and Use Audio</button>
			{ warningMessage }
		</section>
	)

}

export default MediaImporterAudioRecorder