const cleaner = ( txt: string, comma = ",") => {
	return txt
		.trim()
		.replaceAll( ",", comma)
		.replace( ";", " ")
		.replaceAll( "\n", "")
		.replaceAll( "\r\n", "")
		.replaceAll( "\n\r", "")
		.replace( "<.+?>", "");
};

export {
	cleaner
};