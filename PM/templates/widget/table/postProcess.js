
var callback = function (context, data, pageNumber) {
	// Store the table we make, so datatable.js doesn't complain
	var table = $("table", context).dataTable({
		//"sScrollY" : "100%",
		"bPaginate" : false,
		"bInfo" : false,
		"bFilter" : false,
		"bSearchable" : false
	});
	
	var refreshTable = function()
	{
		if( table.width() !== $(".table_div", context).width() )
		{
			table.width( $(".table_div", context).width() );
			window.setTimeout( refreshTable, 40 );
		}
	}
	
	SharedData.addListener(data.imports_from, function (values) {
		setRows();
	}, pageNumber);
	
	VignetteController.addPageFlipListener(function (event) {
		if (event.type === "flip") {
			
		} else if (event.type === "load") {
			setRows();
			window.setTimeout( refreshTable, 40 );
		}
		return true;
	});
	VignetteController.addResizeFunction(function () {
		window.setTimeout( refreshTable, 40 );
	});
	
	/**
	 * Rounds a given number to the nearest decimal based on the
	 * reference number's amount of decimal places (an array of
	 * references is passed in to determine how many decimal places
	 * to used)
	 */
	var roundToNearestTimeInterval = function( numToRound, numReferences )
	{
		var allDeltaDecimalLengths = [];
		
		// Get the number of decimal places to use based on the
		// reference values passed in
		for( var i = 1; i < numReferences.length; i++ )
		{
			// Use scale factor that's a power of 10 to attempt
			// to prevent round-off error in floating point arithmetic
			var cur = numReferences[i] * 100;
			var prev = numReferences[i - 1] * 100;
			var delta = ( cur - prev ) / 100;
			
			var splitDelta = delta.toString().split(".");
			
			if( splitDelta.length > 1 ) // If there was a decimal point
			{
				var deltaLength = splitDelta[1].length;
				
				// Again, prevent round-off error
				if( deltaLength < 17 )
				{
					allDeltaDecimalLengths.push( deltaLength );
				}
			}
		}
		
		if( allDeltaDecimalLengths.length > 0 )
		{
			var decimalPlaces = getMedian( allDeltaDecimalLengths );
			return Math.round( numToRound * Math.pow( 10, decimalPlaces ) ) / Math.pow( 10, decimalPlaces );
		}
		else // Not enough data, so just use the original number
		{
			return numToRound;
		}
	};
	
	var getMedian = function( array )
	{
		array = insertionSort( array );
		var medianIndex = Math.floor( array.length / 2 );
		
		return array[ medianIndex ];
	};
	
	var insertionSort = function( array )
	{
		for( var i = 1; i < array.length; i++ )
		{
			var curVal = array[i];
			var curPos = i;
			
			for( var j = i - 1; j >= 0; j-- )
			{
				var tempVal = array[j];
				
				if( curVal < tempVal )
				{
					array[ curPos ] = tempVal;
					curPos--;
				}
				else
				{
					break;
				}
			}
			
			array[ curPos ] = curVal;
		}
		
		return array;
	};
	
	// Add rows as needed
	var setRows = function () {
		var imports_from = data.imports_from;
		table.fnClearTable(true);
		// Get data
		var allValues = SharedData.getter(imports_from);
		
		if( typeof allValues !== "undefined" ) {
			for( var i = allValues.length - 1; i >= 0; i-- )
			{
				if( allValues[i] === 0 )
				{	
					allValues.splice( i, 1 );
				}
			}
		}
		
		var colorValues;
		if(typeof SharedData.getter(imports_from + "_rgb") !== "undefined") {
			colorValues = SharedData.getter(imports_from + "_rgb");
		}
			
		if( typeof colorValues !== "undefined" ) {
			for( var i = 0; i < colorValues[0].length; i++ )
			{
				if( colorValues[0][i] === 0 || typeof colorValues[0][i] === "undefined" )
				{
					colorValues[0][i] = [0,0,0];
				}
			}
		}
		
		if (typeof allValues === "undefined") {
			return true;
		}
		
		var allTimeValues = [];
		for( var i = 0; i < allValues.length; i++ )
		{
			allTimeValues.push( allValues[i][3] );
		}
		
		if(typeof data.color_segment_table !== "undefined" && data.color_segment_table === true &&
		   typeof SharedData.getter(imports_from + "_rgb") !== "undefined")
		{
			allValues = SharedData.getter(imports_from + "_rgb")[0];
		}
		
		$(allValues).each(function (index, value) {
			// Format of value:
			// [ index of frame in x-y-analysis,
			//	 x-coord of mouse click on the canvas (in x-y- analysis),
			//	 y-coord of mouse click on the canvas (in x-y- analysis),
			//	 time value pertaining to current frame in x-y-analysis ]
		
			var x;
			var y;
			var red = 0;
			var green = 0;
			var blue = 0;
			var frame = allValues[index][0];
			var time = allValues[index][3];
			//make the new row
			var newRow = [];
			var adjustedValues = false;
				
			// Get X and Y co-ordinates
			x = value[1];
			y = value[2];
			
			// Round values appropriately
			time = roundToNearestTimeInterval( time, allTimeValues );
			if( typeof data.color_segment_table !== "undefined" && data.color_segment_table === true ) {
				red = allValues[index][0];
				green = allValues[index][1];
				blue = allValues[index][2];
				x = index;
			} else {
			
				//Set the colors if there are any
				if(typeof colorValues !== "undefined") 
				{
					if( typeof colorValues[0] === "undefined" || typeof colorValues[0][frame] === "undefined" )
					{
						return;
					}
					if( typeof colorValues[0][frame] !== "undefined" && colorValues[0][frame] === 0 )
					{
						return;
					}
					red   = colorValues[0][frame][0];
					green = colorValues[0][frame][1];
					blue  = colorValues[0][frame][2];
				}
			}
			// By evaluating the instructions in our JSON
			$(data.equations).each(function (equ, equDat) {
				
				newRow.push(eval(equDat));
				adjustedValues = true;
			});
			//Push the data to the table
			if( adjustedValues )
			{
				table.fnAddData(newRow, true);
				table.fnAdjustColumnSizing(true);
			}
		});
	};
	
};



var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/table", callback);
};
