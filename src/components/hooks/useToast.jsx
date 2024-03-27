import React, { useState } from 'react'

export default function useToast() {
    const [msg, setMsg] = useState('')
	const [type, setType] = useState('')

	const toast = (msg, success = false, error = false, warning = false) => {
		setMsg(msg)
		setType(success ? 'success' : error ? 'error' : warning ? 'warning' : 'info')
		setTimeout(() => {
			setMsg('')
		}, 5000)
	}


	let toastRender = null
	if (msg.length > 0) {
		toastRender = (
			<div className={`toast ${type}`}>
				{msg}
				<div className='bar'>
				</div>
				<div className='close' onClick={() => setMsg('')}>
					<svg className='close-icon' viewBox='0 0 24 24'>
						<path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/>
					</svg>
				</div>
			</div>
		)
	}

    return {toast, toastRender};

}