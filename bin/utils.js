const pug = require('pug');
const path = require('path');
const juice = require('juice');
const marked = require('marked');
const promise = require('bluebird');
const puppeteer = require('puppeteer');
const HtmlDocx = require('html-docx-js');

const fs = promise.promisifyAll( require('fs-extra') );
const parseXmlToJson = promise.promisify( require('xml2js').parseString );

function readXml (filename)
{
	return fs.readFileAsync( filename );
}

function convertXmlToJson (xml)
{
	return parseXmlToJson (xml , { explicitArray: false });
}

function generateLinks ( pAddress, pType, pOpenInNewTab ) 
{
	if ( !pAddress )
		return null;
	
	const link = "<a " + ( pOpenInNewTab ? "target='_blank' " : "" ) + 
			"href='" + ( pType ? pType : "//" ) + pAddress + "'>" + pAddress + "</a>";
	
	return link;
}

function getIndentation ( pString )
{
	const splitString = pString.split('\n');
	
	for ( var i in splitString )
	{
		if ( /^\s+$/.test( splitString[i] ) )
		{
			continue;
		}
		else
		{
			const matches =  /^\s+/.exec( splitString[i] )
			
			return matches && matches[0] ? matches[0].replace( /\r/g, '' )
										 : '';
		}
	}
	
	return '';
}

function convertMarkdownToHtml ( pJSON )
{
	for ( let k in pJSON )
	{
		if ( k === 'description' )
		{
			// https://stackoverflow.com/a/26193642/1583813
			const indentation = getIndentation ( pJSON[k] );
			
			var description;
			
			if ( !! indentation )
			{
				description = pJSON[k].split( '\n' )
				.map( line => line.replace( indentation, '' ) )
				.join( '\n' ).trim();
			}
			else
			{
				description = pJSON[k].trim();
			}		
			
			pJSON[k] = marked( description );
			pJSON[k] = pJSON[k].replace(/{{page-break}}/g, '<div class="page-break"><\/div>');
		}
		else if ( pJSON[k] instanceof Object )
		{
			convertMarkdownToHtml ( pJSON[k] );
		}
	}
}

function hydrateJson (json)
{
	json.resume = (json && json.resume) || {};
		
	json.resume.title = ( json && json.resume && json.resume.title ) || 'Resume';
		
	json.resume.style = (json.resume.style || 'default');
		
	json.resume.cssDirPath = json.resume.cssDirPath || "";
		
	json.resume.newCssPath = path.join( json.resume.cssDirPath, json.resume.style );
		
	json.resume.intro = json.resume.intro || {};
		
	const intro = json.resume.intro;
		
	// https://stackoverflow.com/questions/281264/remove-empty-elements-from-an-array-in-javascript
	const introInfo = [ intro.address, intro.city, 
	generateLinks ( intro.phone, "tel:" ), generateLinks ( intro.email, "mailto:" ), 
	generateLinks ( intro.website, intro.website && 
								   intro.website.indexOf(':') != -1 ? null : 'http://', true  ) 
					  ].filter ( n => n ).join(' | ');
	
	json.resume.intro.info = introInfo;
	
	convertMarkdownToHtml ( json.resume );

	return json;
}

async function createHtmlWithCss (json)
{
	// https://stackoverflow.com/questions/25134232/how-to-properly-render-partial-views-and-load-javascript-files-in-ajax-using-ex
	
	if ( !fs.existsSync(json.resume.newCssPath) )
	{
		fs.mkdirSync(json.resume.newCssPath);
	}
	
	const styleName = json.resume.style;
	
	var renderedHtml = pug.compileFile ( path.join(__dirname, 'styles', styleName, 'resume.pug' ) ) ( json );
	
	const currentWorkingDirectory = process.cwd();
	
	const resumeFileName = currentWorkingDirectory + '/resume.html';

	// copy style files to defined cssPath or default location (inside current directory)
	await fs.writeFileAsync( resumeFileName, renderedHtml );
	
	await fs.copy(path.join(__dirname, 'styles', styleName, 'page.css'), path.join(json.resume.newCssPath, 'page.css'));
	
	await fs.copy(path.join(__dirname, 'styles', styleName, 'print.css'), path.join(json.resume.newCssPath, 'print.css'));
	
	console.log ( 'Resume in HTML format has been generated!' );
	
	return json;
}

function getFileUrl ( relFilePath )
{
	const pathName = path.resolve(relFilePath).replace(/\\/g, '/');
	
	return encodeURI('file://' + pathName);
}

async function createPdf(json) 
{
	const browser = await puppeteer.launch();
    const page = await browser.newPage();
	const fileUrl = getFileUrl( "resume.html" );
	await page.goto( fileUrl );
	
    await page.pdf({path: "Resume.pdf"});
	
	await browser.close();
	
	console.log("Resume in PDF format has been generated!");
	
	return json;
}

async function createDocx (json)
{
	const currentWorkingDirectory = process.cwd();
	
	const resumeFileName = 'resume.html';
	
	const html = await fs.readFileAsync(resumeFileName, 'utf-8');
	
	const css = await fs.readFileAsync( path.join(json.resume.newCssPath, 'print.css'), 'utf-8' );
	
	const inlineCssHtml = juice.inlineContent(html, css);
	
	console.log(inlineCssHtml);
	
	const docx = HtmlDocx.asBlob( inlineCssHtml );

	await fs.writeFileAsync('resume.docx', docx);
	
	console.log("Resume in DOCX format has been generated!");
	
	return json;
}

module.exports = {
	readXml: readXml,
	convertXmlToJson: convertXmlToJson,
	hydrateJson: hydrateJson,
	createHtmlWithCss: createHtmlWithCss,
	createPdf: createPdf,
	createDocx: createDocx
}