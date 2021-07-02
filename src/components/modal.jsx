import React from 'react'
import { createPortal } from 'react-dom';
import './modal.scss'
//import useClickOutside from '../util/use-click-outside'

class Modal extends React.Component {
	constructor( props ) {
		super( props )
		// create an element div for this modal
		this.modalRef = React.createRef()
		this.element = document.createElement( 'div' )
		this.clickOutsideListener = this.clickOutsideListener.bind(this)

		// We get hold of the div with the id modal that we have created in index.html
		this.modalRoot = document.getElementById( 'modal' )
	}

	clickOutsideListener(event){
		// Do nothing if clicking ref's element or descendent elements
		if (!this.modalRef.current || this.modalRef.current.contains(event.target)) {
			return
		}

		if (this.props.ignoreClose !== true) {
			this.props.onClose()
		}
	};

	componentDidMount() {
		this.modalRoot.appendChild( this.element )
		document.addEventListener('mousedown', this.clickOutsideListener)
		document.addEventListener('touchstart', this.clickOutsideListener)
		document.body.style.overflow = 'hidden'
	}

	componentWillUnmount() {
		this.modalRoot.removeChild( this.element )
		document.removeEventListener('mousedown', this.clickOutsideListener)
		document.removeEventListener('touchstart', this.clickOutsideListener)
		document.body.style.overflow = 'auto'
	}

	render() {
	  const stuff = (
		<>
			<div className={`modal-overlay ${this.props.alert ? 'alert' : ''}`} id="modal-overlay"></div>

			<div ref={this.modalRef} className={`modal ${this.props.smaller ? 'small' : ''} ${this.props.noGutter ? 'no-gutter' : ''}`} id="inner-modal">
				<span className="close-button"
					id="close-button"
					aria-label={`close${this.props.testId ? `-${this.props.testId}-` : '-'}modal`}
					onClick={this.props.onClose}>X</span>
				<div className={`modal-guts ${this.props.noGutter ? 'no-gutter' : ''}`}>
					{this.props.children}
				</div>
			</div>
		</>
	  )
	  return createPortal( stuff, this.element );
   }
}

export default Modal
