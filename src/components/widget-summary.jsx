import React, { useState, useEffect} from 'react'

const Summary = () => {

  const [name, setName] = useState(null)
  const [icon, setIcon] = useState(null)
  const [avail, setAvail] = useState(null)

  useEffect(() => {
    waitForWindow().then(() => {
      setName(window.NAME)
      setIcon(window.ICON)
      setAvail(window.AVAIL)
    })
  })

  const waitForWindow = async () => {
		while(!window.hasOwnProperty('NAME')
		&& !window.hasOwnProperty('ICON')
		&& !window.hasOwnProperty('AVAIL')) {
			await new Promise(resolve => setTimeout(resolve, 500))
		}
	}

  let bodyRender = null
  if (!!name) {
    bodyRender = (
      <div className="widget_info">
      	<div className="widget_icon">
      		<img src={ icon } alt=""/>
      	</div>
      	<ul className="widget_info">
          { name && <li className="widget_name">{ name }</li>}
          { avail && <li className="widget_availability">{ avail }</li>}
      	</ul>
      </div>
    )
  }

  return (
    <>
      { bodyRender }
    </>
  )
}

export default Summary
