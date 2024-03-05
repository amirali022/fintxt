import axios from "axios";
import { createObjectCsvWriter} from "csv-writer";
import { cleaner} from "../utils/textCleaner";

const baseUrl = "https://api.stocktwits.com/api/2/streams/trending.json";

const csvWriter = createObjectCsvWriter( {
	path: `data/stocktwits/trending-${ Date.now()}.csv`,
	header: [
		{ id: "id", title: "id"},
		{ id: "created_at", title: "created_at"},
		{ id: "username", title: "username"},
		{ id: "user_id", title: "user_id"},
		{ id: "body", title: "body"},
		{ id: "symbols", title: "symbols"},
		{ id: "likes", title: "likes"},
		{ id: "reshares", title: "reshares"},
		{ id: "sentiment", title: "sentiment"}
	]
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getTweet = async ( max: number): Promise<any> => {
	console.info( `Max: ${ max}`);

	const url = ( max === 0) ? baseUrl : `${ baseUrl}?max=${ max}`;

	let res;
	try {
		res = await axios.get( url);
	} catch( err) {
		console.error( "axios error - retrying...");
		return await getTweet( max);
	}

	const data = res.data;

	if( data.messages.length === 0) {
		console.info( "Job Finished!");
		return;
	}

	const maxCursor = data?.cursor?.max;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const result = data.messages.map( ( msg: any) => {
		return {
			id: msg.id,
			created_at: msg.created_at,
			username: msg.user.username,
			user_id: msg.user.id,
			body: cleaner( msg.body),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			symbols: msg.symbols.map( ( s: any) => s.symbol).join( "|"),
			likes: msg.likes?.total || 0,
			reshares: msg.reshares?.reshared_count || 0,
			sentiment: msg?.entities?.sentiment?.basic || null,
		};
	});

	await csvWriter.writeRecords( result);

	if( maxCursor)
		return await getTweet( maxCursor);
};

let max = parseInt( process.argv[ 2]);

( async () => {
	console.info( "Starting Job...");
	if( !max) {
		max = 0;
	} else {
		console.info( "Using Provided argument as Max parameter");
	}

	console.log( `value of Max parameter: ${ max}`);

	await getTweet( max);
})();