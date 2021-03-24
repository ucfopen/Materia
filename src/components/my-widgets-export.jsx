import React, { useEffect, useState } from 'react'
import Modal from './modal'
import useClickOutside from '../util/use-click-outside'
import './my-widgets-export.scss'

const MyWidgetsExport = ({onClose, inst, scores}) => {
	const [header, setHeader] = useState("No semester selected")
	const [selectedSemesters, setSelectedSemesters] = useState("")
	const [exportOptions, setExportOptions] = useState(['Questions and Answers', 'Referrer URLs'])
	const [exportType, setExportType] = useState("Questions and Answers")
	const [showOptions, setShowOptions] = useState(false)
	const [semesterOptions, setSemesterOptions] = useState([])
	const [checkAll, setCheckAll] = useState(false)

	// Initializes data
	useEffect (() => {
		let hasScores = false
		let tmpOps = ['Questions and Answers', 'Referrer URLs']

		scores.forEach((val) => {
			if (val.distribution) hasScores = true
		})

		if (scores.length === 0 || !hasScores) {
			setExportOptions(['Questions and Answers', 'Referrer URLs'])
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
			setSemesterOptions(options)
			setExportOptions(tmpOps)
		}

		setExportType(tmpOps[0])
	}, [])
	
	// Sets all values to checked or unchecked when checkall is clicked
	useEffect(() => {
		if (semesterOptions.length > 0) {
			let arr = new Array(scores.length).fill(checkAll)
			setSemesterOptions(arr)
		}
	}, [checkAll])

	// Sets selected semesters and their respective header text
	useEffect(() => {
		if (semesterOptions.length > 0) {
			let str = ""
			let str_cpy = ""
			
			for (let i = 0; i < semesterOptions.length; i++) {
				if (semesterOptions[i]) {
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

			setHeader(str)
			setSelectedSemesters(str_cpy)
		}
	}, [semesterOptions])

	// Used on semester selection
	const semesterCheck = (index) => {
		let arr = [... semesterOptions]
		arr[index] = !arr[index]
		setSemesterOptions(arr)
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
					<h3>{header}</h3>
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
							<select value={exportType} onChange={(e) => {setExportType(e.target.value)}} >
								{ 
									exportOptions.map((val, index) => {
										return (<option key={index} value={val}>{val}</option>)
									})
								}
							</select>
							<p className="download">
								<a href={`/data/export/${inst.id}?type=${exportType}&semesters=${selectedSemesters}`}
									className="action_button arrow_down_button">
									<span className="arrow-down"></span>
									Download {exportType}
								</a>
							</p>
							{ exportType === 'All Scores' || exportType === 'High Scores'
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
							checked={checkAll}
							onChange={() => {setCheckAll(!checkAll)}}/>
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
									checked={semesterOptions[index] || false} // makes sure it will never be null
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
