var callback = function (context, data, pageNumber) {
	//Data Keys
	var EXPORT_KEY = data.exports_to;
	var COLOR_EXPORT_KEY = data.exports_to + "_rgb";
	var LINE_COLOR_EXPORT_KEY = data.exports_to + "_all_rgb";
	// Frame variables
	var colorData = [];
	//For drawing lines and other shapes
	var dragObj = { dragging : false,
					point0 : [0,0],
					point1 : [0,0] };

	// image player
	var playerImages = [];
	//load each image into the image array
	data.frames.forEach( function( frame, index ){
		playerImages[index] = new Image();
		playerImages[index].src = "resources/Analysis/" + frame;
	});

	//Tracker obj to be passed into the analysis handlers
	//Contains all needed variables
	var tracker = {
		pageNum : pageNumber,
		stepTime : data.step_time,
		exportLoc : EXPORT_KEY,
		colorExport : COLOR_EXPORT_KEY,
		lineWidth : 2,
		currentFrame : 0,
		clicks : 0,
		warnings : 0,
		colorData : [],
		trackedData : [],
		offset : { x : 0, y : 0 },
		playerImages : playerImages,
		trackLocations : data.track_locations
	};
	
	if(typeof data.scale === "undefined")
		tracker.scale = { x: 300, y: 150 };
	else
		tracker.scale = data.scale;

	//Get offset of tracker
	var setTrackerOffset = function() {
 		//reset offset
 		tracker.offset.y = 0;
 		tracker.offset.x = 0;
 		var offset = $("#" + data.id, context).offset();
	    tracker.offset.y += offset.top  || 0;
	    tracker.offset.x += offset.left || 0;      
	};

	/**
	 * Updates the frame for the analysis widget to its current frame
	 */
	var updateFrame = function() {
		var frame = SharedData.getter(data.exports_to + "_frame");
	};

	// Set up control listeners
	
	// Resize the canvas to properly account for the scale factor
	// between the widget's size and the actual size of the canvas
	var setUpCanvas = function()
	{
		var canvasDiv = document.querySelector("#" + data.id);
		//Create the canvas to be used for the tracker
		//Doing it here instead of in the html file allows 
		//for the canvas to be sized correctly
		var TheCanvas = document.createElement('canvas');
		TheCanvas.id = data.id + "_canvas";
		TheCanvas.width = canvasDiv.clientWidth;
		TheCanvas.height = canvasDiv.clientHeight;
		canvasDiv.appendChild(TheCanvas);

		var ctx = TheCanvas.getContext('2d');

		tracker.canvas = TheCanvas;
		tracker.ctx = ctx;

		setTrackerOffset();
		
		//Set up event handlers
		switch(data.tracks) {
			case "circle" :
				AnalysisHandlers.anyTrackerDownHandler(tracker);
				AnalysisHandlers.circleTrackerUpHandler(tracker);
				AnalysisHandlers.anyTrackerMoveHandler(tracker);
				break;
			case "displacement" :
				AnalysisHandlers.anyTrackerDownHandler(tracker);
				AnalysisHandlers.anyLineTrackerUpHandler(tracker);
				AnalysisHandlers.anyLineTrackerMoveHandler(tracker);
				break;
			default :
				AnalysisHandlers.anyTrackerDownHandler(tracker);
				AnalysisHandlers.anyTrackerUpHandler(tracker);
				AnalysisHandlers.anyTrackerMoveHandler(tracker);
		}
		window.setTimeout( resizeCanvas, 40 );
		AnalysisHandlers.drawFrame( tracker.playerImages[tracker.currentFrame], tracker.ctx, tracker.canvas);
		AnalysisHandlers.drawControls( 0, tracker );
		AnalysisHandlers.drawCircles( tracker );
	};

	var resizeCanvas = function() {
		var canvasDiv = document.querySelector("#" + data.id);
		tracker.canvas.width = canvasDiv.clientWidth;
		tracker.canvas.height = canvasDiv.clientHeight;
		setTrackerOffset();
		AnalysisHandlers.drawFrame( tracker.playerImages[tracker.currentFrame], tracker.ctx, tracker.canvas);
		AnalysisHandlers.drawControls( 0, tracker );
		AnalysisHandlers.drawCircles( tracker );
			
	};

	// Page flip listener to fill in data
	VignetteController.addPageFlipListener(function (event) {
		// Have the scrub bar handle a page flip
		if (event.type === "flip") {
			
		} else if (event.type === "load") {
			setUpCanvas();

			VignetteController.addResizeFunction(function () {
				window.setTimeout( resizeCanvas, 40 );
			});
		}
		return true;
	});
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/x-y-analysis-beta", callback);
};