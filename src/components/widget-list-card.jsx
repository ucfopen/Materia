import { apiUpdateWidgetAdmin } from '../util/api'
import React, { useState, useEffect } from 'react'

const WidgetListCard = ({widget = null}) => {
    const [state, setState] = useState({
        widget: {
            ...widget,
            expanded: false
        },
        errorMessage: '',
        success: false
    })

    // Set state after uploading new widget
    useEffect(() => {
        setState({...state, widget: {
            ...widget,
            expanded: state.widget.expanded
        }})
    }, [widget])

    // Timeout function for success message upon saving widget
    useEffect(() => {
        if (state.success)
        {
            setTimeout(() => {
                setState(prevState => ({...prevState, success: false}))
            }, 3000)
        }
    }, [state.success])

    const handleWidgetClick = () => {
        setState(prevState => ({...prevState, widget: {...prevState.widget, expanded: !prevState.widget.expanded}, success: false, errorMessage: ''}))
    }

    const handleDemoChange = event => {
        event.persist()
        setState(prevState => ({...prevState, widget: {...prevState.widget, meta_data: {...prevState.widget.meta_data, demo: event.target.value}}}))
    }
    
    const handleAboutChange = event => {
        event.persist()
        setState(prevState => ({...prevState, widget: {...prevState.widget, meta_data: {...prevState.widget.meta_data, about: event.target.value}}}))
    }

    const handleExcerptChange = event => {
        event.persist()
        setState(prevState => ({...prevState, widget: {...prevState.widget, meta_data: {...prevState.widget.meta_data, excerpt: event.target.value}}}))
    }

    const toggleInCatalog = (widget) => {
        setState(prevState => ({...prevState, widget: {...prevState.widget, in_catalog: !prevState.widget.in_catalog}}))
    }

    const toggleIsEditable = (widget) => {
        setState(prevState => ({...prevState, widget: {...prevState.widget, is_editable: !prevState.widget.is_editable}}))
    }

    const toggleIsPlayable = (widget) => {
        setState(prevState => ({...prevState, widget: {...prevState.widget, is_playable: !prevState.widget.is_playable}}))
    }

    const toggleIsScoreable = (widget) => {
        setState(prevState => ({...prevState, widget: {...prevState.widget, is_scorable: !prevState.widget.is_scorable}}))
    }

    const toggleRestrictPublish = (widget) => {
        setState(prevState => ({...prevState, widget: {...prevState.widget, restrict_publish: !prevState.widget.restrict_publish}}))
    }

    const saveWidget = () => {
        const update = {
			id: state.widget.id,
			clean_name: state.widget.clean_name,
			in_catalog: state.widget.in_catalog,
			is_editable: state.widget.is_editable,
			is_scorable: state.widget.is_scorable,
			is_playable: state.widget.is_playable,
			restrict_publish: state.widget.restrict_publish,
			about: state.widget.meta_data.about,
			excerpt: state.widget.meta_data.excerpt,
			demo: state.widget.meta_data.demo,
        }
        
        apiUpdateWidgetAdmin(update).then(response => {
            let errorMessage = []
            let success = false
			for (let prop in response) {
				const stat = response[prop]
				if (stat !== true) {
                    errorMessage.push(stat)
				}
            }
            if (errorMessage.length == 0)
            {
                success = true
            }
            setState(prevState => ({...prevState, errorMessage: errorMessage, success: success}))
        })
    }

    let widgetErrorsRender = null
    if (state.errorMessage) {
        widgetErrorsRender = state.errorMessage.map(error => <div className="error-holder">{error}</div>)
    }

    let widgetSuccessRender = null
    if (state.success) {
        widgetSuccessRender = <div className="success-holder">Widget Saved!</div>
    }

    let featuresRender = null
    if (state.widget.meta_data.features) {
        featuresRender = state.widget.meta_data.features.map((feature, i) => <li key={i}>{ feature }</li>)
    }

    let questionTypes = null
    if (state.widget.meta_data.supported_data) {
        questionTypes = state.widget.meta_data.supported_data.map((qtype, i) => <li key={i}>{ qtype }</li>)
    }

    let exportOptions = null
    if (state.widget.meta_data.playdata_exporters) {
        exportOptions = state.widget.meta_data.playdata_exporters.map((qtype, i) => <li key={i}>{ qtype }</li>)
    }

    return (
        <li key={state.widget.id}>
            <div className="clickable widget-title" onClick={handleWidgetClick}>
                <span className="img-holder">
                    <img src={state.widget.icon}/>
                </span>
                <span className="title">{state.widget.name}</span>
            </div>
            { ! state.widget.expanded ? <></> : 
            <div className="widget-info">
                { widgetErrorsRender }
                { widgetSuccessRender }
                <div className='info-holder'>
                    <div>
                        <span>
                            <label>ID:</label>{ state.widget.id }
                        </span>
                    </div>
                    <div>
                        <span>
                            <label>Installed:</label>{ state.widget.created_at /* * 1000 | date:yyyy-MM-dd */ }
                        </span>
                    </div>
                    <div>
                        <span>
                            <label>Dimensions:</label>{ state.widget.width }w x { state.widget.height }h
                        </span>
                    </div>
                    <div>
                        <span>
                            <label>Settings:</label>
                        </span>
                        <span>
                            <div>
                                <label className="normal">
                                    <input type="checkbox" checked={state.widget.in_catalog}
                                    onChange={toggleInCatalog}/>
                                    In Catalog
                                </label>
                            </div>
                            <div>
                                <label className="normal">
                                    <input type="checkbox" checked={state.widget.is_editable}
                                    onChange={toggleIsEditable}/>
                                    Is Editable
                                </label>
                            </div>
                            <div>
                                <label className="normal">
                                    <input type="checkbox" checked={state.widget.is_playable}
                                    onChange={toggleIsPlayable}/>
                                    Is Playable
                                </label>
                            </div>
                            <div>
                                <label className="normal">
                                    <input type="checkbox" checked={state.widget.is_scorable}
                                    onChange={toggleIsScoreable}/>
                                    Is Scorable
                                </label>
                            </div>
                            <div>
                                <label className="normal">
                                    <input type="checkbox" checked={state.widget.restrict_publish}
                                    onChange={toggleRestrictPublish}/>
                                    Restrict Publish
                                </label>
                            </div>
                        </span>
                    </div>
                    <div>
                        <span>
                            <label>Demo:</label>
                            <input value={state.widget.meta_data.demo} 
                            onChange={handleDemoChange} type='text'/>
                        </span>
                    </div>
                    <div>
                        <span className="long">
                            <label>About:</label><textarea value={state.widget.meta_data.about} onChange={handleAboutChange}></textarea>
                        </span>
                    </div>
                    <div>
                        <span className="long">
                            <label>Excerpt:</label><textarea value={state.widget.meta_data.excerpt} onChange={handleExcerptChange}></textarea>
                        </span>
                    </div>
                    <div>
                        <span>
                            <label>Features:</label>
                        </span>
                        <span>
                            <ul>
                                { featuresRender }
                            </ul>
                        </span>
                    </div>
                    <div>
                        <span>
                            <label>
                                Question Types:
                            </label>
                        </span>
                        <span>
                            <ul>
                                { questionTypes }
                            </ul>
                        </span>
                    </div>
                    <div>
                        <span>
                            <label>
                                Export Options:
                            </label>
                        </span>
                        <span>
                            <ul>
                                { exportOptions }
                            </ul>
                        </span>
                    </div>
                    <button className="action_button" onClick={() => saveWidget()}>Save Changes</button>
                </div>
            </div>
            }
        </li>
    )
}

export default WidgetListCard