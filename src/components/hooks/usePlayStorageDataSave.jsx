import { useMutation } from 'react-query'
import { apiSavePlayStorage } from '../../util/api'

export default function usePlayStorageDataSave() {
	return useMutation(
		apiSavePlayStorage,
		{
			onSettled: (data, error, widgetData) => {
				widgetData.successFunc()
			}
		}
	)
}
