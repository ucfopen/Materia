import React, { useState, useEffect } from 'react'

import { useQuery } from 'react-query'
import { apiGetQuestionSetHistory } from '../util/api'

const getInstId = () => {
  const l = document.location.href
  const id = l.substring(l.lastIndexOf('=') + 1)
  return id
}

const QuestionHistory = () => {
  const [saves, setSaves] = useState([])
  const [instId, setInstId] = useState(getInstId())

  const { data: qsetHistory, isLoading: loading } = useQuery({
    queryKey: ['questions', instId],
		queryFn: () => apiGetQuestionSetHistory(instId),
    enabled: !!instId,
		staleTime: Infinity
  })

  useEffect(() => {
    if (qsetHistory && qsetHistory.type != 'error')
    {
      qsetHistory.map((qset) => {
        return {
					id: qset.id,
					data: qset.data,
					version: qset.version,
					count: readQuestionCount(qset.data),
					created_at: new Date(parseInt(qset.created_at) * 1000).toLocaleString(),
				}
      })
      setSaves(qsetHistory)
    }
  }, [qsetHistory])

  const readQuestionCount = (qset) => {
		let items = qset.items
		if (items.items) items = items.items

		return items.length
	}

  const loadSaveData = (id) => {
    if (!!saves) {
      saves.forEach((save) => {
  			if (id == save.id) {
  				return window.parent.Materia.Creator.onQsetHistorySelectionComplete(
  					JSON.stringify(save.data),
  					save.version,
  					save.created_at
  				)
  			}
  		})
    }
	}

	const closeDialog = (e) => {
		e.stopPropagation()
		return window.parent.Materia.Creator.onQsetHistorySelectionComplete(null)
	}

  let savesRender = null
  let noSavesRender = null
  if (!!saves && saves.length > 0) {
    savesRender = saves.map((save, index) => {
      return (
        <tr onClick={() => loadSaveData(save.id)}>
          <td>Save #{saves.length - index}</td>
          <td>{save.created_at}</td>
        </tr>
      )
    })
  } else {
    noSavesRender = (
      <div className="no_saves">
    		<h3>No previous saves for this widget.</h3>
    		If you publish or a save a draft of your widget and then come back, you can view and restore previous saves from here.
    	</div>
    )
  }

  let bodyRender = (
    <div>
    	<form id="import_form">
    		<h1>Save History</h1>
    		<table id="qset_table" width="100%">
    			<thead width="100%">
    				<tr>
    					<th>Save Count</th>
    					<th>Saved At</th>
    				</tr>
    			</thead>
    			{ savesRender }
    		</table>
    	</form>
      { noSavesRender }
    	<div className="actions">
    		<a id="cancel_button" href="#" onClick={() => closeDialog(event)}>Cancel</a>
    	</div>
    </div>
  )

  return (
    <>
      { bodyRender }
    </>
  )
}

export default QuestionHistory
