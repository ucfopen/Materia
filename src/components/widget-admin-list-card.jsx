import { apiUpdateWidgetEngine } from '../util/api'
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
        setState(prevState => ({...prevState, success: false}))

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

        apiUpdateWidgetEngine(update)
        .then(response => {
            setState(prevState => ({...prevState, success: true}))
        }).catch(err => {
            setState(prevState => ({...prevState, errorMessage: err.message, success: false}))
        })
    }

    let widgetErrorsRender = null
    if (state.errorMessage) {
        widgetErrorsRender = <div className="error"><p>{state.errorMessage}</p></div>
    }

    let widgetSuccessRender = null
    if (state.success) {
        widgetSuccessRender = <div className="success-holder">
            <div className='success'><p>Widget Saved!</p></div>
        </div>
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
                            <label>Installed:</label>{ new Date(state.widget.created_at).toLocaleString() }
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
                            <label htmlFor="demo">Demo:</label>
                            <input value={state.widget.meta_data.demo}
                            onChange={handleDemoChange} type='text' id="demo"/>
                        </span>
                    </div>
                    <div>
                        <span className="long">
                            <label htmlFor="about">About:</label>
                            <textarea id="about" value={state.widget.meta_data.about} onChange={handleAboutChange}></textarea>
                        </span>
                    </div>
                    <div>
                        <span className="long">
                            <label htmlFor="excerpt">Excerpt:</label><textarea id="excerpt" value={state.widget.meta_data.excerpt} onChange={handleExcerptChange}></textarea>
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