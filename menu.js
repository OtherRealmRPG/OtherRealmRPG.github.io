function getPage() { return location.pathname.replace( /index\.html$/, '' ); }
function noEvent( li ){ li.addEventListener( 'click', function ( e ){ e.stopPropagation(); }, false ); }
function openEvent( li, ul ) { li.addEventListener( 'click', function ( e ){ e.stopPropagation(); ul.classList.toggle( 'open' ); }, false ); }

function urlCheck( a, page ) {
	var href = ( a.href || '' ).split( '?' )[ 0 ].replace( /^https*\:\/\/[^\/]+/, '' );
	if ( href.match( /index\.html$/ ) ){ href = href.replace( /index\.html$/, '' ); }
	if ( href.match( /^file\:\/\// ) ){ href = href.replace( /^file\:\/\//, '' ); }
	return ( href === page );
}

function openMenu( li ) {
	var ul = li.parentNode;
	if ( ul.nodeName !== 'UL' || ul.parentNode.nodeName !== 'LI' ){ return; }
	ul.classList.add( 'open' );
	openMenu( ul.parentNode );
}

function checkOpen( li, page ) {
	var c = li.children;
	var ret = false;
	for ( var i = 0; i < c.length ; ++i ) {
		if ( c[ i ].nodeName === 'A' && urlCheck( c[ i ], page ) ){ li.classList.add( 'select' ); openMenu( li ); }
		if ( c[ i ].nodeName !== 'UL' ) { continue; }
		openEvent( li, c[ i ] );
		addOpenEvent( c[ i ], page );
		ret = true;
	}
	return ret;
}

function addOpenEvent( parent, page ) {
	var c = parent.children;
	for ( var i = 0; i < c.length ; ++i ) {
		if ( c[ i ].nodeName !== 'LI' ) { continue; }
		if ( checkOpen( c[ i ], page ) ){ c[ i ].classList.add( 'link' ); continue; }
		noEvent( c[ i ] );
	}
}

document.addEventListener( 'DOMContentLoaded', function() {
	var page = getPage();
	var menu = document.getElementById( 'menu' ).children;
	for ( var i = 0; i < menu.length ; ++i ) {
		if ( menu[ i ].nodeName !== 'UL' ) { continue; }
		addOpenEvent( menu[ i ], page );
	}
} );
