#!/usr/bin/env node

const utils = require('./utils');
const readXml = utils.readXml;
const convertXmlToJson = utils.convertXmlToJson;
const hydrateJson = utils.hydrateJson;
const createHtmlWithCss = utils.createHtmlWithCss;
const createPdf = utils.createPdf;
const createDocx = utils.createDocx;

// first two arguments are the file path of node.exe (or node.sh) and 
// file path of this bin/index.js file. Hence, we splice the argument list at index 2
const processArguments = process.argv.splice( 2 );

var arguments = [];

if ( processArguments.length >= 1 )
{
	arguments = [ processArguments[0] ];
	
	const filename = arguments[0];
	
	readXml( filename )
	.then( convertXmlToJson )
	.then( hydrateJson )
	.then( createHtmlWithCss )
	.then( createPdf )
	.then( createDocx )
	.catch( Error, e => console.error(e) );
}
else 
{
	const help = [
		'Usage: html-pdf-resume <resume.xml>',
		'e.g.: html-pdf ~/Documents/resume.xml'
	].join('\n');

    console.log(help);
}