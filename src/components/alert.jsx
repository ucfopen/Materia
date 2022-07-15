
import React from 'react'

const Alert = ({ msg, title, fatal, showLoginButton, onCloseCallback }) => {

    const reloadPage = () => {
        window.location.reload()
    }

    return (
        <div className="alert-wrapper">
             <div className={`alert-dialog ${fatal ? 'fatal' : ''}`}>
                <h3>{ title }</h3>
                { msg }
                <section className="buttons">
                    { fatal ? '' :  <button className="action_button" onClick={() => onCloseCallback()}>Okay</button> }
                    { showLoginButton ? <button className="action_button" onClick={reloadPage}>Click Here to Login</button> : '' }
                </section>
            </div>
        </div>
    )
}

export default Alert