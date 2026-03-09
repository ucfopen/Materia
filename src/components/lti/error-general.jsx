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
                    <h4>Error type: Unknown Assignment</h4>
                    <p>This Materia assignment hasn't been setup correctly in the LMS.</p>
	                <p>Your instructor will need to complete the setup process.</p>
                </section>
            break;
        case 'error_unknown_user':
            content =
                <section id="error-container">
                    <h4>Error type: Unknown User</h4>
                    <p>Materia cannot determine who you are using the information provided by the LMS.</p>
                    <p>This may occur if you are using a non-standard account or if the LMS is missing information about who you are.</p>
                    <p>If this message persists, contact support.</p>
                </section>
            break;
        case 'error_launch_validation':
            content =
                <section id="error-container">
                    <h4>Error type: Launch Validation Failed</h4>
                    <p>The launch information provided by the LMS failed validation.</p>
                    <p>Try accessing the tool again without using the back button. If prompted to re-submit page data, try leaving the page and re-selecting the activity.</p>
                    <p>If this message persists, contact support.</p>
                </section>
            break;
        case 'error_autoplay_misconfigured':
            content =
                <section id="error-container">
                    <h4>Error type: Autoplay Misconfigured</h4>
                    <p>This Materia assignment hasn't been setup correctly in the system.</p>
                    <p>Non-autoplaying widgets can not be used as graded assignments.</p>
                </section>
            break;
        case 'error_lti_guest_mode':
            content =
                <section id="error-container">
                    <h4>Error type: Guest Mode Enabled</h4>
                    <p>This assignment has guest mode enabled.</p>
                    <p>This assignment can only record scores anonymously and therefore cannot be played as an embedded assignment.</p>
                    <p>Your instructor will need to disable guest mode or provide a link to play as a guest.</p>
                </section>
            break;
        case 'error_invalid_oauth_request':
            content =
                <section id="error-container">
                    <h4>Error type: Invalid Oauth Request</h4>
                    <p>Something went wrong when Materia tried to authenticate you with information from the LMS.</p>
                    <p>We recommend contacting support:</p>
                </section>
            break;
        case 'error_launch_recovery':
            content =
            <section id="error-container">
                <h4>Error type: Launch Recovery Failure</h4>
                <p>Materia couldn't complete this operation because of a session caching issue.</p>
                <p>This almost certainly isn't because of anything you did. If possible, please report the issue to support.</p>
            </section>
        default:
            content =
                <section id="error-container">
                    <h4>Error type: General Error</h4>
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
