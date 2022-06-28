
// generic media type definitions and substitutions for compatibility
const MIME_MAP = {
  // generic types, preferred
  image: ['image/jpg', 'image/jpeg', 'image/gif', 'image/png'],
  audio: ['audio/mp3', 'audio/mpeg', 'audio/mpeg3'],
  video: [], // placeholder
  model: ['model/obj'],

  // incompatibility prevention, not preferred
  jpg: ['image/jpg'],
  jpeg: ['image/jpeg'],
  gif: ['image/gif'],
  png: ['image/png'],
  mp3: ['audio/mp3', 'audio/mpeg', 'audio/mpeg3'],
  obj: ['application/octet-stream', 'model/obj'],
}

const REQUESTED_FILE_TYPES = window.location.hash.substring(1).split(',')

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

const _getFileData = (file, callback) => {
  const dataReader = new FileReader()
  // File size is measured in bytes
  if (file.size > 60000000) {
    alert(
      `The file being uploaded has a size greater than 60MB. Please choose a file that is no greater than 60MB.`
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

const _upload = async (fileData) => {

  const fd = new FormData()
  fd.append('name', fileData.name)
  fd.append('Content-Type', fileData.type)
  fd.append('file', _dataURItoBlob(fileData.src, fileData.type), fileData.name)

  const request = new XMLHttpRequest()

  request.onload = (oEvent) => {
    const res = JSON.parse(request.response) //parse response string
    if (res.error) {
      alert(`Error code ${res.error.code}: ${res.error.message}`)
      onCancel()
      return
    }
    _loadAllMedia(res.id)
  }
  request.open('POST', MEDIA_UPLOAD_URL)
  request.send(fd)
}

// converts image data uri to a blob for uploading
const _dataURItoBlob = (dataURI, mime) => {
  // convert base64/URLEncoded data component to raw binary data held in a string
  let byteString
  const dataParts = dataURI.split(',')
  if (dataParts[0].indexOf('base64') >= 0) {
    byteString = atob(dataParts[1])
  } else {
    byteString = unescape(dataParts[1])
  }

  const intArray = new Uint8Array(byteString.length)
  for (const i in byteString) {
    intArray[i] = byteString.charCodeAt(i)
  }
  return new Blob([intArray], { type: mime })
}

const _getMimeType = (dataUrl) => {
  let allowedFileExtensions = []

  REQUESTED_FILE_TYPES.forEach((type) => {
    if (MIME_MAP[type]) {
      allowedFileExtensions = [...allowedFileExtensions, ...MIME_MAP[type]]
    }
  })

  const mime = dataUrl.split(';')[0].split(':')[1]

  if (mime == null || allowedFileExtensions.indexOf(mime) === -1) {
    alert(
      'This widget does not support the type of file provided. ' +
      `The allowed types are: ${REQUESTED_FILE_TYPES.join(', ')}.`
    )
    return null
  }
  return mime
}

const _loadAllMedia = async (file = null) => {
  // 1. Fetch assets from the DB
  const resp = await fetch(`/api/json/assets_get`)
  if (resp.status === 204 || resp.status === 502) return []

  const listOfAssets = await resp.json()

  // 2. Restructure date to the correct formats
  await listOfAssets.forEach(element => {
    element['name'] = element.title.split('.').shift()
    element['timestamp'] = element.created_at
    element['thumb'] = _thumbnailUrl(element.id, element.type)

    const creationDate = new Date(element.created_at * 1000)
    const dateString = [creationDate.getMonth(), creationDate.getDate(), creationDate.getFullYear()].join('/')
    element.created_at = dateString

    if (file == element.id) {
      loadPickedAsset(element)
    }

  });

  return listOfAssets
}

const _announceReady = () => {
  // announce to the creator that the importer is available, if waiting to auto-upload
  let msg = {
    type: 'readyForDirectUpload',
    source: 'media-importer',
    data: '',
  }
  window.parent.postMessage(JSON.stringify(msg), '*')
}

// public version
export const getAllAssets = async () => {
  const listOfAssets = await _loadAllMedia()
  return listOfAssets
}

export const loadPickedAsset = async (element) => {
  window.parent.Materia.Creator.onMediaImportComplete([element])
}

// just picks the first selected image
export const uploadFile = (e) => {
  const file =
    (e.target.files && e.target.files[0]) || (e.dataTransfer.files && e.dataTransfer.files[0])
  if (file) _getFileData(file, _upload)
}

export const onCancel = () => {
  window.parent.Materia.Creator.onMediaImportComplete(null)
}

export const deleteAsset = async (assetId) => {

  const options = {
    method: 'DELETE',
    mode: 'cors',
    credentials: 'include',
    headers: {
      pragma: 'no-cache',
      'cache-control': 'no-cache',
      'content-type': 'application/json; charset=UTF-8'
    }
  }
  await fetch(`/api/asset/delete/${assetId}`, options)
}

export const restoreAsset = async (assetId) => {
  const options = {
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
    headers: {
      pragma: 'no-cache',
      'cache-control': 'no-cache',
      'content-type': 'application/json; charset=UTF-8'
    }
  }
  await fetch(`/api/asset/restore/${assetId}`, options)
}


_announceReady()