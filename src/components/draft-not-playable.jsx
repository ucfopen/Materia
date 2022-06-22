import React from 'react'
import SupportInfo from './support-info'
import Header from './header'

const DraftNotPlayable = () => {

  let headerRender = <Header/>

  let bodyRender = (
    <div className="container general" id="is-draft">
      <section className="page is-draft">

        <h2 className="logo">Sorry, drafts are not playable.</h2>

        <p>You probably need to:</p>
        <ul>
          <li>Preview instead of play.</li>
          <li>Publish this widget to start collecting scores.</li>
          <li>Check out our documentation.</li>
          <li>Take a break, watch <a href="http://youtu.be/S1k86fWsmRE?t=35s" style="color:black;">cat</a> <a href="http://www.youtube.com/watch?v=q8Z3NEVIwYg&feature=relmfu" style="color:black;">videos</a>.</li>
        </ul>

        <SupportInfo/>

      </section>
    </div>
  )

  return (
    <>
      { headerRender }
      { bodyRender }
    </>
  )
}

export default DraftNotPlayable
