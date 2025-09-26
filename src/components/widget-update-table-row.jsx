import React from "react";

const WidgetUpdateTableRow = ({ widget, newVer, onUpdate, updateState }) => {
  let updateButtonText = "Unknown State"
  if (updateState === "available") {
    updateButtonText = "Update"
  } else if (updateState === "updating") {
    updateButtonText = "Updating..."
  } else if (updateState === "updated") {
    updateButtonText = "Updated!"
  } else if (updateState === "error") {
    updateButtonText = "Failed"
  }

  return (
    <tr>
      <td>
        <div className="widget_name">
          <img src={widget.icon} alt={`${widget.name} icon`} />
          <b>{widget.name}</b>
        </div>
      </td>
      <td>{widget.meta_data.version}</td>
      <td>{newVer}</td>
      <td>
        <button
          className="action_button"
          onClick={onUpdate}
          disabled={updateState !== "available"}
          key={updateState}  // a bit hacky way to force no transition between disabled and enabled
          style={{ width: '150px' }}  // consistent width w different texts
        >
          {updateButtonText}
        </button>
      </td>
    </tr>
  )
}

export default WidgetUpdateTableRow
