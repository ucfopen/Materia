import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import DragAndDrop from './drag-and-drop'
import { apiDeleteAsset, apiGetAssets, apiRestoreAsset } from '../util/api'
import './media.scss'
import { Base64 } from 'js-base64'

const sortString = (field, a, b) => a[field].toLowerCase().localeCompare(b[field].toLowerCase())
const sortNumber = (field, a, b) => a[field] - b[field]

const REQUESTED_FILE_TYPES = window.location.hash.substring(1).split(',')

// Approx 20 MB
const FILE_MAX_SIZE = 20000000

// generic media type definitions and substitutions for compatibility
const MIME_MAP = {
	// generic types, preferred
	image: ['image/jpg', 'image/jpeg', 'image/gif', 'image/png'],
	audio: ['audio/mp3', 'audio/mpeg', 'audio/mpeg3', 'audio/mp4', 'audio/wave', 'audio/wav', 'audio/x-wav'],
	video: [], // placeholder
	model: ['model/obj'],

	// incompatibility prevention, not preferred
	jpg: ['image/jpg'],
	jpeg: ['image/jpeg'],
	gif: ['image/gif'],
	png: ['image/png'],
	mp3: ['audio/mp3', 'audio/mpeg', 'audio/mpeg3'],
	m4a: ['audio/mp4'],
	wav: ['audio/wave', 'audio/wav', 'audio/x-wav'],
	obj: ['application/octet-stream', 'model/obj'],
}

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
	const queryClient = useQueryClient()
	const [selectedAsset, setSelectedAsset] = useState(null)
	const [sortAssets, setSortAssets] = useState(null) // Display assets list
	const [sortState, setSortState] = useState({
		sortAsc: false, // Sorted list in asc or desc
		sortOrder: 0, // List sorting options
	})
	const [assetList, setAssetList] = useState({})
	const [showDeletedAssets, setShowDeletedAssets] = useState(false)
	const [filterSearch, setFilterSearch] = useState('') // Search bar filter

	const { data: listOfAssets } = useQuery({
		queryKey: ['media-assets', selectedAsset],
		queryFn: () => apiGetAssets(),
		staleTime: Infinity,
		onSettled: (data) => {
			if (!data || data.type == 'error') console.error(`Asset request failed with error: ${data.msg}`)
			else {
				const list = data.map(asset => {
	
					const creationDate = new Date(asset.created_at * 1000)
					return {
						id: asset.id,
						type: asset.type,
						name: asset.title.split('.').shift(),
						timestamp: asset.created_at,
						thumb: _thumbnailUrl(asset.id, asset.type),
						created: [creationDate.getMonth(), creationDate.getDate(), creationDate.getFullYear()].join('/'),
						is_deleted: parseInt(asset.is_deleted)
					}
				})

				list.forEach((asset) => {
					if (asset.id == selectedAsset) _loadPickedAsset(asset)
				})

				setAssetList(list)
			}
		}
	})

	/****** hooks ******/

	// Asset list, sorting, search filter, or show delete flag is updated
	// Processes the list sequentially based on the state of each
	useEffect(() => {
		if (!assetList || !assetList.length) return

		const allowed = _getAllowedFileTypes().map((type) => type.split('/')[1])
		
		// first pass: filter out by allowed media types as well as deleted assets, if we're not displaying them
		let listStageOne = assetList.filter((asset) => ((!showDeletedAssets && !asset.is_deleted) || showDeletedAssets) && allowed.indexOf(asset.type) != -1)

		// second pass: filter assets based on search string, if present
		let listStageTwo = filterSearch.length ? listStageOne.filter((asset) => asset.name.toLowerCase().match( filterSearch.toLowerCase() )) : listStageOne
		
		// third and final pass: sort assets based on the currently selected sort method and direction
		let listStageThree = sortState.sortAsc ?
			listStageTwo.sort(SORT_OPTIONS[sortState.sortOrder].sortMethod) :
			listStageTwo.sort(SORT_OPTIONS[sortState.sortOrder].sortMethod).reverse()

		setSortAssets(
			listStageThree.map((asset, index) => {
				return (<AssetCard
					name={asset.name}
					thumb={asset.thumb}
					created={asset.created_at}
					type={asset.type}
					asset={asset}
					is_deleted={asset.is_deleted}
					key={index}
				/>)
			})
		)

	}, [assetList, showDeletedAssets, filterSearch, sortState])

	/****** internal helper functions ******/

	const _thumbnailUrl = (data, type) => {
		switch (type) {
			case 'jpg': // intentional case fall-through
			case 'jpeg': // intentional case fall-through
			case 'png': // intentional case fall-through
			case 'gif': // intentional case fall-through
				return `${MEDIA_URL}/${data}/thumbnail`
	
			case 'mp3': // intentional case fall-through
			case 'wav': // intentional case fall-through
			case 'ogg': // intentional case fall-through
				return '/img/audio.png'
		}
	}

	const _loadPickedAsset = (asset) => {
		window.parent.Materia.Creator.onMediaImportComplete([asset])
	}

	const _updateDeleteStatus = (asset) => {
		if (!asset.is_deleted) {
			asset.is_deleted = 1
			apiDeleteAsset(asset.id)
		} else {
			asset.is_deleted = 0
			apiRestoreAsset(asset.id)
		}

		let list = assetList.map((item) => {
			if (item.id == asset.id) item.is_deleted = asset.is_deleted
			return item
		})

		setAssetList(list)
	}

	const _uploadFile = (e) => {
		const file = (e.target.files && e.target.files[0]) || (e.dataTransfer.files && e.dataTransfer.files[0])
		if (file) _getFileData(file, _upload)
	}

	const _upload = (fileData) => {
		const fd = new FormData()
		fd.append('name', fileData.name)
		fd.append('Content-Type', fileData.type)
		fd.append('file', _dataURItoBlob(fileData.src, fileData.type), fileData.name)

		const request = new XMLHttpRequest()

		request.onload = (oEvent) => {
			const res = JSON.parse(request.response) //parse response string
			if (res.error) {
				alert(`Error code ${res.error.code}: ${res.error.message}`)
				_onCancel()
				return
			}
			setSelectedAsset(res.id)
		}
		request.open('POST', MEDIA_UPLOAD_URL)
		request.send(fd)
	}

	const _getAllowedFileTypes = () => {
		let allowedFileExtensions = []
		REQUESTED_FILE_TYPES.forEach((type) => {
			if (MIME_MAP[type]) {
				allowedFileExtensions = [...allowedFileExtensions, ...MIME_MAP[type]]
			}
		})
		return allowedFileExtensions
	}

	const _getMimeType = (dataUrl) => {
		const allowed = _getAllowedFileTypes()
		const mime = dataUrl.split(';')[0].split(':')[1]
		if (mime == null || allowed.indexOf(mime) === -1) {
			alert(
				'This widget does not support the type of file provided. ' +
				`The allowed types are: ${REQUESTED_FILE_TYPES.join(', ')}.`
			)
			return null
		}
		return mime
	}

	// converts image data uri to a blob for uploading
	const _dataURItoBlob = (dataURI, mime) => {
		// convert base64/URLEncoded data component to raw binary data held in a string
		let byteString
		const dataParts = dataURI.split(',')
		if (dataParts[0].indexOf('base64') >= 0) {
			byteString = Base64.atob(dataParts[1])
		} else {
			byteString = decodeURI(dataParts[1])
		}

		const intArray = new Uint8Array(byteString.length)
		for (const i in byteString) {
			intArray[i] = byteString.charCodeAt(i)
		}
		return new Blob([intArray], { type: mime })
	}

	const _getFileData = (file, callback) => {
		const dataReader = new FileReader()
		// File size is measured in bytes
		if (file.size > FILE_MAX_SIZE) {
			alert(
				`The file being uploaded has a size greater than 20MB. Please choose a file that is no greater than 20MB.`
			)
			return
		}
	
		dataReader.onload = (event) => {
			const src = event.target.result
			const mime = _getMimeType(src)
			if (mime == null) return
	
			callback({
				name: file.name,
				mime,
				ext: file.name.split('.').pop(),
				size: file.size,
				src,
			})
		}
	
		dataReader.readAsDataURL(file)
	}

	// Update the filterSearch state
	const _filterFiles = (ev) => {
		ev.preventDefault()
		setFilterSearch(ev.target.value)
	}

	const _onCancel = () => {
		window.parent.Materia.Creator.onMediaImportComplete(null)
	}

	/****** internally defined components ******/

	const AssetCard = ({ name, thumb, created, type, asset, is_deleted }) => {
		return (
			<div className="file-info" onClick={() => _loadPickedAsset(asset)}>
				<span className="file-thumbnail">
					<img src={thumb} alt={name} />
				</span>
				<span className="file-name">
					{name}
					<span className="file-type">{type}</span>
				</span>
				<span className="file-date">
					{created}
					<br />
					<button
						className={is_deleted ? 'action_button green' : 'action_button'}
						onClick={(ev) => {
							ev.stopPropagation()
							_updateDeleteStatus(asset)
						}}
					>
						{is_deleted ? <span>RESTORE</span> : <span>DELETE</span>}
					</button>
				</span>
			</div>
		)
	}

	// Options available based on SORT_OPTIONS
	const SortOption = ({ sortTypeIndex }) => {
		return (
			<div
				className={
					sortTypeIndex !== sortState.sortOrder
						? 'sort-option'
						: sortState.sortAsc === true
						? 'sort-option sort-asc'
						: 'sort-option sort-desc'
				}
				onClick={() => {
					setSortState({
						...sortState,
						sortAsc: !sortState.sortAsc,
						sortOrder: sortTypeIndex,
					})
				}}
			>
				{SORT_OPTIONS[sortTypeIndex].name}
			</div>
		)
	}

	return (
		<div className="media-importer">
			<section id="left-pane">
				<div className="pane-header">Upload a new file</div>

				<DragAndDrop parseMethod={_uploadFile} idStr={'drag-wrapper'}>
					<div className="drag-text">Drag a file here to upload</div>
				</DragAndDrop>
				<div className="drag-footer">
					<label>
						<input type="file" onChange={(ev) => _uploadFile(ev)} />
						<span className="action_button select_file_button">Browse...</span>
					</label>
				</div>
			</section>

			<section id="right-pane">
				<div className="pane-header darker">
					Your Media Library
					<span className="close-button" onClick={_onCancel} />
				</div>

				<div id="sort-bar">
					<div id="sort-options">
						<SortOption sortTypeIndex={0} />
						<SortOption sortTypeIndex={1} />
						<SortOption sortTypeIndex={2} />
					</div>

					<div className="darker">
						<label>
							<input
								type="checkbox"
								onChange={() => {
									setShowDeletedAssets(!showDeletedAssets)
								}}
							/>
							Show Deleted
						</label>
					</div>
				</div>

				<div className="sort-bar">
					<input
						type="input"
						placeholder="File Search"
						onChange={_filterFiles}
						value={filterSearch}
					/>
					<div className='search-icon'>
						<svg viewBox='0 0 250.313 250.313'>
							<path d='m244.19 214.6l-54.379-54.378c-0.289-0.289-0.628-0.491-0.93-0.76 10.7-16.231 16.945-35.66 16.945-56.554 0-56.837-46.075-102.91-102.91-102.91s-102.91 46.075-102.91 102.91c0 56.835 46.074 102.91 102.91 102.91 20.895 0 40.323-6.245 56.554-16.945 0.269 0.301 0.47 0.64 0.759 0.929l54.38 54.38c8.169 8.168 21.413 8.168 29.583 0 8.168-8.169 8.168-21.413 0-29.582zm-141.28-44.458c-37.134 0-67.236-30.102-67.236-67.235 0-37.134 30.103-67.236 67.236-67.236 37.132 0 67.235 30.103 67.235 67.236s-30.103 67.235-67.235 67.235z'
								clipRule='evenodd'
								fillRule='evenodd'/>
						</svg>
					</div>
				</div>

				<div id="file-display">
					{ (!sortAssets || !sortAssets.length) ? <div className="file-info">No files available!</div> : sortAssets }
				</div>
			</section>
		</div>
	)
}

export default MediaImporter