import React from 'react'
import { createPortal } from 'react-dom';
import './modal.scss'

// We get hold of the div with the id modal that we have created in index.html
const modalRoot = document.getElementById( 'modal' );

class Modal extends React.Component {
	constructor( props ) {
		super( props );
		// create an element div for this modal
		this.element = document.createElement( 'div' );
	}

	componentDidMount() {
		modalRoot.appendChild( this.element );
	}

	componentWillUnmount() {
		modalRoot.removeChild( this.element );
	}

	render() {
	  const stuff = (
		<>
			<div className="modal-overlay" id="modal-overlay"></div>

			<div className="modal" id="modal">
				<button className="close-button" id="close-button" onClick={this.props.onClose}>X</button>
				<div className="modal-guts">
					{this.props.children}
				</div>
			</div>
		</>
	  )
	  return createPortal( stuff, this.element );
   }
}

export default Modal
