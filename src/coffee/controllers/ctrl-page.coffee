window.Namespace = (ns) ->
	a = ns.split('.')
	o = window
	len = a.length

	for i in [0...len]
		o[a[i]] = o[a[i]] || {}
		o = o[a[i]]
	o

