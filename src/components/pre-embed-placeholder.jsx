import React, { useState, useEffect} from 'react'
import Summary from './widget-summary'

const PreEmbedPlaceholder = () => {

  const [instId, setInstId] = useState(null)
  const [context, setContext] = useState(null)

  useEffect(() => {
    waitForWindow().then(() => {
      setInstId(window.INST_ID)
      setContext(window.CONTEXT)
    })
  })

  const waitForWindow = async () => {
		while(!window.hasOwnProperty('INST_ID')
		&& !window.hasOwnProperty('CONTEXT')) {
			await new Promise(resolve => setTimeout(resolve, 500))
		}
	}

  let bodyRender = null
  if (!!name) {
    bodyRender = (
      <div className="container widget">
      	<section className="page">
          <Summary/>

      		<div className="detail icon-offset">
      			<a className="action_button" href={`/${context}/${inst_id}`}>Play</a>
      		</div>
      	</section>
      </div>
    )
  }

  return (
    <>
      { bodyRender }
    </>
  )
}

export default PreEmbedPlaceholder
