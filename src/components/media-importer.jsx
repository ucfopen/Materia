import React, { useState, useEffect, useRef } from 'react'
// import { queryClient } from '../media'
import { useQuery } from 'react-query'
import { getAllAssets, uploadFile } from '../util/media-importer'

import LoadingIcon from './loading-icon'
import './media.scss'

const DragAndDrop = ({ children }) => {
	const mount = useRef(false)
	const [state, setState] = useState(null)

	const handleDragEvent = (ev) => {
		ev.preventDefault()
		ev.stopPropagation()
	}

	const handleOnChange = (ev) => {
		ev.preventDefault()
		ev.stopPropagation()

		setState(ev)
		uploadFile(ev)
	}

	useEffect(() => {
		if (mount.current) {
			console.log(state)
			// uploadFile(state)
		}
	}, [state])

	useEffect(() => {
		mount.current = true
		// document.addEventListener('dragenter', handleDragEvent)
		// document.addEventListener('dragleave', handleDragEvent)
		// document.addEventListener('drag', handleDragEvent)
		// document.addEventListener('change', handleOnChange)
		return () => {
			mount.current = false
			// document.removeEventListener('dragenter', handleDragEvent)
			// document.removeEventListener('dragleave', handleDragEvent)
			// document.removeEventListener('drag', handleDragEvent)
			// document.removeEventListener('change', handleOnChange)
		}
	}, [])

	return (
		<div
			id="drag-and-drop"
			onDragEnter={(ev) => {
				handleDragEvent(ev)
			}}
			onDragEnd={(ev) => {
				handleDragEvent(ev)
			}}
			onDrag={(ev) => {
				handleDragEvent(ev)
			}}
			onChange={(ev) => {
				handleOnChange(ev)
			}}
		>
			{children}
		</div>
	)
}

const MediaImporter = () => {
	const mounted = useRef(false)
	const [selectedFile, setSelectedFile] = useState('wait')
	const [sortOrder, setSortOrder] = useState(false)
	const { data: listOfAssets, isSuccess } = useQuery('assets', getAllAssets)

	const onBrowseClick = (ev) => {
		console.log(ev)
		setSelectedFile(ev)
	}

	const sendMediaToCreator = (media) => {
		return window.Materia.onMediaImportComplete([media])
	}

	/**
	 * It returns a card component that contains the assets data.
	 * @returns A React component.
	 */
	const AssetCard = ({ name, thumb, created, type, media }) => {
		return (
			<div className="file-info" onClick={() => sendMediaToCreator([media])}>
				<span className="file-thumbnail">
					<img src={thumb} alt={name} />
				</span>
				<span className="file-name">
					<strong>{name}</strong>
					{type}
				</span>
				<span className="file-date">{created}</span>
			</div>
		)
	}

	const RightPane = () => {
		return (
			<section id="right-pane">
				<div className="pane-header darker">
					Pick from you library
					<span className="close-button">{/* cancel option */}</span>
				</div>

				<div id="sort-bar">
					<div className="sort-options">
						<div className="sort-option">
							{/* sort assets in asc or desc */}

							{/* option.name */}
						</div>
					</div>
				</div>

				<div id="file-display">
					<div className="file-info">No files available!</div>
					{
						// for some reason this breaks while the top works.
						isSuccess === true &&
							listOfAssets.map((element, index) => {
								return (
									<AssetCard
										key={index}
										name={element.name}
										type={element.type}
										thumb={element.thumb}
										created={element.created_at}
										media={element}
									/>
								)
							})
					}
				</div>
			</section>
		)
	}

	useEffect(() => {
		mounted.current = true

		return () => {
			mounted.current = false
		}
	}, [])

	return (
		<div className="media-importer">
			<section id="left-pane">
				<div className="plane-header">Upload a new file</div>

				<DragAndDrop>
					<div id="drag-wrapper">
						<div className="drag-text">Drag a file here to upload</div>
					</div>
				</DragAndDrop>
				<div className="drag-footer">
					<label>
						<input type="file" onChange={(ev) => uploadFile(ev)} />
						<span className="action_button select_file_button">Browse...</span>
					</label>
				</div>
			</section>

			<RightPane />
		</div>
	)
}

export default MediaImporter
