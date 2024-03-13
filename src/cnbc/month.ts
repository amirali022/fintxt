import axios from "axios";
import { Element, load} from "cheerio";
import { createObjectCsvWriter} from "csv-writer";

const baseUrl = "https://www.cnbc.com/site-map/articles";

const getMonthList = async ( year: number) => {
	const res = await axios.get( `${ baseUrl}/${ year}/`);

	const $ = load( res.data);

	const linkElements = $( ".SiteMapMonth-monthData > ul > li > a");

	const links = linkElements.map( ( i: number, el: Element) => {
		const a = $( el);
		return {
			title: a.text(),
			link: `https:${ a.attr()?.[ "href"]}`
		};
	}).toArray();

	return links;
};

const main = async ( year: number) => {
	console.info( "Starting Job : Scrape Month ...");
	console.info( `Year: ${ year}`);
	
	const csvWriter = createObjectCsvWriter( {
		path: `data/cnbc/${ year}-m-${ Date.now()}.csv`,
		header: [
			{ id: "title", title: "title"},
			{ id: "link", title: "link"}
		]
	});

	const links = await getMonthList( year);

	csvWriter.writeRecords( links);

	console.info( "Jon Finished!");
};

export default main;