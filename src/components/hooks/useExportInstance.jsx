import { useMutation } from 'react-query'
import { apiGetQuestionSet } from '../../util/api'

export default function useExportInstance() {
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

    const exportInstance = async (asset_type, inst_id, onError, timestamp = null) => {
        if (!timestamp) timestamp = Date.now();

        if (asset_type == 'qset') {
            // let's use the available API call to fetch the qset so we have better error handling
            exportQset.mutate({
                instId: inst_id,
                playId: null,
                timestamp: timestamp,
                onError: onError
            })
        } else {
            // use direct download for media
            try {
                const apiEndpoint = asset_type === 'all' ? `/widgets/export/${inst_id}/all/${timestamp}` : `/widgets/export/${inst_id}/media/${timestamp}`;

                const a = document.createElement('a');
                a.href = apiEndpoint;
                a.download = `${asset_type}.zip`;
                a.click();
            } catch (error) {
                onError(error);
            }
        }
    };

    return exportInstance
}