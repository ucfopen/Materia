import './support-page.scss'
import SupportSearch from './support-search'
import SupportSelectedInstance from './support-selected-instance'
import { useQuery } from 'react-query'
import { apiGetWidget, apiGetUser} from '../util/api'
import useCopyWidget from './hooks/useSupportCopyWidget'
import React, { useState, useRef, useEffect } from 'react'
import Header from './header'

const SupportPage = () => {
	const [selectedInstance, setSelectedInstance] = useState(null)
	const [copyId, setCopyId] = useState(null)
	const { data: currentUser} = useQuery({
		queryKey: 'user',
		queryFn: apiGetUser,
		staleTime: Infinity
	})
	const { data: copyInst } = useQuery({
		queryKey: [`copy-widget`, copyId],
		queryFn: () => apiGetWidget(copyId),
		enabled: copyId !== null,
		staleTime: Infinity
	})
	const copyWidget = useCopyWidget()
	const mounted = useRef(false)

	useEffect(() => {
    mounted.current = true
    return () => (mounted.current = false)
	}, [])

	// Sets the current instance when the copied widget's data is fetched
	useEffect(() => {
		if (copyId && copyInst && copyInst[0] && copyId === copyInst[0].id) {
			setSelectedInstance(copyInst[0])
		}
	}, [JSON.stringify(copyInst)])

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
	
	const onSelect = (inst) => {
		setSelectedInstance(inst)
	}

	return (
		<>
			<Header />
			<div className="support-page">
				<div>
					{ !selectedInstance
					? <SupportSearch 
							onClick={onSelect}/>
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
