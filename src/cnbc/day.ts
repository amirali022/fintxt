import type { Row} from "../utils/interface";
import { createReadStream} from "fs";
import axios from "axios";
import { Element, load} from "cheerio";
import { createObjectCsvWriter} from "csv-writer";
import CsvReadableStream from "csv-reader";
import { eachSeries} from "async";

const days: Row[] = [];

const getDayList = async ( month: Row) => {
	console.info( `Scraping Days of Month: ${ month.title}...`);
	
	const res = await axios.get( month.link);

	const $ = load( res.data);

	const linkElements = $( ".SiteMapDay-fullDate > ul > li > a");

	const links = linkElements.map( ( i: number, el: Element) => {
		const a = $( el);
		return {
			title: a.text(),
			link: `https:${ a.attr()?.[ "href"]}`
		};
	}).toArray();

	days.push( ...links);
};

const main = async ( year: number, file: string) => {
	console.info( "Starting Job : Scrape Days ...");
	console.info( `Year: ${ year}`);
	
	const csvWriter = createObjectCsvWriter( {
		path: `data/cnbc/y${ year}-d-${ Date.now()}.csv`,
		header: [
			{ id: "title", title: "title"},
			{ id: "link", title: "link"}
		]
	});

	const months: Row[] = [];

	const inputStream = createReadStream( `data/cnbc/${ file}`, "utf-8");

	inputStream
		.pipe( new CsvReadableStream( { asObject: true}))
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		.on( "data", ( row: any) => {
			months.push( row);
		})
		.on( "end", async () => {
			await eachSeries( months, getDayList);
			csvWriter.writeRecords( days);
		});

	console.log( "Jon Finished!");
};

export default main;