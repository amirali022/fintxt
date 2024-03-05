const cleaner = ( txt: string) => {
	return txt
		.trim()
		.replaceAll( ",", ".")
		.replaceAll( "\n", "")
		.replaceAll( "\r\n", "")
		.replaceAll( "\n\r", "");
};

export {
	cleaner
};