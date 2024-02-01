import { useMutation } from 'react-query'
import { apiGetQuestionSet } from '../../util/api'

export default function useExportQset() {
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

    const exportConditional = async (asset_type, inst, onError) => {
        try {
            if (asset_type === 'qset') {
                await exportQset.mutateAsync({
                    args: inst.id,
                    errorFunc: onError
                });
            } else if ((asset_type === 'all' || asset_type === 'media')) {
                const apiEndpoint = asset_type === 'all' ? `/widgets/export/${inst.id}` : `/widgets/export/${inst.id}/media`;

		        const condenseName = inst.name.replace(/[^a-zA-Z0-9]/g, '_')

                const a = document.createElement('a');
                a.href = apiEndpoint;
                a.download = `${condenseName}.zip`;
                a.click();
            }
        } catch (error) {
            onError(error);
        }
    };

    return { exportConditional, exportQset }
}