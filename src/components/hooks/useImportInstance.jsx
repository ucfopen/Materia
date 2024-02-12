import { useMutation, useQueryClient } from 'react-query'
import { apiImportInstance } from '../../util/api'

export default function useImportInstance() {
    const queryClient = useQueryClient()

    const importInstanceMutation = useMutation(
        apiImportInstance,
        {
			onMutate: async inst => {
				await queryClient.cancelQueries('widgets', { exact: true, active: true, })
				const previousValue = queryClient.getQueryData('widgets')

				// dummy data that's appended to the query cache as an optimistic update
				// this will be replaced with actual data returned from the API
				const newInst = {
					id: 'tmp',
					widget: {
						name: inst.widgetName,
						dir: inst.dir
					},
					name: inst.title,
					is_draft: false,
					is_fake: true
				}

				// setQueryClient must treat the query cache as immutable!!!
				// previous will contain the cached value, the function argument creates a new object from previous
				queryClient.setQueryData('widgets', (previous) => ({
					...previous,
					pages: previous.pages.map((page, index) => {
						if (index == 0) return { ...page, pagination: [ newInst, ...page.pagination] }
						else return page
					}),
					modified: Math.floor(Date.now() / 1000)
				}))

				return { previousValue }
			},
            onSuccess: (data, variables) => {
                if (data.type === 'error') {
                    // remove this when API error handling PR is merged
                    variables.errorFunc(data)
                    return
                }
				// update the query cache, which previously contained a dummy instance, with the real instance info
				queryClient.setQueryData('widgets', (previous) => ({
					...previous,
					pages: previous.pages.map((page, index) => {
						if (index == 0) return { ...page, pagination: page.pagination.map((inst) => {
							if (inst.id == 'tmp') inst = data
							return inst
						}) }
						else return page
					}),
					modified: Math.floor(Date.now() / 1000)
				}))
                console.log(variables)
                variables.successFunc(data)
            },
            onError: (err, variables, context) => {
                variables.errorFunc(err)
            }

        }
    )

    const importInstance = async (onSuccess, onError) => {
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
                        is_draft: true,
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