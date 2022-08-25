import React, { useState, useRef, useEffect } from 'react'
import { apiUploadWidgets } from '../util/api'

const WidgetInstall = () => {
    const [state, setState] = useState({
        uploadNotice: undefined,
        uploadEnabled: false,
        actionLink: undefined,
        herokuWarning: undefined,
        selectedFilename: 'No File Selected',
        isUploading: false,
    })

	const waitForWindow = async () => {
		while(!window.hasOwnProperty('UPLOAD_ENABLED') || !window.hasOwnProperty('ACTION_LINK') || !window.hasOwnProperty('HEROKU_WARNING') || !window.hasOwnProperty('UPLOAD_NOTICE')) {
			await new Promise(resolve => setTimeout(resolve, 500))
		}
    }
	
	// Wait for window data to load then set global variables to state
    useEffect(() => {
		waitForWindow().then(() => {
            setState({...state,
                uploadEnabled: !!+window.UPLOAD_ENABLED,
                actionLink: window.ACTION_LINK,
                herokuWarning: window.HEROKU_WARNING,
                uploadNotice: window.UPLOAD_NOTICE
            })
		})
    }, [])
    
    const handleChange = (event) => {
        const files = event.target.files
        setState({...state, selectedFilename: files[0].name})
        if (files && files[0]) {
            setState({...state, selectedFilename: files[0].name})
        }

        setState({...state, isUploading: true})

        apiUploadWidgets(files)
        .then((response) => {
			if (response.ok && response.status !== 204 && response.status !== 502) {
                setState({...state, uploadNotice: "Success"})
            } else {
                setState({...state, uploadNotice: "Failed"})
            }
            setState({...state, isUploading: false})
        })
    }

    useEffect(() => {
        console.log(state)
    }, [state])

    let herokuWarning = null
    if (state.herokuWarning) {
        herokuWarning = 
        <p>
            <b>Note:</b> On Heroku, installing widgets must happen during the Heroku build process. Read more at
            <a href="https://ucfopen.github.io/Materia-Docs/admin/heroku.html#installing-widgets"
                target="_blank"
                rel="noopener noreferrer">
                The Official Materia Documentation Page.
            </a>
        </p>
    }

    let uploadRender = null
    if (state.uploadEnabled) {
        uploadRender = <>
            <p>Upload a <strong>.wigt</strong> widget package file to install a new widget or upgrade an existing widget on Materia.</p>
            <form>
                <input className="uploader" id="widget_uploader" type="file" name="file" onChange={handleChange} disabled={state.uploadEnabled ? false : true}/>
                <label htmlFor="widget_uploader"> {state.isUploading ? 'Uploading...' : 'Upload .wigt'}</label>
                <span>{ state.uploadNotice || state.selectedFilename }</span>
            </form>
            <p>Browse installable widgets on <a href="https://ucfopen.github.io/materia-widget-gallery/" target="_blank" rel="noopener noreferrer">The Official Materia Widget Gallery</a></p>
            <p>Browse features and more on <a href="https://ucfopen.github.io/Materia-Docs/" target="_blank" rel="noopener noreferrer">The Official Materia Documentation Page</a></p>
        </>
    } else {
        uploadRender = <>
            <p>Widget uploader is <em>disabled</em>.</p>
            <p>To enable, alter the "enable_admin_uploader" configuration option in config/materia.php.</p>
            { herokuWarning }
        </>
    }

    return (
        <div className="container" id="upload_area">
            <section className="page">
                <div className="error">
                    <p>{ state.uploadNotice }</p>
                </div>
                <div className="top">
                    <h1>Install Widget</h1>
                </div>
                { uploadRender }
            </section>
        </div>
    )
}

export default WidgetInstall