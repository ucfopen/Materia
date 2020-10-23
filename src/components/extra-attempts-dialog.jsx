import React, { useEffect, useState } from 'react'
import Modal from './modal'
import fetchOptions from '../util/fetch-options'
import './extra-attempts-dialog.scss'

// note: this module is originally intended for the admin panel 
// and does not check user permissions

const searchUsers = (input) => fetch('/api/json/users_search', fetchOptions({body: `data=${encodeURIComponent(JSON.stringify([input]))}`}))
const getExtraAttemptsForInstance = (instId) => fetch(`/api/admin/extra_attempts/${instId}`)

const ExtraAttemptsRow = ({}) => {

}

const ExtraAttemptsDialog = ({onClose, inst}) => {
	const [searchText, setSearchText] = useState('')
	const [lastSearch, setLastSearch] = useState('')
	const [searchResults, setSearchResults] = useState([])
	const [extraAttempts, setExtraAttempts] = useState([])

	useEffect(
		() => {
			getExtraAttemptsForInstance(inst.id)
			.then(resp => {
				if(resp.status != 200) return []
				return resp.json()
			})
			.then(resp => setExtraAttempts(resp))
		}, [inst]
	)

	useEffect(
		() => {
			if(searchText !== lastSearch)
			{
				setLastSearch(searchText)
				
				if(searchText === '') 
				{
					setSearchResults([])
				}
				else 
				{
					// setIsSearching(true)
					searchUsers(searchText)
					.then(resp => {
						// no content
						if(resp.status == 204) return []
						return resp.json()
					})
					.then(results => 
						{
							//filter out users who are not students
							setSearchResults(results.filter(
								user => {
									return user.is_student == true
							}))
						})
				}
			}
		}, [searchText]
	)

	return (
		<Modal onClose={onClose}>
			<div className="extraAttemptsModal">
				<span className="title">Give Students Extra Attempts</span>
				<div className="attempts-container">
					<div className="search-container">
						<span className="search-title">Add students:</span>
						<input
							tabIndex="0"
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							type="text"
							placeholder="Enter a Materia user's name or e-mail"
							className="attempts-input"/>
						<div>
							{ searchResults.length !== 0
								? <div className="attempts_search_list">
									{searchResults.map((match) => 
										<div
											key={match.id}
											className='attempts_search_match clickable'
											onClick={() => onClickMatch(match)}>
												<img className="attempts_match_avatar" src={match.avatar} />
												<p className={`attempts_match_name ${match.is_student ? 'attempts_match_student' : ''}`}>{match.first} {match.last}</p>
										</div>
									)}
									</div>
								: null
							}

							<div className="attempts_list">

							</div>
						</div>
					</div>
				</div>
			</div>
		</Modal>
	)
}

export default ExtraAttemptsDialog