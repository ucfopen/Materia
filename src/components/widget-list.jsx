import React, { useState, useRef, useEffect } from 'react'

import WidgetListCard from './widget-list-card'

const WidgetList = ({widgets = [], isLoading = true}) => {
    let widgetsListRender = null

    if (!isLoading) {
        widgetsListRender = widgets.map((widget, index) => <WidgetListCard  key={index} widget={widget}/>)
    }
    
    return (
        <div className="container" id="widgets_area">
		    <section className="page">
			    <div className="top">
                    <h1>Widget List</h1>
                </div>
                <ul>
                    { widgetsListRender }
                </ul>
            </section>
	    </div>
    )
}

export default WidgetList