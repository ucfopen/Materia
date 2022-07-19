import React from 'react'
import Header from './header'

const Retired = () => {

  // let headerRender = <Header/>

  let bodyRender = (
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

  return (
    <>
      { bodyRender }
    </>
  )
}

export default Retired
