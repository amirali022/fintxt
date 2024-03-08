import month from "./month";
import day from "./day";
import articleList from "./articleList";

const op = parseInt( process.argv[ 2]);
const year = parseInt( process.argv[ 3]);
const input = process.argv[ 4];

( async () => {
	switch( op) {
	case 0:
		await month( year);
		break;
	case 1:
		await day( year, input);
		break;
	case 2:
		await articleList( year, input);
		break;
	}
})();