import { useState, useEffect, useRef } from 'react';


// const MEDIA_URL = useRef(false) // for some reason it breaks the importer
const SORTING_NONE = false
const SORTING_ASC = 'asc'
const SORTING_DESC = 'desc'

const sortString = (field, a, b) => a[field].toLowerCase().localeCompare(b[field].toLowerCase())
const sortNumber = (field, a, b) => a[field] - b[field]

const SORT_OPTIONS = [
  {
    sortMethod: sortString.bind(null, 'name'), // bind the field name to the sort method
    name: 'Title',
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

// generic media type definitions and substitutions for compatibility
const MIME_MAP = {
  //generic types, preferred
  image: ['image/jpg', 'image/jpeg', 'image/gif', 'image/png'],
  audio: ['audio/mp3', 'audio/mpeg', 'audio/mpeg3'],
  video: [], //placeholder
  //incompatibility prevention, not preferred
  jpg: ['image/jpg'],
  jpeg: ['image/jpeg'],
  gif: ['image/gif'],
  png: ['image/png'],
  mp3: ['audio/mp3', 'audio/mpeg', 'audio/mpeg3'],
}

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

export const getAllAssets = async () => {
  // 1. Fetch assets from the DB
  const resp = await fetch(`/api/json/assets_get`)
  if (resp.status === 204 || resp.status === 502) return []

  const listOfAssets = await resp.json()
  const lengthOfListOfAssets = await Object.keys(listOfAssets).length // returns the number of item in the json

  // 2. Restructure date to the correct formats
  await listOfAssets.forEach(element => {
    element['name'] = element.title.split('.').shift()
    element['timestamp'] = element.created_at
    element['thumb'] = _thumbnailUrl(element.id, element.type)

    const creationDate = new Date(element.created_at * 1000)
    const dateString = [creationDate.getMonth(), creationDate.getDate(), creationDate.getFullYear()].join('/')
    element.created_at = dateString
  });

  return listOfAssets
}