import './user-page.scss'
import { useQuery } from 'react-query'
import { apiGetUser} from '../util/api'
import React from 'react'
import Header from './header'

//const fetchCopyInstanceId = (instId, title, copyPermissions) => fetch('/api/json/widget_instance_copy', fetchOptions({body: 'data=' + encodeURIComponent(`["${instId}","${title}","${copyPermissions.toString()}"]`)}))
//const fetchInstance = (instId) => fetch('/api/json/widget_instances_get/', fetchOptions({body: 'data=' + encodeURIComponent(`["${instId}"]`)}))

const SupportPage = () => {
	const { data: currentUser} = useQuery({
		queryKey: 'user',
		queryFn: apiGetUser,
		staleTime: Infinity
	})

	return (
		<>
			<Header />
			<div className="support-page">
				<div>
					{ !selectedInstance
					? <SupportSearch 
							onClick={onSelect}/>
					: <SupportSelectedInstance
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
