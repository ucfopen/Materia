import React, { useEffect, useState } from 'react'
import SupportInfo from '../support-info'

const ErrorGeneral = () => {
    const [title, setTitle] = useState('')
    const [errorType, setErrorType] = useState('')

    useEffect(() => {
        if (window.TITLE) {
            setTitle(window.TITLE)
        }
    }, [window.TITLE])

    useEffect(() => {
        if (window.ERROR_TYPE) {
            setErrorType(window.ERROR_TYPE)
        }
    }, [window.ERROR_TYPE])

    let content = null;

    switch (errorType)
    {
        case 'error_unknown_assignment':
            content =
                <section id="error-container">
                    <p>This Materia assignment hasn't been setup correctly in the system.</p>
	                <p>Your instructor will need to complete the setup process.</p>
                </section>
            break;
        case 'error_unknown_user':
            content =
                <section id="error-container">
                    <p>Materia can not determine who you are using the information provided by the system.</p>
                    <p>This may occur if you are using a non-standard account or if your information is missing from Materia due to recent changes to your account.</p>
                    <p>If you need help accessing this tool, contact support.</p>
                </section>
            break;
        case 'error_autoplay_misconfigured':
            content =
                <section id="error-container">
                    <p>This Materia assignment hasn't been setup correctly in the system.</p>
                    <p>Non-autoplaying widgets can not be used as graded assignments.</p>
                </section>
            break;
        case 'error_lti_guest_mode':
            content =
                <section id="error-container">
                    <p>This assignment has guest mode enabled.</p>
                    <p>This assignment can only record scores anonymously and therefore cannot be played as an embedded assignment.</p>
                    <p>Your instructor will need to disable guest mode or provide a link to play as a guest.</p>
                </section>
            break;
        case 'error_invalid_oauth_request':
            content =
                <section id="error-container">
                    <p>Invalid login.</p>
                    <p>If you need help accessing this tool, contact support.</p>
                </section>
            break;
        default:
            content =
                <section id="error-container">
                    <p>An error occurred.</p>
                    <p>If you need help accessing this tool, contact support.</p>
                </section>
            break;
    }

    return <>
        <header>
            <h1>{title}</h1>
            <div id="logo"></div>
        </header>

        {content}

        <SupportInfo/>
    </>
}

export default ErrorGeneral
