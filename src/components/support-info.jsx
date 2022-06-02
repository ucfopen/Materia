import React from 'react'

const SupportInfo = () => {

  return (
    <div className="error-support">
    	<h3>Trouble Logging In?</h3>
    	<span className="subtitle">Contact the Service Desk.</span>
    	<dl className="contact">
    		<dt>Website</dt>
    			<dd><a href="http://website/support">http://website/support</a></dd>
    		<dt>Email</dt>
    			<dd><a href="mailto:support@website">support@website</a></dd>
    		<dt>Phone</dt>
    			<dd>PHONE NUMBER HERE</dd>
    	</dl>

    	<h3>Get Help Using Materia</h3>
    	<span className="subtitle">When something's gone wrong, or you just need a hand.</span>
    	<dl className="online-support">
    		<dt>Materia Support</dt>
    			<dd><a href="http://website/support/">http://website/support/</a></dd>
    		<dt>Email</dt>
    			<dd><a href="mailto:support@website">support@website</a></dd>
    		<dt>Phone</dt>
    			<dd>PHONE NUMBER HERE</dd>
    	</dl>
    </div>
  )
}

export default SupportInfo
