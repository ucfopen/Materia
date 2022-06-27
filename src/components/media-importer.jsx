import React, { useState, useEffect, useRef } from 'react'
import { useQuery } from 'react-query'
import DragAndDrop from './drag-and-drop'
import { getAllAssets, uploadFile, loadPickedAsset, onCancel } from '../util/media-importer'
import './media.scss'

const sortString = (field, a, b) => a[field].toLowerCase().localeCompare(b[field].toLowerCase())
const sortNumber = (field, a, b) => a[field] - b[field]

const SORT_OPTIONS = [
	{
		sortMethod: sortString.bind(null, 'name'), // bind the field name to the sort method
		name: 'Title',
		field: 'name',
	},
	{
		sortMethod: sortString.bind(null, 'type'), // bind the field name to the sort method
		name: 'Type',
		field: 'type',
	},
	{
		sortMethod: sortNumber.bind(null, 'timestamp'), // bind the field name to the sort method
		name: 'Date',
		field: 'timestamp',
	},
]

const MediaImporter = () => {
	const mounted = useRef(false)
	const [sortAssets, setSortAssets] = useState(null) // Display assets list
	const [sortState, setSortState] = useState({
		sortAsc: false, // Sorted list in asc or desc
		sortOrder: 0, // List sorting options
	})
	const [sortedList, setSortedList] = useState([])

	const [filterSearch, setFilterSearch] = useState('') // Search bar filter
	const [numOfAssets, setNumOfAssets] = useState(0) // Number of Assets fetched
	const { data: listOfAssets, isSuccess } = useQuery('assets', getAllAssets)

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

	const displayAssetList = () => {
		const assets = sortedList.length >= 1 ? sortedList : listOfAssets
		let sortedAssetsList
		if (filterSearch != '') {
			sortedAssetsList = assets
				.filter((asset) => asset.name.toLowerCase().match(filterSearch))
				.map((element, index) => {
					console.log(element)
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
		} else {
			sortedAssetsList = assets.map((element, index) => {
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

		setSortAssets(sortedAssetsList)
	}

	const SortOption = ({ sortTypeIndex }) => {
		return (
			<span
				className="sort-option"
				onClick={() => {
					setSortState({
						...sortState,
						sortAsc: !sortState.sortAsc,
						sortOrder: sortTypeIndex,
					})
				}}
			>
				{SORT_OPTIONS[sortTypeIndex].name}
			</span>
		)
	}

	const filterFiles = (ev) => {
		ev.preventDefault()
		setFilterSearch(ev.target.value)
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
						<SortOption sortTypeIndex={0} />
						<SortOption sortTypeIndex={1} />
						<SortOption sortTypeIndex={2} />
					</div>
					<div>
						<input
							type="search"
							placeholder="File Search"
							onChange={filterFiles}
							value={filterSearch}
						/>
					</div>
				</div>

				<div id="file-display">
					{isSuccess === true && numOfAssets <= 1 ? (
						<div className="file-info">No files available!</div>
					) : (
						sortAssets
					)}
				</div>
			</section>
		)
	}

	useEffect(() => {
		if (mounted.current === true) {
			displayAssetList()
		}
	}, [filterSearch])

	useEffect(() => {
		if (mounted.current === true) {
			const sortedAssets = listOfAssets.sort(SORT_OPTIONS[sortState.sortOrder].sortMethod)
			const list = sortState.sortAsc ? sortedAssets : sortedAssets.reverse()
			setSortedList(list)
			displayAssetList()
		}
	}, [sortState])

	// Jump start the displaying of assets list when loaded the first time.
	useEffect(() => {
		if (mounted.current === true) {
			setNumOfAssets(listOfAssets.length)
			displayAssetList()
		}
	}, [isSuccess])

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
