// Creates a nested namespace on window (non-destructive)
//
// Namespace('Some.Nested').wohoo = 5
// creates:
// {
// 	Some: {
// 		Nested: {
//			wohoo: 5
// 		}
// 	}
// }
window.Namespace = ns => {
	let namespaces = ns.split('.')
	let w = window

	namespaces.forEach(namespace => {
		w[namespace] = w[namespace] || {}
		w = w[namespace] // recurse down
	})

	return w
}
