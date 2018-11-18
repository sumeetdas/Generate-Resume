const marked = require('marked');
const puppeteer = require('puppeteer');
const path = require('path');

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

function generateLinks ( pAddress, pType, pOpenInNewTab ) 
{
	if ( !pAddress )
		return null;
	
	const link = "<a " + ( pOpenInNewTab ? "target='_blank' " : "" ) + 
			"href='" + ( pType ? pType : "//" ) + pAddress + "'>" + pAddress + "</a>";
	
	return link;
}

// https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
// Answer: https://stackoverflow.com/a/37164538/1583813
function isObject(item) 
{
  return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
}

// return immutable object
function mergeDeep(target, source) 
{
  let output = Object.assign({}, target);

  if ( isObject(target) && isObject(source) ) 
  {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) 
	  {
        if ( !(key in target) )
		{
			Object.assign(output, { [key]: source[key] });
		}
        else 
		{
			output[key] = mergeDeep(target[key], source[key]);
		}
      } 
	  else 
	  {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function getFileUrl ( relFilePath )
{
	const pathName = path.resolve(relFilePath).replace(/\\/g, '/');
	
	return encodeURI('file://' + pathName);
}

async function getPdf() 
{
	const browser = await puppeteer.launch();
    const page = await browser.newPage();
	const fileUrl = getFileUrl( "resume.html" );
	await page.goto( fileUrl );
	await page.screenshot({path: 'example.png'});

    return page.pdf({path: "Resume.pdf"});
}

module.exports = {
	convertMarkdownToHtml: convertMarkdownToHtml,
	generateLinks: generateLinks,
	getPdf: getPdf
}