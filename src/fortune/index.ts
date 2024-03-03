import axios from "axios";
import { createObjectCsvWriter} from "csv-writer";

const type = parseInt( process.argv[ 2]);
let page = parseInt( process.argv[ 3]);

let name = "latest";
let path = "latest/all";

switch( type) {
case 1:
	name = "tech";
	path = "section/tech";
	break;
case 2:
	name = "finance";
	path = "section/finance";
	break;
case 3:
	name = "leadership";
	path = "section/leadership";
	break;
case 4:
	name = "well";
	path = "section/well";
	break;
}

const csvWriter = createObjectCsvWriter( {
	path: `data/fortune/${ name}-${ Date.now()}.csv`,
	header: [
		{ id: "date", title: "date"},
		{ id: "section", title: "section"},
		{ id: "tag", title: "tag"},
		{ id: "excerpt", title: "excerpt"},
		{ id: "title", title: "title"},
		{ id: "link", title: "link"}
	]
});

const baseUrl = `https://fortune.com/api/page/${ path}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getHeadlines = async ( page: number): Promise<any> => {
	console.info( `Page: ${ page}`);

	const url = `${ baseUrl}/${ page}`;

	let res;

	try {
		res = await axios.get( url);
	} catch( err) {
		console.error( "axios error - retrying...");
		return await getHeadlines( page);
	}

	const data = res.data;

	if( data.length === 0) {
		console.info( "Job Finished!");
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const result = data.map( ( news: any) => {
		return {
			date: news.date,
			section: news.eyebrowSectionLabel.replaceAll( ",", "."),
			tag: news.eyebrowTagLabel.replaceAll( ",", "."),
			excerpt: news.excerpt.replaceAll( ",", "."),
			title: news.title.replaceAll( ",", "."),
			link: news.titleLink
		};
	});

	await csvWriter.writeRecords( result);

	return await getHeadlines( page + 1);
};

( async () => {
	console.info( "Starting Job...");

	if( !page)
		page = 1;
	else
		console.info( "Using Provided argument as Page parameter");

	console.info( `Value of Page Parameter: ${ page}`);

	await getHeadlines( page);
})();