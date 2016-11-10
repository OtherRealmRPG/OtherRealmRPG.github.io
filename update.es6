var marked = require( './marked.min.js' );
var fs = require( 'fs' );

// ======================================== //
// config
// ======================================== //

// Template file path.
var TEMPLATE = 'template.html';

// Markdown directory.
var SRC_DIR = 'src';

// Output directory.
var DST_DIR = 'page';

// marked config.
marked.setOptions( {
	renderer: new marked.Renderer(),
	gfm: true,
	tables: true,
	breaks: false,
	pedantic: false,
	sanitize: false,
	smartLists: true,
	smartypants: false,
} );

// ======================================== //
// data
// ======================================== //

var template = [];

// ======================================== //
// function
// ======================================== //

function isFile( path ) {
	try {
		return fs.statSync( path ).isFile();
	} catch ( e ) {
		return false;
	}
}

function readDir( path ) {
	return new Promise( ( resolve, reject ) => {
		fs.readdir( path, ( error, files ) => {
			if ( error ) { return reject( { error: error, type: 'read directory', path: path } ); }
			resolve( files || [] );
		} );
	} );
}

function makeDir( path ) {
	return new Promise( ( resolve, reject ) => {
		fs.mkdir( path, ( error ) => {
			if ( error && error.code !== 'EEXIST' ) {
				return reject( { error: error, type: 'make directory', path: path } );
			}
			resolve( { esists: !!error } );
		} );
	} );
}

function getTitle( md ) {
	var line = md.split( /\r\n|\n|\r/ );
	for ( var i = 0 ; i < line.length ; ++i ) {
		if ( line[ i ].match( /^\# .*$/ ) ){ return line[ i ].replace( '# ', '' ); }
	}
	return '';
}

function readMarkdown( path ) {
	return new Promise( ( resolve, reject ) => {
		fs.readFile( path, ( error, data ) => {
			if ( error ) {
				return reject( { error: error, type: 'read markdown', path: path } );
			}
			var md = data.toString();
			var title = getTitle( md );
			resolve( { html: marked( md ), title: title } );
		} );
	} );
}

function loadMenu( path ) {
	while ( path && !isFile( path + '/_menu.md' ) ) {
		path = path.replace( /\/[^\/]*$/, '' );
	}
	if ( !path ){ return Promise.resolve( '' ); }
	return new Promise( ( resolve, reject ) => {
		fs.readFile( path + '/_menu.md', ( error, data ) => {
			if ( error ) {
				return reject( { error: error, type: 'load menu', path: path } );
			}
			resolve( marked( data.toString() ) );
		} );
	} );
}

function writeHTML( path, md ) {
	return new Promise( ( resolve, reject ) => {
		var html = createHTML( md );
		fs.writeFile( path, html, ( error ) => {
			if ( error ) {
				return reject( { error: error, type: 'write html', path: path } );
			}
			resolve( {} );
		} );
	} );
}

function convert( read, write, base ) {
	console.log( 'Convert: ' + read + ' => ' + write );
	return readMarkdown( read ).then( ( md ) => {
		md.base = base;
		md.src = read;
		md.name = read.replace( /.+\/([^\/]+\.md$)/, '$1' );
		return loadMenu( read ).then( ( menu ) => {
			md.menu = menu;
			return writeHTML( write, md );
		} );
	} );
}

function update( read, write, base ) {
	return makeDir( write ).then( ( result ) => {
		return readDir( read ).then( ( list ) => {
			var p = [];
			list.forEach( ( file ) => {
				var path = read + '/' + file;
				var wpath = write + '/' + file.replace( /\.md$/, '' );
				if ( isFile( path ) ) {
					if ( !file.match( /^[^\_].*\.md$/ ) ){ return; }
					p.push( convert( path, wpath + '.html', base ) );
				} else {
					p.push( update( path, wpath, base + '/..' ) );
				}
			} );
			return Promise.all( p );
		} );
	} );
}

function loadTemplate( path ) {
	return new Promise( ( resolve, reject ) => {
		fs.readFile( path, ( error, data ) => {
			if ( error ) {
				return reject( { error: error, type: 'load template', path: path } );
			}
			var line = data.toString().split( '\n' );
			var html = '';
			line.forEach( ( l ) => {
				if ( l.match( /\{var\:(.+)\}/ ) ) {
					l.split( /(\{var\:[^\}]+\})/ ).forEach( ( v ) => {
						if ( v.match( /\{var\:(.+)\}/ ) ) {
							template.push( html );
							html = '';
							template.push( { val: v.replace( /\{var\:(.+)\}/, '$1' ) } );
						} else {
							html += v;
						}
					} );
				} else {
					html += '\n' + l;
				}
			} );
			template.push( html );
			template[ 0 ] = template[ 0 ].replace( /^\n+/, '' );
			resolve( template );
		} );
	} );
}

function createHTML( data ) {
	return template.map( ( v ) => { return typeof v === 'string' ? v : ( data[ v.val ] || '' ); } ).join( '' );
}

// ======================================== //
// exec
// ======================================== //

loadTemplate( TEMPLATE ).then( ( result ) => {
	template = result;
	return update( SRC_DIR, DST_DIR, '..' ).then( ( result ) => {
		console.log( 'Complete!!' );
		console.log( 'Next step: git commit & git push' );
	} );
} ).catch( ( error ) => {
	console.log( 'Error!!' );
	console.log( error );
} );
