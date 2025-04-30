import React, { useEffect, useState } from 'react'
import Modal from './modal'
import './my-widgets-export.scss'
import {useMutation, useQuery} from "react-query";

const DEFAULT_OPTIONS = ['Questions and Answers']

const initState = () => ({
	header: 'No semester selected',
	selectedSemesters: '',
	checkAll: false,
	exportOptions: DEFAULT_OPTIONS,
	exportType: 'Questions and Answers',
	semesterOptions: []
})

const MyWidgetsExport = ({onClose, inst, scores}) => {
	const [state, setState] = useState(initState())
	const [showOptions, setShowOptions] = useState(false)

	// Initializes data
	useEffect (() => {
		let hasScores = false
		let tmpOps = DEFAULT_OPTIONS

		scores.forEach((val) => {
			if (val.distribution) hasScores = true
		})

		if (scores.length === 0 || !hasScores) {
			setState({...state, exportOptions: DEFAULT_OPTIONS, exportType: tmpOps[0], header: 'Export Options Limited, No Scores Available'})
		}
		else {
			const scores_only = inst.guest_access ? 'All Scores' : 'High Scores'

			tmpOps = [scores_only, 'Full Event Log', 'Questions and Answers', 'Referrer URLs']
			if (inst.widget.meta_data.playdata_exporters?.length > 0) {
				tmpOps = tmpOps.concat(inst.widget.meta_data.playdata_exporters)
			}

			let options = new Array(scores.length).fill(false)
			options[0] = true
			setState({...state, exportOptions: tmpOps, exportType: tmpOps[0], semesterOptions: options})
		}
	}, [])

	// Sets selected semesters and their respective header text
	useEffect(() => {
		if (state.semesterOptions.length > 0) {
			let str = '' // creates: 2020 Fall, 2020 Spring
			let str_cpy = '' // creates: 2020-Fall,2020-Spring
			let _checkAll = false

			for (let i = 0; i < state.semesterOptions.length; i++) {
				if (state.semesterOptions[i]) {
					if (str !== '') {
						str += ', '
						str_cpy += ','
					}

					str += scores[i].year + ' ' + scores[i].term
					str_cpy += scores[i].year + '-' + scores[i].term
				}
			}

			if (str === '') {
				str = 'No semester selected'
			}

			// sets check all if all options are checked/unchecked
			if (state.semesterOptions.includes(true) && !state.semesterOptions.includes(false)) {
				_checkAll = true
			}

			setState({...state, checkAll: _checkAll, header: str, selectedSemesters: str_cpy})
		}
	}, [state.semesterOptions])

	const checkAllVals = () => {
		if (state.semesterOptions.length > 0) {
			const arr = new Array(scores.length).fill(!state.checkAll)
			setState({...state, semesterOptions: arr, checkAll: !state.checkAll})
		}
	}

	// Used on semester selection
	const semesterCheck = (index) => {
		let arr = [... state.semesterOptions]
		arr[index] = !arr[index]
		setState({...state, semesterOptions: arr})
	}

	const exportOptionElements = state.exportOptions.map((val, index) => <option key={index} value={val}>{val}</option>)

	let canvasDataDisclaimer = null
	if (state.exportType === 'All Scores' || state.exportType === 'High Scores') {
		canvasDataDisclaimer = (
			<p className='see-how'>
				You don't need to export scores and import them into Canvas if you have embedded a widget as a graded assignment.
				<a href='https://ucfopen.github.io/Materia-Docs/create/embedding-in-canvas.html'
					target='_blank'
					className='external'>
					{' '}See how!
				</a>
			</p>
		)
	}

	const exportDataDownloader = useMutation({
		mutationFn: async () => {
			// Request from server
			const response = await fetch(`/api/instances/${inst.id}/export_playdata/?type=${encodeURIComponent(state.exportType)}&semesters=${state.selectedSemesters}`)

			// Handle errors
			if (!response.ok) {
				let messageJson
				try {
					messageJson = await response.json()
				} catch {
					throw new Error(response.statusText)
				}
				if (messageJson.msg && messageJson.title) {
					throw new Error(messageJson.title, {cause: messageJson.msg, halt: messageJson.halt ?? true, type: messageJson.type})
				} else {
					throw new Error(response.statusText)
				}
			}

			// Decode as blob and get file name, if present
			const blob = await response.blob()
			let fileName = "export.txt"
			if (response.headers.has('content-disposition')) {
				const matches = response.headers.get('content-disposition').match(/filename="(?<fileName>.*)"/)
				fileName = matches?.groups?.["fileName"] ?? fileName
			}

			return { blob, fileName }
		},
		onSuccess: ({ blob, fileName }) => {
			// Download blob as fileName
			const objectUrl = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.style.display = 'none'
			a.href = objectUrl
			a.download = fileName
			document.body.appendChild(a)
			a.click()
			URL.revokeObjectURL(objectUrl)
			document.body.removeChild(a)
		},
		onError: (err) => {
			console.error(err)
		}
	})

	const handleOnDownload = () => {
		exportDataDownloader.mutate()
	}

	const semesterOptionElements = scores.map((val, index) => (
		<li key={index}>
			<label className='checkbox-wrapper' htmlFor={val.id}>
				<input type='checkbox'
					id={val.id}
					className='semester'
					name={val.id}
					disabled={scores.length === 1}
					checked={state.semesterOptions[index] || false} // makes sure it will never be null
					onChange={() => {semesterCheck(index)}}></input>
				<span className='custom-checkbox'></span>
				{val.year + ' ' + val.term}
			</label>

		</li>
	))

	return (
		<Modal onClose={onClose} noGutter>
			<div className='export-modal'>
				<div className='top-bar'>
					<div className='content'>
						<span className='title'>Export</span>
						<span className='semester-btn' onClick={() => {setShowOptions(!showOptions)}}>
							{ showOptions
								? 'Hide'
								: 'Semesters'
							}
						</span>
					</div>
					<div className='underline'></div>
				</div>
				<div className='semester-content'>
					<h3>{state.header}</h3>
					<div className='score-table'>
						<p id='export-scores-description'>
							<span className='highlight'>Export Options{' '}</span>
							provide a means of exporting student performance information in .CSV format, much like an excel spreadsheet.
							Use exported data to analyze, compare, and gauge class performance.
							Additionally, export options are provided for <span className='highlight'>Question and Answer</span> data
							as well as <span className='highlight'>Referrer URLs</span> for the selected widget. <span className='highlight'>Full Event Log {' '}</span>
							is intended for advanced users performing data analysis. Note that some widgets may provide unique or specialized export options.
						</p>
						<div className='download-controls'>
							<select value={state.exportType} onChange={(e) => {setState({...state, exportType: e.target.value})}} >
								{ exportOptionElements }
							</select>
							<p className='download'>
								<button onClick={handleOnDownload} className='action_button arrow_down_button'>
									Download {state.exportType}
								</button>
							</p>
							{ canvasDataDisclaimer }
						</div>
					</div>
					<p className='cancel'>
						<a className='cancel_button' onClick={onClose}>
							Cancel
						</a>
					</p>
				</div>
			</div>
			<div className={`download-options ${ showOptions ? 'active' : ''}`}>
				<h4>Semesters</h4>
				<p className='export_which'>Export which semesters?</p>
				<p className={`export-none ${scores.length === 0 ? 'active' : ''}`}>
					No semesters available
				</p>
				<ul>
					<li className={`${scores.length > 1 ? 'active' : ''}`}>
						<label className='checkbox-wrapper' htmlFor='checkall'>
							<input type='checkbox'
								id='checkall'
								checked={state.checkAll}
								onChange={checkAllVals}/>
							<span className='custom-checkbox'></span>
							- Check all
						</label>

					</li>
					{ semesterOptionElements }
				</ul>
			</div>
		</Modal>
	)
}

export default MyWidgetsExport
