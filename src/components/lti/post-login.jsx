import React, { useState, useEffect } from 'react'

const PostLogin = () => {
    const [staticURL, setStaticURL] = useState('')

    useEffect(() => {
        waitForWindow().then(() => {
            setStaticURL(window.STATIC_CROSSDOMAIN)
        })
    }, [])

    const waitForWindow = async () => {
        while (!window.hasOwnProperty('STATIC_CROSSDOMAIN')) {
            await new Promise(resolve => setTimeout(resolve, 500))
        }
    }

    return (
        <section className='p_s' id="lti-login-section">
        <div id="h1-div">
            <h1>
                Materia: Build, Create, & Share Your Widgets
            </h1>
        </div>
        <div className="widget-info" id="make-widgets">
            <h2 id= "widgets-heading">Make Your Own Widgets:</h2>
            <img src={staticURL + "img/create-widgets.png"}/>
            <p>
                Materia features a growing library of customizable widgets.
                Learn more about the available widgets and how to make your own
                <a className='external' target='_blank' href='http://ucfopen.github.io/Materia-Docs/create/getting-started.html'> here</a>.
            </p>
            <a className="action_button" target='_blank' href="/my-widgets">Go to Materia</a>
        </div>

        <div className="widget-info" id="embed-widgets">
            <h2 id="embed-heading">Embed Your Widgets:</h2>
            <img src={staticURL + "img/embed.png"}/>
            <p>
                Embedding the widgets you create into your Canvas courses as assignments - graded or not - is a quick and easy process.
                Learn more about embedding your widgets.
            </p>
            <a className="action_button" target='_blank' href="http://ucfopen.github.io/Materia-Docs/create/embedding-in-canvas.html">Learn More</a>
        </div>
    </section>
    )
}

export default PostLogin
