Namespace('Materia.Set').Throbber = do ->
	startSpin = (element, opts) -> $(element).spin(opts);
	stopSpin = (element) -> $(element).spin(false);

	startSpin : startSpin,
	stopSpin : stopSpin,