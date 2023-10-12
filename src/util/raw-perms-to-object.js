import { access } from '../components/materia-constants'

/**
 * It takes a permission code and an editable flag, and returns an object with the permission code, an
 * expiration time, and flags for whether the user can view, copy, edit, delete, and share the file
 * @param {array} array - containing [permCode = access.VISIBLE, expireTime = null]
 * @param {boolean} isEditable - true if the user can edit the permissions of the item
 * @returns An object with the following properties:
 *
 * 	accessLevel: permCode
 *
 * 	expireTime: expireTime
 *
 * 	editable: permCode > access.VISIBLE && isEditable
 *
 * 	shareable: permCode > access.VISIBLE
 *
 * 	can: {
 *
 * 		view: [access.VISIBLE, access.COPY, access.SHARE, access.FULL]
 *
 * }
 */
const rawPermsToObj = ([permCode = access.VISIBLE, expireTime = null], isEditable) => {
	permCode = parseInt(permCode, 10)
	return {
		accessLevel: permCode,
		expireTime,
		editable: permCode > access.VISIBLE && isEditable,
		shareable: permCode > access.VISIBLE, // old, but difficult to replace with can.share :/
		can: {
			view: [access.VISIBLE, access.COPY, access.SHARE, access.FULL, access.SU].includes(permCode),
			copy: [access.COPY, access.SHARE, access.FULL, access.SU].includes(permCode),
			edit: [access.FULL, access.SU].includes(permCode),
			delete: [access.FULL, access.SU].includes(permCode),
			share: [access.SHARE, access.FULL, access.SU].includes(permCode)
		}
	}
}

export default rawPermsToObj