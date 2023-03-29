import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useQuery } from 'react-query';
import { apiGetWidgetInstances } from '../../util/api'
import { iconUrl } from '../../util/icon-url'

const SelectItem = () => {
    const [strHeader, setStrHeader] = useState('Select a Widget:');
    const [selectedInstance, setSelectedInstance] = useState(null);
    const [searchText, setSearchText] = useState('')
    const [easterMode, setEasterMode] = useState(false)
    const [showRefreshArrow, setShowRefreshArrow] = useState(false)
    const [displayState, setDisplayState] = useState('selectInstance')
    const fillRef = useRef(null)
    const [progressComplete, setProgressComplete] = useState(false)

    const [state, setState] = useState({
		page: 1,
        instances: [],
    })

    const { data, isFetching: isFetching, refetch: refetchInstances} = useQuery({
		queryKey: 'instances',
		queryFn: () => apiGetWidgetInstances(state.page),
        staleTime: Infinity,
        onSuccess: (data) => {
            if (data) {
                data.pagination.map((instance, index) => {
                    instance.img = iconUrl('/widget/', instance.widget.dir, 60)
                    instance.preview_url = BASE_URL + 'preview/' + instance.id
                    instance.edit_url = BASE_URL + 'my-widgets/#' + instance.id
                })

                setState({...state, instances: data.pagination})
            }
        }
    })

    useEffect(() => {
        if (window.SYSTEM) {
            setStrHeader(`Select a Widget for use in ${window.SYSTEM}:`)
        }
    }, [window.SYSTEM])

    const hiddenSet = useMemo(() => {
        const result = new Set()
		if(searchText == '') return result

        const re = RegExp(searchText, 'i')
        if (state.instances && state.instances.length > 0)
            state.instances.forEach(i => {
                if(!re.test(`${i.name} ${i.widget.name} ${i.id}`)){
                    result.add(i.id)
                }
            })

		return result
    }, [searchText, state.instances])

    const handleChange = (e) => {
        setSearchText(e.target.value)
    }

    const refreshListing = () => {
        refetchInstances()
        setShowRefreshArrow(false)
    }

    const cancelProgress = () => {
        setDisplayState('selectInstance')
        setSelectedInstance(null)
    }

    const embedInstance = (instance) => {
        setDisplayState('progress')
        setSelectedInstance(instance)
    }

    useEffect(() => {
        // End progress bar
        if (progressComplete && !!selectedInstance) {
            let pg = document.querySelector('.progress-container')
            let pgSpan = document.querySelector('.progress-container span')
            pg.classList.add('success')
            pgSpan.innerText = 'Success!'

            if (!!window.RETURN_URL) {
                // add a ? or & depending on window.RETURN_URL already containing query params
                const separator = window.RETURN_URL.includes('?') ? '&' : '?'
                // encode the url
                const url = encodeURI(selectedInstance.embed_url)
                // redirect the client to the return url with our new variables
                window.location = `${window.RETURN_URL}${separator}embed_type=basic_lti&url=${url}`
            }
        }
        // Start progress bar
        else if (!!selectedInstance) {

            const easterModeListener = document.addEventListener('keyup', (event) => {
                if (event.key == 'Shift') {
                    setEasterMode(true)
                }
            })

            let stops = []
            let total = 0
            let stop = 0;

            // Create random stop points, each greater than the previous
            while (total < 100) {
                stop = Math.random() * 10 + stop
                stops.push(stop + total)
                total += stop
            }
            stops[stops.length - 1] -= (total - 100);

            let i = 0;

            // Progress bar increments every second
            const fillInterval = setInterval(() => {
                fillRef.current.style.width = `${stops[i++]}%`
                if (i == stops.length) {
                    clearInterval(fillInterval)
                    fillRef.current.style.width = '100%'
                    setProgressComplete(true)
                }
            }, 1000)

            return () => {
                clearInterval(fillInterval);
                document.removeEventListener("keyup", easterModeListener)
            };
        }
    }, [selectedInstance, progressComplete])

    let instanceList = null
    if (state.instances && state.instances.length > 0) {
        instanceList = state.instances.map((instance, index) => {
            var classList = []
            if (instance.draft) classList.push('draft')
            if (instance.selected) classList.push('selected')
            if (instance.guest_access) classList.push('guest')
            if (hiddenSet.has(instance.id)) classList.push('hidden')

            return <li className={classList.join(' ')} key={index}>
                <div className="widget-info">
                    <img className="widget-icon" src={instance.img}/>
                    <h2 className="searchable">{instance.name}</h2>
                    <h3 className="searchable">{instance.name}</h3>
                    {instance.guest_access ? <h3 className="guest-notice">Guest instances cannot be embedded in courses.</h3> : <></>}
                    {instance.is_draft ? <span className="draft-label">Draft</span> : <></>}
                    {instance.guest_access && !instance.is_draft ? <span className="draft-label">Guest</span> : <></>}
                </div>
                <a className="preview external" target="_blank" href={instance.preview_url}>Preview</a>
                {
                    (instance.guest_access || instance.is_draft) ?
                    <a className="button embed-button" target="_blank" href={instance.edit_url}>Edit at Materia</a>
                    :
                    <a role="button" className={index == 0 ? 'first button embed-button' : 'button embed-button'} onClick={() => embedInstance(instance)}>Use this widget</a>
                }
            </li>
        })
    }

    let noInstanceRender = null
    let createNewInstanceLink = null
    if (state.instances && state.instances.length < 1) {
        noInstanceRender = <div id="no-widgets-container">
            <div id="no-instances">
                You don't have any widgets yet. Click this button to create a widget, then return to this tab/window and select your new widget.
                <a role="button" id="create-widget-button" onClick={() => setShowRefreshArrow(true)} className="button" target="_blank" href={window.BASE_URL + "/widgets"}>Create a widget at Materia</a>
            </div>
        </div>
    } else {
        createNewInstanceLink = <a id="goto-new-widgets" onClick={() => setShowRefreshArrow(true)} className="external" target="_blank" href={window.BASE_URL + "widgets"}>Or, create a new widget at Materia</a>
    }

    let sectionRender = null
    if (displayState == 'selectInstance') {
        sectionRender =
        <section id="select-widget">
            <input type="text" id="search" value={searchText} onChange={handleChange}/>
            <button id="refresh" onClick={refreshListing} className="button" >Refresh listing</button>
            <div id="list-container">
                <ul>
                    {instanceList}
                </ul>
                {noInstanceRender}
            </div>
            {createNewInstanceLink}
        </section>
    } else if (displayState == 'progress') {
        sectionRender = <section id="progress">
            <div className="widget-info">
                <h1>{selectedInstance.name}</h1>
                <img className="widget-icon" src={selectedInstance.img}/>
            </div>
            <div className="progress-container">
                <span>{!easterMode ? "Connecting your instance..." : "Reticulating splines..."}</span>
                <div className="progressbar">
                    <div className="fill" ref={fillRef}></div>
                </div>
            </div>

            <a role="button" className="button cancel-button" onClick={cancelProgress}>Cancel Changing Widget</a>
        </section>
    }

    let refreshArrow = null
    if (showRefreshArrow) refreshArrow = <div className="qtip right lti">Click to see your new widget</div>

    return (
        <div>
            <header>
                <h1>{strHeader}</h1>
                <div id="logo"></div>
            </header>
            {sectionRender}
            {refreshArrow}
        </div>
    )
}

export default SelectItem
