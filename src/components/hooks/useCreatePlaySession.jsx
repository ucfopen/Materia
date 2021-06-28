import { useMutation } from 'react-query'
import { apiGetPlaySession } from '../../util/api'


export default function useCreatePlaySession() {
	return useMutation(
		apiGetPlaySession,
		{
			onSettled: (data, error, widgetData) => {
				if (!!data) {
					widgetData.successFunc(data)
				}
				else if (data === null) {
					alert('Error: Widget demo failed to load content : is fatal')
				}
				else {
					console.log(`failed to create play session with data: ${data}`)
				}
			}
		}
	)
}
