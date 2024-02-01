import { useMutation } from 'react-query'
import { apiUpdateQset } from '../../util/api'

export default function useImportQset() {
    const importQsetMutation = useMutation(apiUpdateQset, {
        onSuccess: (inst, variables) => {
            variables.successFunc(inst)
        },
        onError: (err, variables, context) => {
            variables.errorFunc(err)
        }

    })

    const importQset = async (inst_id, onSuccess, onError) => {
        try {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'application/json'
            input.onchange = e => {
                const file = e.target.files[0]
                const reader = new FileReader()
                reader.onload = e => {
                    const qset = JSON.parse(e.target.result)
                    importQsetMutation.mutate({
                        args: [inst_id, qset],
                        successFunc: onSuccess,
                        errorFunc: onError
                    })
                }
                reader.readAsText(file)
            }
            input.click()
        } catch(err) {
            onError(err)
        }
    }

	return { importQset }
}