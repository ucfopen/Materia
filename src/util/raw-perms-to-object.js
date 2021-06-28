import { access } from '../components/materia-constants'

const rawPermsToObj = ([permCode = access.VISIBLE, expireTime = null], isEditable) => {
	permCode = parseInt(permCode, 10)
	return {
		accessLevel: permCode,
		expireTime,
		editable: permCode > access.VISIBLE && (parseInt(isEditable, 10) === 1),
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