import React, { useState, useEffect} from 'react'
import Summary from './widget-summary'
import Header from './header'

const NoAttempts = () => {
  const [attempts, setAttempts] = useState(null)
  const [scoresPath, setScoresPath] = useState(null)

  useEffect(() => {
    waitForWindow().then(() => {
      const scoresPath = `/scores${window.IS_EMBEDDED ? '/embed' : ''}/${window.WIDGET_ID}`;

      setScoresPath(scoresPath);
      setAttempts(window.ATTEMPTS)
    })
  }, [])

  const waitForWindow = async () => {
		while(!window.hasOwnProperty('WIDGET_ID')
		&& !window.hasOwnProperty('IS_EMBEDDED')
		&& !window.hasOwnProperty('ATTEMPTS')) {
			await new Promise(resolve => setTimeout(resolve, 500))
		}
	}

  let bodyRender = null
  if (!!attempts) {
    bodyRender = (
      <div className={"container widget"}>
      	<section className="attempts page">
      		<Summary/>

      		<div className="detail icon-offset">
      			<h2 className="unavailable-text">No remaining attempts</h2>
      			<span className="unavailable-subtext">You've used all { attempts } available attempts.</span>
      			<p>
      				<a href={ scoresPath }>Review previous scores</a>
      			</p>
      		</div>
      	</section>
      </div>
    )
  }

  return (
    <>
      <Header />
      { bodyRender }
    </>
  )
}

export default NoAttempts
