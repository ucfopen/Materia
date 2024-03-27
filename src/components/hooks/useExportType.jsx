import { useMutation } from 'react-query'
import { apiGetQuestionSet, apiGetWidgetInstance } from '../../util/api'

export default function useExportType() {
	const exportQset = useMutation(
		apiGetQuestionSet,
		{
			onSuccess: (data) => {
                const a = document.createElement('a')
                a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], {type: 'application/json'}))
                a.download = 'qset.json'
                a.click()
			},
            onError: (error, variables) => {
                variables.errorFunc(error)
            }
		}
	)

	const exportInstance = useMutation(
		apiGetWidgetInstance,
		{
			onSuccess: (data) => {
                const a = document.createElement('a')
                a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], {type: 'application/json'}))
                a.download = `${data.clean_name}.json`
                a.click()
			},
            onError: (error, variables) => {
                variables.errorFunc(error)
            }
		}
	)

    const exportType = async (asset_type, inst_id, onError, timestamp = null) => {
        if (!timestamp) timestamp = Date.now();

        switch (asset_type) {
            case 'qset':
                // use the available API call to fetch the qset so we have better error handling
                exportQset.mutate({instId: inst_id, playId: null, timestamp}, {
                    onError: onError
                })
                break;
            case 'instance':
                exportInstance.mutate({instId: inst_id, loadQset: true}, {
                    onError: onError
                })
                break;
            case 'all':
            case 'media':
                // use direct download for media
                try {
                    const apiEndpoint = asset_type === 'all' ? `/widgets/export/${inst_id}/all/${timestamp}`
                    : `/widgets/export/${inst_id}/media/${timestamp}`;

                    const a = document.createElement('a')
                    a.href = apiEndpoint
                    a.download = 'export.zip'
                    a.click()
                } catch (error) {
                    onError(error);
                }
                break;
            default:
                onError('Invalid asset type');
                return;
        }
    };

    return exportType
}