import React, { useState, useEffect, useRef } from 'react'
// import { queryClient } from '../media'
import { useQuery } from 'react-query'
import DragAndDrop from './drag-and-drop'
import { getAllAssets, uploadFile, loadPickedAsset } from '../util/media-importer'
import './media.scss'

const MediaImporter = () => {
	const mounted = useRef(false)
	const { data: listOfAssets, isSuccess } = useQuery('assets', getAllAssets)

	/**
	 * It returns a card component that contains the assets data.
	 * @returns A React component.
	 */
	const AssetCard = ({ name, thumb, created, type, media }) => {
		return (
			<div className="file-info" onClick={() => loadPickedAsset(media)}>
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

				<DragAndDrop parseMethod={uploadFile} idStr={'drag-wrapper'}>
					<div className="drag-text">Drag a file here to upload</div>
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
