
var callback = function (context, data, pageNumber) {
	var graphContainer = $('#' + data.id + '-plot-holder', context);
	
	var axes = {};
	var importFrom = {};
	var myPlot;

	//Variables for the series index and point index of the currently dragged point
	var dragIndex;
	var dragPoint;

	// Enable plugins on jqplot for trendline
	$.jqplot.config.enablePlugins = true;

	// Initialize Legend
	var legend = {
		show: data.showLegend,
		location: data.legendLocation
	};

	// Initialize X-axis
	axes.xaxis = {
		min: data.xmin,
		max: data.xmax,
		numberTicks: data.xticks,
		label: data.xlabel,
		showLabel: data.showXLabel
	};

	// Initialize Y-axis
	axes.yaxis = {
		min: data.ymin,
		max: data.ymax,
		numberTicks: data.yticks,
		label: data.ylabel,
		showLabel: data.showYLabel,
		labelRenderer: $.jqplot.CanvasAxisLabelRenderer
	};

	// Build an import index
	$(data.plots).each(function (index, plot) {
		if (typeof plot.imports_from !== "undefined") {
			// Create import index if it doesn't exist
			if (typeof importFrom[plot.imports_from] === "undefined") {
				importFrom[plot.imports_from] = [];
			}
			// Add plot to import index
			importFrom[plot.imports_from].push(plot);
		}
	});


	// Add co-ordinates to a plot as needed
	var addCoordinates = function (ind, plot) {
		// Get data
		//  Note: must be sorted for velocity graphs!
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
			
		if( typeof colorValues !== "undefined" && colorValues.length > 0 &&
			typeof colorValues[0] !== "undefined" && colorValues[0].length > 0 ) {
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
		
		if(typeof plot.color_segment_graph !== "undefined" && plot.color_segment_graph === true &&
		   typeof SharedData.getter(imports_from + "_rgb") !== "undefined")
		{
			allValues = SharedData.getter(imports_from + "_rgb")[0];
		}
		
		// Clear plot data
		plot.coordinates = [];
		// applied_equation variables hold the value of the 
		// calculated equation from the previous value, used
		// in creating a velocity graph
		var applied_equation_x = null;
		var applied_equation_y = null;
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
			var frameIndex = allValues[index][0];
			var time = 0;
			var frame = 0;

			if (typeof plot.velocityGraph !== "undefined" && plot.velocityGraph === true) {
				//get value of point for velocity graph
				if(typeof plot.indices !== "undefined") {
					if (index == 0)
						// This is the first analysis point, continue to the next
						// one (at least 2 points are needed for velocity graph)
						return;
					// velocity graph with indices defined
					// Find bounding points
					var leftx = allValues[index - 1][plot.indices.x];
					var lefty = allValues[index - 1][plot.indices.y];
					var rightx = allValues[index][plot.indices.x];
					var righty = allValues[index][plot.indices.y];
				} else {
					// velocity graph without indices defined

					frame = 	allValues[index][0];
					x = 		allValues[index][1];
					y = 		allValues[index][2];
					time = 		allValues[index][3];
					
					// Apply equations before velocity functions
					if (typeof plot.equations !== "undefined") {
						if (typeof plot.equations.x !== "undefined") {
							var rightx = eval(plot.equations.x);
						}
						if (typeof plot.equations.y !== "undefined") {
							var righty = eval(plot.equations.y);
						}
					}
					var leftx = applied_equation_x;
					var lefty = applied_equation_y;

					// Save the equation values for the next point
					applied_equation_x = rightx;
					applied_equation_y = righty;

					if (leftx === null && lefty === null) {
						// This is the first analysis point, continue to the next
						// one (at least 2 points are needed for velocity graph)
						return;
					}
				}
				
				// Create a point
				y = (righty - lefty) / (rightx - leftx); // Slope
				x = (rightx + leftx) / 2; // X-Midpoint
			} else if(typeof plot.color_segment_graph !== "undefined" && plot.color_segment_graph === true) {
				red = allValues[index][0];
				green = allValues[index][1];
				blue = allValues[index][2];
				x = index;
			} else {
				//get value of point for non-velocity graph
				
				// Get X and Y co-ordinates
				if(typeof plot.indices !== "undefined") {
					x = value[plot.indices.x];
					y = value[plot.indices.y];
					time = value[3];
					frame = frameIndex;
					
				} else {
					time = value[3];
					frame = frameIndex;
					x = value[1];
					y = value[2];
				}
				
				if(typeof plot.handle_color !== "undefined" && plot.handle_color === true && typeof colorValues !== "undefined") {
					if( typeof colorValues[0] === "undefined" || typeof colorValues[0][frameIndex] === "undefined" )
					{
						return;
					}
					if( typeof colorValues[0][frameIndex] !== "undefined" && colorValues[0][frameIndex] === 0 )
					{
						return;
					}
					red   = colorValues[0][frameIndex][0];
					green = colorValues[0][frameIndex][1];
					blue  = colorValues[0][frameIndex][2];
				}
			}

			// Apply origin translation
			var origin_x = SharedData.getter(imports_from + "_origin_x");
			var origin_y = SharedData.getter(imports_from + "_origin_y");
			if (typeof origin_x !== "undefined" && typeof origin_y !== "undefined") {
				x -= origin_x;
				y -= origin_y;
			}

			// Apply scale value to x and y
			var scale_factor = SharedData.getter(imports_from + "_scale_factor");
			var scale_real_value = SharedData.getter(imports_from + "_scale_real_value");
			if (typeof scale_factor !== "undefined" && typeof scale_real_value !== "undefined") {
				var final_scale = scale_factor / scale_real_value;
				x /= final_scale;
				y /= final_scale;
			}

			// Apply equations as necessary
			if (plot.velocityGraph === true && typeof plot.indices === "undefined") {
				// if graph is a velocity graph and not using indices, equations were already applied
			} else {
				if (typeof plot.equations !== "undefined") {
					var tempx;
					if (typeof plot.equations.x !== "undefined") {
						tempx = eval(plot.equations.x);
					}
					if (typeof plot.equations.y !== "undefined") {
						y = eval(plot.equations.y);
					}
					x = tempx;
				}
			}
			
			
			// Can only plot values if they're not NaN
			if( !isNaN(x) && !isNaN(y) )
			{
				if (typeof x !== "undefined" && typeof y !== "undefined") {
					// Create a point
					var point = [x, y];
					// Add point to existing co-ordinates
					plot.coordinates.push(point);
				}
 			}
		});
	};

	// Update the data for the graphs when needed, without calling drawGraphs()
	var updateGraphs = function () {
		if (importFrom === undefined) {
			return;
		}
		$.each(importFrom, function (imports_from, plotCollection) {
			// Add co-ordinates to each plot as needed
			$(plotCollection).each(addCoordinates);
		});
	};

	// A function which can draw all graphs
	var drawGraphs = function () {
		// Setup data
		var series = [];
		var allPoints = [];

		// Update our graph data so the graph doesn't break when it is reloaded
		updateGraphs();

		// Set up the points to plot
		$(data.plots).each(function (index, plot) {
			// Set up metadata
			series.push(
				{
					label: plot.label,
					trendline: {show: plot.trendline},
					dragable: {constrainTo: 'none'},
					showLine: plot.showLine,
					color: plot.color,
					lineWidth: plot.lineWidth,
					rendererOptions: {smooth: plot.smooth},
					markerOptions: {
						"show": plot.showMarkers,
						"style": plot.markerStyle,
						"size": plot.markerSize
					},
					/*
					highlighter: {
						"show": typeof plot.showHoveredValues === "undefined" ? false : plot.showHoveredValues,
						"showTooltip": typeof plot.showHoveredValues === "undefined" ? false : plot.showHoveredValues
					},*/
					isDragable: plot.dragable && !plot.velocityGraph
				}
			);
			
			// Set up points
			if (typeof plot.coordinates !== "undefined") {
				if (plot.coordinates.length > 0) {
					allPoints.push(plot.coordinates);
				} else {
					allPoints.push([[0, 0]]);
				}
			} else {
				allPoints.push([[0, 0]]);
			}
		});
		
		// Clear all the graphs
		graphContainer.html("");
		
		if( allPoints.length === 0 ) {
			allPoints.push([[0, 0]]);
		}

		// Check whether this is the first run
		if (typeof myPlot === "undefined") {
			// Only plot when the widget has loaded in the browser
			if( $("#"+data.id + '-plot-holder').length > 0 )
			{
				// Execute JQ Plot
				myPlot = $.jqplot(
					data.id + '-plot-holder',
					allPoints,
					{
						axes: axes,
						legend: legend,
						series: series,
						// Set the title of the graph (if this is undefined, no title is set)
						title: data.graphTitle
					}
				);
				// Set up window resize function
				VignetteController.addResizeFunction(function () {
					if (graphContainer.is(':visible')) {
						myPlot.replot();
					}
				});
			}
		} else {
			// Update data
			$(allPoints).each(function (index, values) {
				myPlot.series[index].data = values;
			});

			// Replot
			if (graphContainer.is(':visible')) {
				if (data.autoscale) {
					myPlot.replot({ resetAxes: true });
				} else {
					myPlot.replot();
				}
			}
		}

		// Display Slope and Y-Intercept for velocity graph if they were previously saved
		if (SharedData.getter(data.id+"_graph") !== undefined){
			displayEquations();
		}
	};

	// Setup one listener for each imports_from
	var imports_from;
	for (imports_from in importFrom) {
		if (importFrom.hasOwnProperty(imports_from)) {
			SharedData.addListener(imports_from, drawGraphs, pageNumber);
		}
	}

	// redraw graphs when scale or origin is changed
	SharedData.addListener(imports_from+"_scale_factor", drawGraphs, pageNumber);
	SharedData.addListener(imports_from+"_scale_real_value", drawGraphs, pageNumber);
	SharedData.addListener(imports_from+"_origin_x", drawGraphs, pageNumber);

	var displayEquations = function() {
		var coords;
		var slope;
		var intersect;
		var coordFirst, coordLast, x1, y1, x2, y2;
		if (SharedData.checkHasData(data.plots[dragIndex].imports_from)) {
			coords = SharedData.getter(data.plots[dragIndex].imports_from);
			if( coords.length > 1 )
			{
				// Format of analysis point:
				// [ index of frame in x-y-analysis,
				//	 x-coord of mouse click on the canvas (in x-y- analysis),
				//	 y-coord of mouse click on the canvas (in x-y- analysis),
				//	 time value pertaining to current frame in x-y-analysis ]
				coordFirst = coords[0];
				coordLast = coords[coords.length - 1];
				x1 = coordFirst[1];
				y1 = coordFirst[2];
				x2 = coordLast[1];
				y2 = coordLast[2];
			}
		} else {
			// Format of a coordinate is [x, y]
			coords = data.plots[dragIndex].coordinates;
			coordFirst = coords[0];
			coordLast = coords[coords.length - 1];
			x1 = coordFirst[0];
			y1 = coordFirst[1];
			x2 = coordLast[0];
			y2 = coordLast[1];
		}
		if (x2 - x1 === 0) {
			return;
		}
		slope = (y2 - y1) / (x2 - x1);
		intersect = y1 - slope * x1;
		slope = Math.round(slope * 100) / 100;
		intersect = Math.round(intersect * 100) / 100;

		var equation;
		var yint;
		equation = "Slope: " + slope + " m/s/s";
		yint = " y-Intercept: " + intersect + " m/s";

		if (typeof data.plots[dragIndex].exports_to !== "undefined") {
			SharedData.setter(data.plots[dragIndex].exports_to,
				[slope, intersect], pageNumber);
		}
		//TODO: display the equation
		//TODO: display the equation
		var slopeId = "slope-" + data.id;
		var yintId = "yint-" + data.id;
		var slopeElement = document.getElementById(slopeId);
		var yintElement = document.getElementById(yintId);

		if (slopeElement === null) {
			graphContainer.append('<span class="slopeDisplay"><p id="' + slopeId + '"> </p></span>')
		}
		if (yintElement === null) {
			graphContainer.append('<span class="intDisplay"><p id="' + yintId + '"> </p></span>')
		}
		
		slopeElement.innerHTML = equation;
		yintElement.innerHTML = yint;

		SharedData.setter(data.id+"_graph", [equation, yint], pageNumber);
	}

	//Handler for starting to drag a point - only supports two points
	graphContainer.bind(
		'jqplotDragStart',
		function (seriesIndex, pointIndex, gridpos, datapos) {
			dragIndex = pointIndex;
			dragPoint = gridpos;
		}
	);

	//Handler for stopping to drag a point
	graphContainer.bind(
		'jqplotDragStop',
		function (ev, gridpos, datapos, neighbor, plot) {
			// Set default points for slope line
			if (SharedData.getter(data.id+"_point") === undefined){
				SharedData.setter(data.id+"_point", data.plots[dragIndex].coordinates, pageNumber);
			}
			
			// Update respective point on the Slope Line and save it
			var graphPoints = SharedData.getter(data.id+"_point")[0];
			graphPoints[dragPoint] = [neighbor.xaxis, neighbor.yaxis];
			SharedData.setter(data.id+"_point", graphPoints, pageNumber);

			// Update the point for the analysis widget, if the coordinates are imported
			var analysisImport = data.plots[dragIndex].imports_from;
			if (SharedData.checkHasData(analysisImport)) {
				var analysisPoint = SharedData.getter(analysisImport)[dragPoint];
				if (typeof analysisPoint !== "undefined") {
					analysisPoint[1] = neighbor.xaxis;
					analysisPoint[2] = neighbor.yaxis;
					var sortFunc = function (a, b) {
						return a[0] - b[0];
					};
					SharedData.replace(analysisImport, dragPoint, analysisPoint, sortFunc, pageNumber);
				}
			}
			//calculate equation
			displayEquations();
		}
	);

	// Draw the graphs once on load (due to jqplot bugs)
	VignetteController.addPageFlipListener(function (event) {
		if (event.type === "load") {
			setTimeout(drawGraphs, 100);
		}
		return true;
	});
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/x-y-graph", callback);
};
