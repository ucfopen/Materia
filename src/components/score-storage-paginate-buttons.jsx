import React, { useState, useEffect } from 'react'
import "./my-widgets-settings-dialog.scss"

const PaginateButtons = ({state, setState, searchInput}) => {
	const [paginateBtns, setPageinateBtns] = useState([])
	const [footerText, setFooterText] = useState("")
	const MAX_ROWS = 100

	useEffect(() => {
		let pagesArr = state.pages?.map((val, index) => {
			return(<a className={`paginate_button ${index === state.pageNumber ? 'current' : ''}`}
				aria-controls="DataTables_Table_1"
				tabIndex="0"
				onClick={() => {onChangePageNumber(index)}}
				key={index}>
				{index+1}
			</a>)
		})

		// Compresses the buttons
		if (pagesArr.length > 7) {
			const paginateIconL = <span className="ellipsis" key={999}>…</span>
			const paginateIconR = <span className="ellipsis" key={888}>…</span>
			const curPage = state.pageNumber + 1
			const numPages = pagesArr.length
			let paginateType = numPages - curPage >= 4 ?  
				(curPage <= 4 ? 
					"left" : 
					"middle") :
				"right"

			switch(paginateType) {
				case "right":
					pagesArr = [pagesArr[0]].concat(paginateIconR).concat(pagesArr.slice(pagesArr.length - 5, pagesArr.length))
					break
				case "middle":
					pagesArr = [pagesArr[0]].concat(paginateIconL).concat(pagesArr.slice(curPage - 2, curPage + 1)).concat(paginateIconR).concat(pagesArr[pagesArr.length - 1])
					break
				case "left":
					pagesArr = pagesArr.slice(0, 5).concat(paginateIconL).concat(pagesArr[pagesArr.length - 1])
					break
			}
		}

		setPageinateBtns(pagesArr)
	}, [state, searchInput])

	// Sets the paginated rows and footer text
	useEffect(() => {
		if (state.isLoading === false)
		{
			let text = !state.isFiltered && searchInput.length == 0 ? 
				`Showing ${Math.min(state.storageData?.length, state.startIndex + 1)} to ${Math.min(state.storageData?.length, state.endIndex)} of ${Math.min(state.storageData?.length, MAX_ROWS)} entries` :
				`Showing ${Math.min(state.storageData?.length, state.startIndex + 1)} to ${Math.min(state.storageData?.length, state.endIndex)} of 
				${state.storageData?.length} entries (filtered from ${Math.min(state.totalEntries, MAX_ROWS)} total entries)`
				
			setFooterText(text)
		}
	}, [state.isLoading,
		state.isFiltered,
		searchInput,
		JSON.stringify(state.storageData),
		state.startIndex,
		state.endIndex,
		state.totalEntries,
	])

	const onChangePageNumber = (newPageNum) => {
		const _startIndex = Math.min(state.storageData?.length, newPageNum*state.rowsPerPage)
		const _endIndex = Math.min (state.storageData?.length, (newPageNum + 1)*state.rowsPerPage)
		const _selectedValues = state.storageData?.slice(_startIndex, _endIndex)
		setState({...state, startIndex: _startIndex, endIndex: _endIndex, selectedValues: _selectedValues, pageNumber: newPageNum})
	}

	return (
		<div className="data_tables_info_holder">
			<div className="data_tables_info"
				role="status"
				aria-live="polite">
				{footerText}
			</div>
			<div className="data_tables_paginate" id="DataTables_Table_1_paginate">
				<a className={`paginate_button previous ${state.pageNumber - 1 < 0 ? 'disable' : ''}`}
					aria-controls="DataTables_Table_1"
					tabIndex="0"
					id="DataTables_Table_1_previous"
					onClick={() => {
						if (state.pageNumber - 1 >= 0) onChangePageNumber(state.pageNumber - 1)
					}}>
					Previous
				</a>
				<span>
					{
						paginateBtns
					}
				</span>
				<a className={`paginate_button next ${state.pageNumber + 1 >= state.pages?.length ? 'disable' : ''}`}
					aria-controls="DataTables_Table_1"
					tabIndex="0"
					id="DataTables_Table_1_next"
					onClick={() => {
						if (state.pageNumber + 1 < state.pages?.length) onChangePageNumber(state.pageNumber + 1)
					}}>
					Next
				</a>
			</div>
		</div>
	)
}

export default PaginateButtons
