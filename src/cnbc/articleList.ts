import type { Row} from "../utils/interface";
import { createReadStream} from "fs";
import axios from "axios";
import { Element, load} from "cheerio";
import { createObjectCsvWriter} from "csv-writer";
import CsvReadableStream from "csv-reader";
import { eachSeries} from "async";
import { cleaner} from "../utils/textCleaner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let csvWriter: any;

const getArticleList = async ( day: Row) => {
	console.info( `Scraping Articles of Date: ${ day.title}...`);
	
	const res = await axios.get( day.link);

	const $ = load( res.data);

	const linkElements = $( ".SiteMapArticleList-articleData > ul > li > a");

	const links = linkElements.map( ( i: number, el: Element) => {
		const a = $( el);
		const link = a.attr()?.[ "href"];

		if( link?.indexOf( "advertorial") === -1) 
			return {
				title: cleaner( a.text(), "."),
				link
			};
	}).toArray();

	csvWriter.writeRecords( links);
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