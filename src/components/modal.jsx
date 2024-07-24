import React, { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

import './modal.scss'

const Modal = (props) => {

	const innerModalRef = useRef(null)
	const innerModalOverlayRef = useRef(null)

	const clickOutsideListener = (event) => {
		// Do nothing if clicking ref's element or descendent elements
		if (!innerModalOverlayRef.current.contains(event.target)) return
		if (props.ignoreClose != true) props.onClose()
	}

	useEffect(() => {

		document.addEventListener('mouseup', clickOutsideListener)
		document.addEventListener('touchend', clickOutsideListener)

		return () => {
			document.removeEventListener('mouseup', clickOutsideListener)
			document.removeEventListener('touchend', clickOutsideListener)
		}

	},[])

	const modal =
		(<>
			<div ref={innerModalOverlayRef} className={`modal-overlay ${props.alert ? 'alert' : ''}`} id='modal-overlay'></div>
			<div ref={innerModalRef} className={`modal ${props.smaller ? 'small' : ''} ${props.noGutter ? 'no-gutter' : ''}`} id='inner-modal'>
				<span className='close-button'
					id='close-button'
					aria-label={`close${props.testId ? `-${props.testId}-` : '-'}modal`}
					onClick={props.onClose}>X</span>
				<div className={`modal-guts ${props.noGutter ? 'no-gutter' : ''}`}>
					{props.children}
				</div>
			</div>
		</>)

	return createPortal(modal, document.getElementById('modal'))
}

export default Modal
