import React, { useState, useRef, useEffect } from 'react'
import { useQuery } from 'react-query'
import { apiGetWidgetInstance, apiGetUser} from '../util/api'
import useCopyWidget from './hooks/useSupportCopyWidget'
import SupportSearch from './support-search'
import SupportSelectedInstance from './support-selected-instance'
import Header from './header'
import './support-page.scss'

const SupportPage = () => {
	const [selectedInstance, setSelectedInstance] = useState(null)
	const [copyId, setCopyId] = useState(null)
	const copyWidget = useCopyWidget()
	const mounted = useRef(false)
	const { data: currentUser} = useQuery({
		queryKey: 'user',
		queryFn: apiGetUser,
		staleTime: Infinity
	})
	const { data: copyInst } = useQuery({
		queryKey: [`copy-widget`, copyId],
		queryFn: () => apiGetWidgetInstance(copyId),
		enabled: copyId !== null,
		staleTime: Infinity
	})

	useEffect(() => {
    mounted.current = true
    return () => (mounted.current = false)
	}, [])

	// Sets the current instance when the copied widget's data is fetched
	useEffect(() => {
		if (copyId && !!copyInst && copyId === copyInst.id) {
			setSelectedInstance(copyInst)
		}
	}, [JSON.stringify([copyInst])])

	const onCopy = (instId, title, copyPerms, inst) => {
		copyWidget.mutate({
			instId: instId,
			title: title,
			copyPermissions: copyPerms,
			dir: inst.widget.dir,
			successFunc: (newInst) => {
				if (mounted.current) {
					setCopyId(newInst)
				}
			}
		})
	}

	return (
		<>
			<Header />
			<div className="support-page">
				<div>
					{ !selectedInstance
					? <SupportSearch 
							onClick={(inst) => setSelectedInstance(inst)}/>
					: <SupportSelectedInstance
							key={selectedInstance ? selectedInstance.id : ''}
							inst={selectedInstance}
							currentUser={currentUser}
							onReturn={() => {setSelectedInstance(null)}}
							onCopy={onCopy}/>
					}
				</div>
			</div>
		</>
	)
}

export default SupportPage
