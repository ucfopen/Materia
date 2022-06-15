import React, { useState, useEffect, useRef } from 'react'
import { useQuery } from 'react-query'
import DragAndDrop from './drag-and-drop'
import { getAllAssets, uploadFile, loadPickedAsset, onCancel } from '../util/media-importer'
import './media.scss'

const SORTING_NONE = false
const SORTING_ASC = 'asc'
const SORTING_DESC = 'desc'

const sortString = (field, a, b) => a[field].toLowerCase().localeCompare(b[field].toLowerCase())
const sortNumber = (field, a, b) => a[field] - b[field]

const SORT_OPTIONS = [
	{
		sortMethod: sortString.bind(null, 'name'), // bind the field name to the sort method
		name: 'Name',
		field: 'name',
		status: SORTING_ASC,
	},
	{
		sortMethod: sortString.bind(null, 'type'), // bind the field name to the sort method
		name: 'Type',
		field: 'type',
		status: SORTING_NONE,
	},
	{
		sortMethod: sortNumber.bind(null, 'timestamp'), // bind the field name to the sort method
		name: 'Date',
		field: 'timestamp',
		status: SORTING_NONE,
	},
]

const MediaImporter = () => {
	const mounted = useRef(false)
	const [sortAssets, setSortAssets] = useState(null)
	const [sortOrder, setSortOrder] = useState(0)
	const { data: listOfAssets, isSuccess } = useQuery('assets', getAllAssets)

	const sortAssetList = (sortType) => {
		switch (sortType) {
			case SORT_OPTIONS[0].name:
				setSortOrder(0)
				break

			case SORT_OPTIONS[1].name:
				setSortOrder(1)
				break

			case SORT_OPTIONS[2].name:
				setSortOrder(2)
				break

			default:
				break
		}
	}

	const displayAssetList = (sortOptionIndex) => {
		let sortedAssets = listOfAssets.sort(SORT_OPTIONS[sortOptionIndex].sortMethod)
		let sortedAssetsList = sortedAssets.map((element, index) => {
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
		setSortAssets(sortedAssetsList)
	}

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

	const SortOption = ({ sortType }) => {
		return (
			<span
				className="sort-option"
				onClick={(ev) => {
					sortAssetList(sortType)
				}}
			>
				{sortType}
			</span>
		)
	}

	const RightPane = () => {
		return (
			<section id="right-pane">
				<div className="pane-header darker">
					Pick from you library
					<span className="close-button" onClick={onCancel} />
				</div>

				<div id="sort-bar">
					<div className="sort-options">
						<SortOption sortType={'Name'} />
						<SortOption sortType={'Date'} />
						<SortOption sortType={'Type'} />
					</div>
				</div>

				<div id="file-display">
					<div className="file-info">No files available!</div>
					{
						// for some reason this breaks while the top works.
						isSuccess === true && sortAssets
					}
				</div>
			</section>
		)
	}

	useEffect(() => {
		if (mounted.current === true) {
			displayAssetList(sortOrder)
		}
	}, [sortOrder, isSuccess])

	useEffect(() => {
		mounted.current = true

		return () => {
			mounted.current = false
		}
	}, [])

	return (
		<div className="media-importer">
			<section id="left-pane">
				<div className="pane-header">Upload a new file</div>

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
