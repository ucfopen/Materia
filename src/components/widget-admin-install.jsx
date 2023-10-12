import React, { useState, useEffect } from 'react'
import { apiUploadWidgets } from '../util/api'

const WidgetInstall = ({refetchWidgets}) => {
    const [state, setState] = useState({
        uploadNotice: undefined,
        uploadEnabled: false,
        actionLink: undefined,
        herokuWarning: undefined,
        selectedFilename: '',
        isUploading: false,
        uploadError: false
    })

    useEffect(() => {
        setState({...state,
            uploadEnabled: !!+window.UPLOAD_ENABLED,
            actionLink: window.ACTION_LINK,
            herokuWarning: window.HEROKU_WARNING
        })
    }, [window.UPLOAD_ENABLED, window.ACTION_LINK, window.HEROKU_WARNING])
    
    const handleChange = async (event) => {
        const files = event.target.files
        let correctFileExtension = true;

        setState({...state, isUploading: true, uploadNotice: undefined})

        Array.from(files).forEach((file) => {
            if (file.name.split('.')[1] !== 'wigt') {
                correctFileExtension = false;
                setState({...state, isUploading: false, uploadNotice: 'File type not accepted! Please upload a .wigt file.', uploadError: true})
            }
        })
        if (correctFileExtension)
            apiUploadWidgets(files)
            .then((response) => {
                if (response.ok && response.status !== 204 && response.status < 400) {
                    setState({...state, uploadNotice: `Successfully uploaded '${files[0].name}'!`, isUploading: false, uploadError: false})
                    refetchWidgets()
                } else {
                    setState({...state, uploadNotice: `Failed to upload '${files[0].name}'`, isUploading: false, uploadError: true})
                }
            })
    }

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
                <span className={state.uploadError ? 'failed' : 'success'}>{ state.uploadNotice }</span>
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
                <div className="top">
                    <h1>Install Widget</h1>
                </div>
                { uploadRender }
            </section>
        </div>
    )
}

export default WidgetInstall