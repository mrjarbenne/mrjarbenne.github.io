var callback = function (context, data, pageNumber) {
	var RESOURCE_DIRECTORY = "resources/Javascript";

	var container = $(".external-source-div", context);
	var externalSource;
	var loaded = false;
	
	var loc = window.location.pathname; // Location
	var dir = loc.substring(0, loc.lastIndexOf('/')); // Directory
	dir = dir.substring(dir.lastIndexOf('/') + 1);
	
	/**
	 * Adjusts the src and href for the pertinent elements located
	 * in the external source
	 */
	var adjustSources = function()
	{
		var elementsToAdjust = getElementsToAdjust( externalSource );
		
		for( var i = 0; i < elementsToAdjust.length; i++ )
		{
			var element = elementsToAdjust[i];
		
			var src = "" + $(element).prop("src");
			var href = "" + $(element).prop("href");
			
			if( typeof src !== "undefined" && src !== "" && src.indexOf(dir) >= 0 && src.indexOf( RESOURCE_DIRECTORY ) < 0 )
			{
				var newSrc = RESOURCE_DIRECTORY +
							 src.substring( src.lastIndexOf(dir) + dir.length );
				
				element.src = newSrc;
			}
			
			if( typeof href !== "undefined" && href !== "" && href.indexOf(dir) >= 0 && href.indexOf( RESOURCE_DIRECTORY ) < 0 )
			{
				var newHref = RESOURCE_DIRECTORY +
							  href.substring( href.lastIndexOf(dir) + dir.length );
				
				element.href = newHref;
			}
		}
		
		loaded = true;
	};
	
	/**
	 * Gets all the elements (in the given context) that need to have
	 * their src or href values adjusted to make them relative to the
	 * external file
	 * (Recursive)
	 */
	var getElementsToAdjust = function( context )
	{
		var elementsToAdjust = [];
	
		$( "*", externalSource ).each( function( index, element ) {
			if( needsAdjustment( element ) )
			{
				elementsToAdjust.push( element );
			}
		});
		
		return elementsToAdjust;
	};
	
	/**
	 * Determines whether or not adjustments need to be made to the
	 * given element to adjust its src and href properties to be
	 * relative to the external file
	 */
	var needsAdjustment = function( element )
	{
		var src = "" + $(element).prop("src");
		var href = "" + $(element).prop("href");
		
		var mustAdjust =
			( typeof src !== "undefined" && src !== "" && src.indexOf( dir ) >= 0 && src.indexOf( RESOURCE_DIRECTORY ) < 0 ) ||
			( typeof href !== "undefined" && href !== "" && href.indexOf( dir ) >= 0 && dir.indexOf( RESOURCE_DIRECTORY ) < 0 );
		
		return mustAdjust;
	};
	
	/**
	 * Creates a div in the main container of the vignette
	 * that holds hidden external applets to keep them and
	 * all their data in memory for the entire vignette.
	 */
	var createAppletContainer = function()
	{
		if( $("#externalStorage").length === 0 )
		{
			var storageDiv = $('<div id="externalStorage">');
			$("#container").append( storageDiv );
			storageDiv.hide();
		}
	};
	
	var createExternalSourceInstance = function( html )
	{
		externalSource = $('<div id="' + data.id +'">').html( html );
	
		$(externalSource).ready( window.setTimeout( adjustSources, 200 ) );
		$(externalSource).ready( window.setTimeout( adjustSources, 500 ) );
		$(externalSource).ready( window.setTimeout( adjustSources, 1000 ) );
		
		// Fix for when clicking something in the external source that runs
		// a script that can potentially change src's or href's
		$(document).mouseup( function() {
			if( loaded && VignetteController.currentPage === pageNumber )
			{
				$(externalSource).ready( window.setTimeout( adjustSources, 10 ) );
			}
		});
		
		// Fix for when tabbing to something in the external source then pressing
		// and releasing a key
		$(externalSource).keydown( function(e) {
			if( loaded && VignetteController.currentPage === pageNumber )
			{
				$(externalSource).ready( window.setTimeout( adjustSources, 10 ) );
			}
		});
		$(externalSource).keyup( function(e) {
			if( loaded && VignetteController.currentPage === pageNumber )
			{
				$(externalSource).ready( window.setTimeout( adjustSources, 10 ) );
			}
		});
		
		container.append( externalSource );
	};
	
	/**
	 * Loads the external data into the page
	 */
	var loadExternalSource = function()
	{
		if( typeof SharedData.getter( data.id + "_external_source_loaded" ) !== "undefined" &&
			SharedData.getter( data.id + "_external_source_loaded" )[0] === data.id )
		{
			externalSource = $("#" + data.id).detach();
			container.append( externalSource );
		}
		else
		{
			createAppletContainer();
			
			// @TODO
			// Attempt to prevent caching so that when you leave the webpage
			// then come back, the external source will still load -- But a
			// caching issue still exists regardless
			$.ajax({
				type: "GET",
				url: data.url,
				cache: false,
				dataType: "html",
				success: function( html ) {
					createExternalSourceInstance( html );
				},
				error: function() {
					// Couldn't find external source
				}
			});
		}
	};
	
	// Page flip listener to fill in data
	VignetteController.addPageFlipListener(function (event) {
		if (event.type === "flip") {
			SharedData.setter( data.id + "_external_source_loaded", data.id, pageNumber );
			externalSource.detach().appendTo( "#externalStorage" );
		} else if (event.type === "load") {
			loadExternalSource();
		}
		return true;
	});
};


var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/external-source", callback);
};
