import axios from "axios";
import { createObjectCsvWriter} from "csv-writer";
import { cleaner} from "../utils/textCleaner";

const type = parseInt( process.argv[ 2]);
let start = parseInt( process.argv[ 3]);

let channel = 72;
let name = "money";

switch( type) {
case 1:
	channel = 1;
	name = "business";
	break;
case 2:
	channel = 21;
	name = "small_business";
	break;
case 3:
	channel = 98;
	name = "realstate";
	break;
}

const csvWriter = createObjectCsvWriter( {
	path: `data/forbes/${ name}-${ Date.now()}.csv`,
	header: [
		{ id: "id", title: "id"},
		{ id: "date", title: "date"},
		{ id: "title", title: "title"},
		{ id: "description", title: "description"}
	],
	fieldDelimiter: ";"
});

const baseUrl = ( start: number) => `https://www.forbes.com/simple-data/chansec/stream/?sourceValue=channel_${ channel}&streamSourceType=channelsection&start=${ start}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getHeadlines = async ( start: number): Promise<any> => {
	console.info( `Start: ${ start}`);

	const url = baseUrl( start);

	let res;

	try {
		res = await axios.get( url);
	} catch( err) {
		console.error( "axios error - retrying...");
		return await getHeadlines( start);
	}

	const data = res.data;

	const news = data.blocks.items;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const result = news.map( ( n: any) => {
		return {
			id: n.id,
			date: new Date( n.date).toISOString(),
			title: cleaner( n.title),
			description: cleaner( n.description)
		};
	});

	await csvWriter.writeRecords( result);


	if( !data.hasMore) {
		console.info( "Job Finished!");
		return;
	}

	return await getHeadlines( start + news.length);
};

( async () => {
	console.info( "Starting Job...");

	if( !start)
		start = 1;
	else
		console.info( "Using Provided argument as Page parameter");

	console.info( `Value of Start Parameter: ${ start}`);

	await getHeadlines( start);
})();