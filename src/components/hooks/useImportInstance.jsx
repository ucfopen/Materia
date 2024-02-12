import { useMutation } from 'react-query'
import { apiImportInstance } from '../../util/api'

export default function useImportInstance() {
    const importInstanceMutation = useMutation(
        apiImportInstance,
        {
            onSuccess: (inst, variables) => {
                if (inst.type === 'error') {
                    // remove this when API error handling PR is merged
                    variables.errorFunc(inst)
                    return
                }
                console.log(variables)
                variables.successFunc(inst)
            },
            onError: (err, variables, context) => {
                variables.errorFunc(err)
            }

        }
    )

    const importInstance = async (inst_id, onSuccess, onError) => {
        try {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'application/json'
            input.onchange = e => {
                const file = e.target.files[0]
                const reader = new FileReader()
                reader.onload = e => {
                    const instance = JSON.parse(e.target.result)
                    importInstanceMutation.mutate({
                        widget_id: instance.widget.id,
                        name: instance.name,
                        qset: instance.qset,
                        is_draft: true
                    },
                    {
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

	return importInstance
}