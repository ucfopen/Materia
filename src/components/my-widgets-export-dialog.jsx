import React, { useState } from 'react'
import Modal from './modal'
import './my-widgets-export-dialog.scss'
import { useQuery } from 'react-query'
import useExportType from './hooks/useExportType'
import { apiGetAssetIDsForInstance } from '../util/api'

const MyWidgetsExportDialog = ({inst, onClose, onExportFailure}) => {
	const [exportTypeForm, setExportTypeForm] = useState('instance')
	const [exportMediaForm, setExportMediaForm] = useState(false)
	const exportType = useExportType()

	// fetch asset IDs for export
	const { data: assetIDs } = useQuery({
		queryKey: ['widget-assets', inst.id],
		queryFn: () => apiGetAssetIDsForInstance(inst.id, inst.qset ? inst.qset.id : null),
		placeholderData: null,
		enabled: !!inst.id,
		staleTime: Infinity
	})

	const exportHandler = () => {
		if (exportMediaForm && exportTypeForm === 'instance') {
			exportType('instance_and_media', inst.id, onExportFailure)
		}
		else if (exportMediaForm && exportTypeForm === 'qset') {
			exportType('qset_and_media', inst.id, onExportFailure)
		} else if (exportTypeForm === 'qset') {
			exportType('qset', inst.id, onExportFailure)
		} else if (exportTypeForm === 'instance') {
			exportType('instance', inst.id, onExportFailure)
		}
	}

	return (
		<Modal onClose={onClose}>
            <div className='export-dialog'>
                <h2>Export</h2>
                <div className=''>
                    <div className='container'>
                        <div className='options_container'>
                            <label htmlFor="exportType">Export Type: </label>
                            <select id="exportType" name="exportType" onChange={(e) => setExportTypeForm(e.target.value)} defaultValue={exportTypeForm}>
                                <option value="instance">Widget</option>
                                <option value="qset">Questions</option>
                            </select>
                            <p className={exportTypeForm == 'instance' ? 'show input_desc' : 'hidden'}>
                                Exporting the widget will create a zip file containing the widget metadata and its questions.
                            </p>
                            <p className={exportTypeForm == 'qset' ? 'show input_desc' : 'hidden'}>
                                Exporting questions will create a JSON file containing only the questions, which can be imported into an existing widget.
                            </p>
                            <div className={assetIDs && assetIDs.length > 0 ? 'show' : 'hidden'}>
                                <label>
                                    <input type='checkbox'
                                        checked={exportMediaForm}
                                        onChange={() => setExportMediaForm(!exportMediaForm)}
                                    />
                                    Include Media Asset(s)
                                </label>
                                <p className='input_desc'>
                                    Media assets include images and videos uploaded by the user only. Note, these must be uploaded manually inside a widget's editor.
                                </p>
                            </div>
                        </div>
                        <div className='bottom_buttons'>
                            <a className='cancel_button'
                                onClick={onClose}>
                                Cancel
                            </a>
                            <a className='action_button green export_button'
                                onClick={exportHandler}>
                                Export
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
	)
}

export default MyWidgetsExportDialog
