import { access } from '../components/materia-constants'

/**
 * Converts a raw permissions object from the API into the schema utilized by various front-end elements
 * Note this is a significant departure from the permissions system used in Materia 10.x and below
 * The can: verbs are simplified based on the two-tier permissions model, but more specificity can be added in the future
 * @param {object} perm
 * @param {boolean} isEditable
 * @returns
 */
const rawPermsToObj = (perm, isEditable) => {
	return {
		userId: perm.user,
		accessLevel: perm.permission,
		expireTime: perm.expires_at ? new Date(perm.expires_at) : null,
		editable: perm.permission != access.VISIBLE && isEditable,
		can: {
			view: true, // implicit with all access types
			copy: true, // implicit with all access types
			edit: perm.permission == access.FULL,
			delete: perm.permission == access.FULL,
			share: perm.permission == access.FULL, // Refers to the ability to share with collaborators
		}
	}
}

export default rawPermsToObj
