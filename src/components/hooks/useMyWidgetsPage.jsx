import { useQuery } from 'react-query'
import { apiGetWidgetInstances, apiGetUser, apiGetUserPermsForInstance } from '../../util/api'

// Helper function to sort widgets
const _compareWidgets = (a, b) => { return (b.created_at - a.created_at) }


/**
 * It returns an object with a user property that is the result of the apiGetUser function
 * @returns An object with a user property.
 */
export const getUser = () => {
  const { data: user } = useQuery({
    queryKey: 'user',
    queryFn: apiGetUser,
    staleTime: Infinity
  })

  return user
}


/**
 * It returns a list of users who have permissions to the selected instance
 * @param {object} state
 * @returns An object with a key of permUsers and a value of the data returned from the query.
 */
export const getPermUsers = (state) => {
  const { data: permUsers } = useQuery({
    queryKey: ['user-perms', state.selectedInst?.id],
    queryFn: () => apiGetUserPermsForInstance(state.selectedInst?.id),
    enabled: !!state.selectedInst && !!state.selectedInst.id && state.selectedInst?.id !== undefined,
    placeholderData: null,
    staleTime: Infinity
  })

  return permUsers
}


/**
 * It fetches the next page of widget instances from the API, and appends them to the current list of
 * widgets
 * @param {int} page
 * @param {function} setPage
 * @param {bool} widgetCopy
 * @param {function} setWidgetCopy
 * @param {bool} widgetDelete
 * @param {function} setWidgetDelete
 * @param {array} widgetsList
 * @param {function} setWidgetsList
 */
export const getWidgetInstances = (
  page, setPage,
  widgetCopy, setWidgetCopy,
  widgetDelete, setWidgetDelete,
  widgetsList, setWidgetsList) => {

  const { data, isLoading, isFetching, refetch } = useQuery(
    'widgets',
    () => apiGetWidgetInstances(page),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (widgetCopy == true) { setWidgetCopy(false) }
        else {

          if (page <= data.total_num_pages && !widgetCopy) {
            setWidgetsList(current => [...current, ...data.pagination].sort(_compareWidgets))

          } else { //
            if (!widgetDelete) {
              let temp = widgetsList
              temp.unshift(data.pagination[0]) // place the new copy inst in the current widgetList.
              setWidgetsList(temp) // no need for sorting since the new copy is appended to the beginning.
              setWidgetDelete(false)
            }
          }
          setPage(page + 1)
        }
      },
    })

  return { data, isFetching, isLoading, refetch }
}