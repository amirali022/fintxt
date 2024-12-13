import type { Row} from "../utils/interface";
import { createReadStream} from "fs";
import axios from "axios";
import { load} from "cheerio";
import { createObjectCsvWriter} from "csv-writer";
import CsvReadableStream from "csv-reader";
import { eachSeries} from "async";
import { cleaner} from "../utils/textCleaner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let csvWriter: any;

const getArticleList = async ( day: Row) => {
	console.info( `Scraping Articles of ${ day.title}...`);
	
	const res = await axios.get( day.link);

	const $ = load( res.data);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const script = ( $( "script").get()[ 1].children[ 0] as any).data as string;

	const start = script.indexOf( "window.__c_data") + "window.__c_data".length + 1;
	const end = script.indexOf( "window.styles") - 2;
	const ROOT_QUERY = JSON.parse( script.slice( start, end)).ROOT_QUERY;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const links = ROOT_QUERY[ Object.keys( ROOT_QUERY)[ 1]].results as any[];

	const result: { title: string; link: string;}[] = [];

	links.forEach( l => {
		if( l.url?.indexOf( "advertorial") === -1 && l.title) {
			result.push( {
				title: cleaner( l.title, "."),
				link: l.url
			});
		}
	});

	console.info( `\tscraped ${ result.length} articles`);

	csvWriter.writeRecords( result);
};

const main = async ( year: number, file: string) => {
	console.info( `Starting Job : Scrape Article List of ${ year} ...`);

	const days: Row[] = [];

	const inputStream = createReadStream( `data/cnbc/${ file}`, "utf-8");

	csvWriter = createObjectCsvWriter( {
		path: `data/cnbc/articlesList-${ year}-${ Date.now()}.csv`,
		header: [
			{ id: "title", title: "title"},
			{ id: "link", title: "link"}
		]
	});

	inputStream
		.pipe( new CsvReadableStream( {
			asObject: true,
			trim: true,
			skipEmptyLines: true
		}))
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		.on( "data", ( row: any) => {
			days.push( row);
		})
		.on( "end", async () => {
			await eachSeries( days, getArticleList);
			console.info( "Jon Finished!");
		});

};

export default main;