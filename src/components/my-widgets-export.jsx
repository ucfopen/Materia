import React, { useEffect, useState } from 'react'
import Modal from './modal'
import './my-widgets-export.scss'

const initState = () => {
	return({
		header: "No semester selected",
		selectedSemesters: "",
		checkAll: false,
		exportOptions: ['Questions and Answers', 'Referrer URLs'],
		exportType: "Questions and Answers",
		semesterOptions: []
	})
}

const MyWidgetsExport = ({onClose, inst, scores}) => {
	const [state, setState] = useState(initState())
	const [showOptions, setShowOptions] = useState(false)

	// Initializes data
	useEffect (() => {
		let hasScores = false
		let tmpOps = ['Questions and Answers', 'Referrer URLs']

		scores.forEach((val) => {
			if (val.distribution) hasScores = true
		})

		if (scores.length === 0 || !hasScores) {
			setState({...state, exportOptions: ['Questions and Answers', 'Referrer URLs'], exportType: tmpOps[0]})
		}
		else {
			let scores_only
			if (inst.guest_access) {
				scores_only = 'All Scores'
			} else {
				scores_only = 'High Scores'
			}
			
			tmpOps = [scores_only, 'Full Event Log', 'Questions and Answers', 'Referrer URLs']
			if (
				(inst.widget.meta_data.playdata_exporters != null
					? inst.widget.meta_data.playdata_exporters.length
					: undefined) > 0
			) {
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
			let str = "" // creates: 2020 Fall, 2020 Spring
			let str_cpy = "" // creates: 2020-Fall,2020-Spring
			let _checkAll = false
			
			for (let i = 0; i < state.semesterOptions.length; i++) {
				if (state.semesterOptions[i]) {
					if (str !== "") {
						str += ", "
						str_cpy += ","
					}

					str += scores[i].year + " " + scores[i].term
					str_cpy += scores[i].year + "-" + scores[i].term
				}
			}

			if (str === "") {
				str = "No semester selected"
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

	return (
		<Modal onClose={onClose} noGutter>
			<div className="export-modal">
				<div className="top-bar">
					<div className="content">
						<span className="title">Export</span>
						<span className="semester-btn" onClick={() => {setShowOptions(!showOptions)}}>
							{ showOptions
								? "Hide"
								: "Semesters"
							}
						</span>
					</div>
					<div className="underline"></div>
				</div>
				<div className="semester-content">
					<h3>{state.header}</h3>
					<div className="score-table">
						<p id="export-scores-description">
							<span className="highlight">Export Scores{" "}</span>
							provides a means of exporting student score information in .CSV
							format, much like an excel spreadsheet. Teachers can use the scores
							to analyze, compare, and gauge class performance. In addition, teachers
							can also download a CSV containing a widget's question and answer
							set by selecting the Questions and Answers option from the drop-down
							menu. Download options may vary by widget, as some widgets
							provide specialized export options.
						</p>
						<div className="download-controls">
							<select value={state.exportType} onChange={(e) => {setState({...state, exportType: e.target.value})}} >
								{ 
									state.exportOptions.map((val, index) => <option key={index} value={val}>{val}</option>)
								}
							</select>
							<p className="download">
								<a href={`/data/export/${inst.id}?type=${state.exportType}&semesters=${state.selectedSemesters}`}
									className="action_button arrow_down_button">
									<span className="arrow-down"></span>
									Download {state.exportType}
								</a>
							</p>
							{ state.exportType === 'All Scores' || state.exportType === 'High Scores'
								? <p className="see-how">
									You don't need to export scores and import them into Canvas if you have
									embedded a widget as a graded assignment. 
									<a href="https://ucfopen.github.io/Materia-Docs/create/embedding-in-canvas.html"
										target="_blank"
										className="external">
										{" "}See how!
									</a>
								</p>
								: null
							}
						</div>
					</div>
					<p className="cancel">
						<a onClick={onClose}>
							Cancel
						</a>
					</p>
				</div>
			</div>
			<div className={`download-options ${ showOptions ? 'active' : ''}`}>
				<h4>Semesters</h4>
				<p className="export_which">Export which semesters?</p>
				<p className={`export-none ${scores.length === 0 ? 'active' : ''}`}>
					No semesters available
				</p>
				<ul>
					<li className={`${scores.length > 1 ? 'active' : ''}`}>
						<input type="checkbox"
							id="checkall"
							checked={state.checkAll}
							onChange={checkAllVals}/>
						<label htmlFor="checkall"> - Check all</label>
					</li>
					{
						scores.map((val, index) => {
							return(<li key={index}>
								<input type="checkbox"
									id={val.id}
									className="semester"
									name={val.id}
									disabled={scores.length === 1}
									checked={state.semesterOptions[index] || false} // makes sure it will never be null
									onChange={() => {semesterCheck(index)}}></input>
									<label htmlFor={val.id}>{val.year + " " + val.term}</label>
							</li>)
						})
					}
				</ul>
			</div>
		</Modal>
	)
}

export default MyWidgetsExport
