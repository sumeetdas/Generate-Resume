#!/usr/bin/env node

const promise = require('bluebird');
const parseXmlToJson = promise.promisify( require('xml2js').parseString );
const pug = require('pug');
const fs = promise.promisifyAll( require('fs-extra') );
const path = require('path');
const utils = require('./utils');
const generateLinks = utils.generateLinks;
const convertMarkdownToHtml = utils.convertMarkdownToHtml;
const getPdf = utils.getPdf;

// first two arguments are the file path of node.exe (or node.sh) and 
// file path of this bin/index.js file. Hence, we splice the argument list at index 2
const processArguments = process.argv.splice( 2 );

var arguments = [];

if ( processArguments.length >= 1 )
{
	arguments = [ processArguments[0] ];
	
	const filename = arguments[0];
	
	const currentWorkingDirectory = process.cwd();
	
	fs.readFileAsync( filename )
	.then( (xml) => parseXmlToJson (xml , { explicitArray: false }) )
	.then( (json) => {
		
		json.resume.title = ( json && json.resume && json.resume.title ) || 'Resume';
		
		const intro = json && json.resume && json.resume.intro;
		
		// https://stackoverflow.com/questions/281264/remove-empty-elements-from-an-array-in-javascript
		const introInfo = [ intro.address, intro.city, 
		generateLinks ( intro.phone, "tel:" ), generateLinks ( intro.email, "mailto:" ), 
		generateLinks ( intro.website, intro.website && 
									   intro.website.indexOf(':') != -1 ? null : 'http://', true  ) 
						  ].filter ( n => n ).join(' | ');
		
		intro.info = introInfo;
		
		convertMarkdownToHtml ( json && json.resume );
		
		// https://stackoverflow.com/questions/25134232/how-to-properly-render-partial-views-and-load-javascript-files-in-ajax-using-ex
		
		// copy style files to defined cssPath or default location (inside current directory)
		const styleName = (json.resume.style || 'default');
		
		const cssDirPath = json.resume.cssDirPath || "";
		
		json.resume.newCssPath = path.join( cssDirPath, styleName );
		
		if ( !fs.existsSync(json.resume.newCssPath) )
		{
			fs.mkdirSync(json.resume.newCssPath);
		}
		
		console.log(json.resume.newCssPath);
		
		var renderedHtml = pug.compileFile ( path.join(__dirname, 'styles', styleName, 'resume.pug' ) ) ( json );
		
		const resumeFileName = currentWorkingDirectory + '/resume.html';

		fs.writeFileAsync( resumeFileName, renderedHtml )
		.then( () => {
			return fs.copy(path.join(__dirname, 'styles', styleName, 'page.css'), path.join(json.resume.newCssPath, 'page.css'));
		} )
		.then( () => {
			return fs.copy(path.join(__dirname, 'styles', styleName, 'print.css'), path.join(json.resume.newCssPath, 'print.css'));
		} )
		.then( () => {
			console.log ( 'Resume in HTML format has been generated!' );
			
			return getPdf(renderedHtml);
		} )
		.then( () => {
			console.log( "Resume in PDF format has been generated!" );
		} )
		.catch(Error, (e) => console.error(e) );
		
	} )
	.catch( Error, (e) => console.error(e) );
}
else 
{
	const help = [
		'Usage: html-pdf-resume <resume.xml>',
		'e.g.: html-pdf ~/Documents/resume.xml'
	].join('\n');

    console.log(help);
}