import type { Row} from "../utils/interface";
import { createReadStream} from "fs";
import axios from "axios";
import { load} from "cheerio";
import { createObjectCsvWriter} from "csv-writer";
import CsvReadableStream from "csv-reader";
import { eachLimit} from "async";
import { cleaner} from "../utils/textCleaner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let csvWriter: any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getArticleDetail = async ( day: Row, tries: number): Promise<any> => {
	if( !day.link) return;
	
	const link = day.link.substring( 20);
	console.info( "Scraping Article:", link.length > 60 ? `${ link.substring( 0, 60)}...` : link);
	
	let res;
	try {
		res = await axios.get( day.link);
	} catch( err) {
		if( tries < 3) {
			console.error( `axios error - retrying [${ tries + 1}/3]...`);
			return await getArticleDetail( day, tries + 1);
		}
		console.error( "retry limit exceeded - aborting...");
		return;
	}

	const $ = load( res.data);

	const assetType = $( "meta[property=\"AssetType\"]").attr()?.content || "";
	const nodeId = $( "meta[property=\"pageNodeId\"]").attr()?.content || "";
	const title = $( "meta[property=\"og:title\"]").attr()?.content || "";
	const description = $( "meta[property=\"og:description\"]").attr()?.content || "";
	const dateCreated = $( "meta[itemprop=\"dateCreated\"]").attr()?.content || "";
	const keywords = $( "meta[itemprop=\"keywords\"]").attr()?.content || "";
	const tags = $( "meta[property=\"article:tag\"]")
		.map( ( i, el) => $( el).attr()?.content || "")
		.toArray()
		.join( ",");	
	const articleHeader = $( ".ArticleHeader-eyebrow").text();
	const keyPoints = $( ".RenderKeyPoints-list > div > div> ul > li")
		.map( ( i, el) => $( el).text() || "")
		.toArray()
		.join( ",");

	csvWriter.writeRecords( [ {
		nodeId: cleaner( nodeId),
		publishedDate: cleaner( dateCreated),
		assetType: cleaner( assetType),
		articleHeader: cleaner( articleHeader),
		title: cleaner( title),
		description: cleaner( description),
		keywords: cleaner( keywords),
		tags: cleaner( tags),
		keyPoints: cleaner( keyPoints)
	}]);
};

const getArticle = async ( day: Row) => getArticleDetail( day, 0);

const main = async ( year: number, file: string) => {
	console.info( `Starting Job : Scrape Article Detail of ${ year} ...`);

	const articles: Row[] = [];

	const inputStream = createReadStream( `data/cnbc/${ file}`, "utf-8");

	csvWriter = createObjectCsvWriter( {
		path: `data/cnbc/articleDetail-${ year}-${ Date.now()}.csv`,
		header: [
			{ id: "nodeId", title: "nodeId"},
			{ id: "publishedDate", title: "publishedDate"},
			{ id: "assetType", title: "assetType"},
			{ id: "articleHeader", title: "articleHeader"},
			{ id: "title", title: "title"},
			{ id: "description", title: "description"},
			{ id: "keywords", title: "keywords"},
			{ id: "tags", title: "tags"},
			{ id: "keyPoints", title: "keyPoints"},
		],
		fieldDelimiter: ";"
	});

	inputStream
		.pipe( new CsvReadableStream( {
			asObject: true,
			trim: true,
			skipEmptyLines: true
		}))
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		.on( "data", ( row: any) => {
			articles.push( row);
		})
		.on( "end", async () => {
			await eachLimit( articles, 24, getArticle);
			console.info( "Jon Finished!");
		});

};

export default main;