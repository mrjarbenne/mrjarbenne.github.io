
var callback = function (context, data, pageNumber) {
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
	var addCoordinates = function (index, plot) {
		// Get data
		//  Note: must be sorted for velocity graphs!
		var allValues = SharedData.getter(imports_from);

		if (allValues === undefined) {
			return true;
		}
		// Clear plot data
		plot.coordinates = [];
		$(allValues).each(function (index, value) {
			var x;
			var y;

			if (typeof plot.velocityGraph !== "undefined"
				&& plot.velocityGraph) {
				//get value of point for velocity graph
				if (index !== 0) {
					// Find bounding points
					var leftx = allValues[index - 1][plot.indices.x];
					var lefty = allValues[index - 1][plot.indices.y];
					var rightx = allValues[index][plot.indices.x];
					var righty = allValues[index][plot.indices.y];
					// Create a point
					y = (righty - lefty) / (rightx - leftx);
					x = (rightx + leftx) / 2;
				}
			} else {
				//get value of point for non-velocity graph

				// Get X and Y co-ordinates
				x = value[plot.indices.x];
				y = value[plot.indices.y];
			}
			// Apply equations as necessary
			if (typeof plot.equations !== "undefined") {
				if (typeof plot.equations.x !== "undefined") {
					x = eval(plot.equations.x);
				}
				if (typeof plot.equations.y !== "undefined") {
					y = eval(plot.equations.y);
				}
			}

			if (typeof x !== "undefined" && typeof y !== "undefined") {
				// Create a point
				var point = [x, y];
				// Add point to existing co-ordinates
				plot.coordinates.push(point);
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
					dragable: {constrainTo: 'none', isDragable: plot.dragable},
					showLine: plot.showLine,
					color: plot.color,
					lineWidth: plot.lineWidth,
					rendererOptions: {smooth: plot.smooth},
					markerOptions: {
						"show": plot.showMarkers,
						"style": plot.markerStyle,
						"size": plot.markerSize
					}

				}
			);
			// Set up points
			if (typeof plot.coordinates !== "undefined") {
				if (plot.dragable === false || SharedData.getter(data.id+"_point") === undefined){
					allPoints.push(plot.coordinates);
				}else{
					allPoints.push(SharedData.getter(data.id+"_point")[0]);
				}
			} else {
				allPoints.push([[0, 0]]);
			}
		});

		// Clear all the graphs
		$('#' + data.id + '-plot-holder', context).html("");

		// Check whether this is the first run
		if (typeof myPlot === "undefined") {
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
				if ($('#' + data.id + '-plot-holder', context).is(':visible')) {
					myPlot.replot();
				}
			});
		} else {
			// Update data
			$(allPoints).each(function (index, values) {
				myPlot.series[index].data = values;
			});

			// Replot
			if ($('#' + data.id + '-plot-holder', context).is(':visible')) {
				myPlot.replot();
			}
		}
		// Display Slope and Y-Intercept for velocity graph if they were previously saved
		if (SharedData.getter(data.id+"_graph") !== undefined){
			$('#' + data.id + '-plot-holder', context).append('<span id="slopeDisplay"><p id="slope-hack"> </p>');
			document.getElementById("slope-hack").innerHTML = SharedData.getter(data.id+"_graph")[0][0];
			$('#' + data.id + '-plot-holder', context).append('<span id="intDisplay"><p id="yint-hack"> </p>');
			document.getElementById("yint-hack").innerHTML = SharedData.getter(data.id+"_graph")[0][1];
		}
	};

	// Setup one listener for each imports_from
	var imports_from;
	for (imports_from in importFrom) {
		if (importFrom.hasOwnProperty(imports_from)) {
			SharedData.addListener(imports_from, drawGraphs, pageNumber);
		}
	}

	//Handler for starting to drag a point - only supports two points
	$('#' + data.id + '-plot-holder', context).bind(
		'jqplotDragStart',
		function (seriesIndex, pointIndex, gridpos, datapos) {
			dragIndex = pointIndex;
			dragPoint = gridpos;
		}
	);

	//Handler for stopping to drag a point - only supports two points
	$('#' + data.id + '-plot-holder', context).bind(
		'jqplotDragStop',
		function (ev, gridpos, datapos, neighbor, plot) {
			// Set default points for slope line
			if (SharedData.getter(data.id+"_point") === undefined){
				SharedData.setter(data.id+"_point", data.plots[dragIndex].coordinates, pageNumber)
			}
			
			// Update respective point on the Slope Line and save it
			var graphPoints = SharedData.getter(data.id+"_point")[0]
			graphPoints[dragPoint] = [neighbor.xaxis, neighbor.yaxis]
			SharedData.setter(data.id+"_point", graphPoints, pageNumber);

			//calculate equation
			var coords = SharedData.getter(data.id+"_point")[0];
			if (coords[1][0] - coords[0][0] !== 0) {
				var slope = (coords[1][1] - coords[0][1]) /
					(coords[1][0] - coords[0][0]);
				var intersect = coords[0][1] - slope * coords[0][0];
				slope = Math.round(slope * 100) / 100;
				intersect = Math.round(intersect * 100) / 100;


				var equation;
				var yint;
				if (intersect >= 0) {
					equation = "Slope: " + slope + " m/s/s";
					yint = " y-Intercept: " + intersect + " m/s";
				} else {
					equation = "Slope: " + slope + " m/s/s";
					yint = " y-Intercept: " + intersect + " m/s";
				}

				if (typeof data.plots[dragIndex].exports_to !== "undefined") {
					SharedData.setter(data.plots[dragIndex].exports_to,
						[slope, intersect], pageNumber);
				}
				//TODO: display the equation
				$('#' + data.id + '-plot-holder', context).append('<span id="slopeDisplay"><p id="slope-hack"> </p>');
				document.getElementById("slope-hack").innerHTML = equation;
				$('#' + data.id + '-plot-holder', context).append('<span id="intDisplay"><p id="yint-hack"> </p>');
				document.getElementById("yint-hack").innerHTML = yint;
				
				SharedData.setter(data.id+"_graph", [equation, yint], pageNumber);

			}
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
	Registry.register("widget/x-y-graph-hack", callback);
};
