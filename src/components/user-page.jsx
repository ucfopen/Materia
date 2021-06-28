import './user-page.scss'
import { useQuery } from 'react-query'
import { apiGetUser} from '../util/api'
import React from 'react'
import Header from './header'

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
