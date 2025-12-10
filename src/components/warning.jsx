import React from 'react'
import './warning.scss'

const Warning = ({
  children = '',
}) => {
  return (
    <div className="warning-container">
      <img className="warning-icon" src="/img/warning.svg" alt="" />
      {children}
    </div>
  )
}

export default Warning
