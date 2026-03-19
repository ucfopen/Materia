import React, {useMemo, useRef, useState} from 'react'
import WidgetUpdateTableRow from "@/components/widget-update-table-row";
import {useMutation, useQueryClient} from "react-query";
import {apiCheckAllWidgetsForUpdates, apiInstallWidgetUpdate} from "@/util/api";

const WidgetUpdater = ({ widgets = [], isLoading = true }) => {
  // Keeps track of which widgets are in the process of being updated and which have finished
  const [updateTracker, setUpdateTracker] = useState({})
  const queryClient = useQueryClient()
  const widgetRefetchDebounceTimer = useRef()

  const updateMutation = useMutation(apiCheckAllWidgetsForUpdates, {
    onSuccess: (data) => {
      // Reset update tracker with new data
      const newUpdateTracker = {}
      for (const availableUpdate of data['updates_available'] ?? []) {
        const w = findWidgetById(availableUpdate.widget_id)
        if (w == null) continue
        newUpdateTracker[w.id] = { updateStatus: 'available' }
      }
      setUpdateTracker(newUpdateTracker)

      // Output errors of widgets that could not be checked to console
      for (const entry of data['could_not_check'] ?? []) {
        console.error('Widget update checker:', entry['msg']?.msg)
      }
    }
  })

  const updateIndividualWidgetMutation = useMutation((widgetId) => apiInstallWidgetUpdate(widgetId), {
    onMutate: ((widgetId) => {
      setUpdateTracker((oldUpdateTracker) => {
        const newUpdateTracker = {...oldUpdateTracker}
        newUpdateTracker[widgetId] = { updateStatus: 'updating' }
        return newUpdateTracker
      })
    }),
    onSuccess: ((_, widgetId) => {
      setUpdateTracker((oldUpdateTracker) => {
        const newUpdateTracker = {...oldUpdateTracker}
        newUpdateTracker[widgetId] = { updateStatus: 'updated' }
        return newUpdateTracker
      })
    }),
    onError: ((error, widgetId) => {
      setUpdateTracker((oldUpdateTracker) => {
        const newUpdateTracker = {...oldUpdateTracker}
        newUpdateTracker[widgetId] = { updateStatus: 'error' }
        console.error(`Widget update checker: error updating widget with id '${widgetId}':`, error)
        return newUpdateTracker
      })
    }),
    onSettled: ((_, __, widgetId) => {
      queryClient.refetchQueries(['widget-update-check', widgetId])
      if (widgetRefetchDebounceTimer.current) clearTimeout(widgetRefetchDebounceTimer.current)
      widgetRefetchDebounceTimer.current = setTimeout(() => {
        queryClient.refetchQueries(['widgets'])
      }, 1000)
    })
  })

  const findWidgetById = (id) => {
    const widget = widgets.find((w) => w.id === id)
    if (!widget) {
      console.error(`Widget update checker: could not find widget with id '${id}'.`)
      return null
    }
    return widget
  }

  const updatableWidgetsTableRender = (rows) => {
    return (
      <div className="widget_update_table_container">
        <h3>The following widgets have updates available:</h3>
        <table className="widget_update_table">
          <thead>
          <tr>
            <th>Widget</th>
            <th>Current Version</th>
            <th>Latest Version</th>
            <th></th>
          </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    )
  }

  const updatableWidgetRowsRender = (updatableWidgets) => {
    return updatableWidgets
      .map((availableUpdate) => {
        const widget = findWidgetById(availableUpdate.widget_id)
        if (widget == null) return null
        return (
          <WidgetUpdateTableRow
            key={availableUpdate.widget_id}
            widget={widget}
            newVer={availableUpdate['new_version']}
            onUpdate={() => updateIndividualWidgetMutation.mutate(widget.id)}
            updateState={updateTracker[widget.id]?.updateStatus}
          />
        )
      }).filter((r) => r !== null)
  }

  const erroredUpdatesRender = (erroredWidgets) => {
    const names = erroredWidgets
      .map((entry) => {
        const widget = findWidgetById(entry['widget_id'])
        if (widget == null) return null
        return widget.name
      })
      .filter((n) => n !== null)

    if (names.length === 0) return null

    const s = names.length !== 1 ? 's': ''
    return (
      <div className="update_errors_container">
        <p>Additionally, {names.length} widget{s} could not be checked for updates:</p>
        <ul>
          {names.map((name, i) => <li key={i}>{name}</li>)}
        </ul>
      </div>
    )
  }

  const contentRender = useMemo(() => {
    // Initial 'check updates' button
    if (!updateMutation.data && !updateMutation.isLoading) {
      return (
        <button
          className="action_button"
          key="check"
          onClick={() => updateMutation.mutate()}
        >
          Check for Updates
        </button>
      )
    }

    // Loading state
    else if (updateMutation.isLoading) {
      return (
        <button
          className="action_button"
          key="loading"
          disabled={true}
        >
          Checking for Updates...
        </button>
      )
    }

    // Updates checked but widgets still loading
    else if (updateMutation.data && isLoading) {
      return <p>Loading...</p>
    }

    // Updates checked and valid response received
    else if (updateMutation.data && 'updates_available' in updateMutation.data && 'could_not_check' in updateMutation.data) {
      // Render out each available update as a table row
      const widgetRows = updatableWidgetRowsRender(updateMutation.data['updates_available'])
      const updatesAreAvailable = widgetRows.length !== 0

      // Update all widgets that have not been/have attempted to have been updated yet
      const updateAll = () => {
        Object.entries(updateTracker).forEach(([widgetId, widget]) => {
          if (widget.updateStatus !== 'available') return
          updateIndividualWidgetMutation.mutate(parseInt(widgetId))
        })
      }

      // Disable button if all widgets have been/have attempted to been updated
      const isUpdateAllDisabled = !Object.values(updateTracker).find((widget) => widget.updateStatus === 'available')

      return (
        <>
          {/* Show table of updatable widgets (or lack thereof) */}
          {updatesAreAvailable
            ? updatableWidgetsTableRender(widgetRows)
            : <p>No updates are available.</p>
          }

          {/* Show widgets that errored during update check */}
          {erroredUpdatesRender(updateMutation.data['could_not_check'])}

          {/* Buttons */}
          <div className="buttons">
            <button
              className="action_button"
              onClick={() => updateMutation.mutate()}
            >
              Recheck Updates
            </button>
            {updatesAreAvailable && (
              <button
                className="action_button"
                onClick={updateAll}
                disabled={isUpdateAllDisabled}
              >
                Update All
              </button>
            )}
          </div>
        </>
      )
    }
  }, [isLoading, updateMutation, updateMutation.isLoading, updateTracker, updateIndividualWidgetMutation])

  return (
    <div id="update_area" className="container">
      <section className="page">
        <div className="top">
          <h1>Update Widgets</h1>
        </div>
        <div className="widget_updater_content">
          {contentRender}
        </div>
      </section>
    </div>
  )
}

export default WidgetUpdater
