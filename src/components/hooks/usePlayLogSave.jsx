import { useMutation } from 'react-query'
import { apiSavePlayLogs } from '../../util/api'

export default function usePlayLogSave() {
	return useMutation(
		apiSavePlayLogs,
		{
			onSettled: (data, error, widgetData) => {
				if (!!data) {
					widgetData.successFunc(data)
				}
				else {
					widgetData.failureFunc()
				}
			}
		}
	)
}
