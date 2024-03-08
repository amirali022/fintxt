import type { Row} from "../utils/interface";
import { createReadStream} from "fs";
import axios from "axios";
import { Element, load} from "cheerio";
import { createObjectCsvWriter} from "csv-writer";
import CsvReadableStream from "csv-reader";
import { eachSeries} from "async";
import { cleaner} from "../utils/textCleaner";

const csvWriter = createObjectCsvWriter( {
	path: `data/cnbc/a-${ Date.now()}.csv`,
	header: [
		{ id: "title", title: "title"},
		{ id: "link", title: "link"}
	]
});

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
				title: cleaner( a.text()),
				link
			};
	}).toArray();

	csvWriter.writeRecords( links);
};

const main = async ( year: number, file: string) => {
	console.info( "Starting Job : Scrape Articles ...");
	console.info( `Year: ${ year}`);

	const days: Row[] = [];

	const inputStream = createReadStream( `data/cnbc/${ file}`, "utf-8");

	inputStream
		.pipe( new CsvReadableStream( { asObject: true}))
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		.on( "data", ( row: any) => {
			days.push( row);
		})
		.on( "end", async () => {
			await eachSeries( days, getArticleList);
		});

	console.log( "Jon Finished!");
};

export default main;