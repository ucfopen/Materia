import React, { useEffect, useState } from 'react'
import SupportInfo from '../support-info'

const ErrorGeneral = () => {
    const [title, setTitle] = useState('')

    useEffect(() => {
        if (window.TITLE) {
            setTitle(window.TITLE)
        }
    }, [window.TITLE])

    return <>
        <header>
            <h1>{title}</h1>
            <div id="logo"></div>
        </header>

        <section id="error-container">
            <p>An error occurred.</p>

            <p>If you need help accessing this tool, contact support.</p>

            <SupportInfo/>
        </section>
    </>
}

export default ErrorGeneral