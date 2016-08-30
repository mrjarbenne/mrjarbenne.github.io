
var callback = function (context, data, pageNumber) {
	var graphContainer = $('#' + data.id + '-plot-holder', context);
	
	var axes = {};
	var importFrom = {};
	var myPlot;
	var plotString = data.id + '-plot-holder';
	var yMax = 0;
	var yMin = 0;

	//Test Data
	var seriesData;     // seriesData represents the series to be sent to JqPlot to draw the data.
	var xLabelTicks;    // xLabelTicks represents the labels on the x-Axis

    // Listener for updates in any of the imported SharedData.
    if(data.imports_from != null) {
        $(data.imports_from.sources).each(function(index, source){
            SharedData.addListener(source, function (values) {
                setTimeout(function(){ drawGraph();}, 500);
            }, pageNumber);
        });
    }
    
    // Draw our bar graph
	var drawGraph = function(){
        var hasImports = data.imports_from;
        
        if(hasImports == null) { // if imports is false. Load bargraphs defined paramters
            seriesData = data.series.values;
            xLabelTicks = data.series.labels;
        }
        else {            // if imports true. Load from imports.
            var imported = data.imports_from;                           // a shorter way to reference data in future
            if(!SharedData.checkHasData(imported.x.source)) return;  // If there's nothing in x-label dont continue with drawing
            var allData = SharedData.getter(imported.x.source)[0];   // Stores all the imported table data
            var columnX;
            var increments;                                             // increment moves the cell down one at a time
            var tempYData;
            var tempDimensions = SharedData.getter(imported.x.source+"_dimensions")[0];
            tempDimensions.row = tempDimensions[0];
            tempDimensions.column = tempDimensions[1];
            
            // find the index of the matching column header
            for(var i=0; i< tempDimensions[1]; i++) {
                if(allData[i] == imported.x.column_header) columnX = i;
            }
            increments = columnX + tempDimensions.column;
            xLabelTicks = [];
            
            // store all the x-axis labels in xLabelTicks
            for(var i= 0; i < tempDimensions.row; i++) {
                xLabelTicks.push(allData[increments]);
                increments += tempDimensions.column;
            }
            
            // next section is to load the y axis data
            tempYData = imported.y.source;
            seriesData = [];
            for(var i=0; i < tempYData.length; i++) {
                var columnY = -1;
                if(!SharedData.checkHasData(tempYData[i])) { seriesData.push([0]); }
                else {
                    allData = SharedData.getter(tempYData[i])[0];
                    tempDimensions = SharedData.getter(tempYData[i]+"_dimensions");
                    tempDimensions.row = tempDimensions[0][0];
                    tempDimensions.column = tempDimensions[0][1];
                    
                    for(var j=0; j< tempDimensions.column; j++) {
                        if(allData[j] == imported.y.column_header[i]) columnY = j;
                    }
                    
                    if(columnY != -1) {
                        increments = columnY + tempDimensions.column;
                        var tempData = [];
                        for(var j= 0; j < tempDimensions.row; j++) {
                            if(allData[increments] == "") tempData.push(0);
                            else tempData.push(parseFloat(allData[increments]));
                            increments += tempDimensions.column;
                        }
                        seriesData.push(tempData);
                    }
                }
            }
        }
        
		var multiBar = seriesData.length > 1 ? true : false;
		
		//---- this section defines a custom series for our plot
		var series = { renderer: $.jqplot.BarRenderer,
			pointLabels: { show: true },
			isDragable: false,
			trendline: { show: false },
			rendererOptions : {
				barDirection : data.series.direction,
				fillToZero: true
				//barMargin: 30
			}
		}
		
		//-----this section defines the color for our plot
		var colorList = null;
		if( typeof data.series.colors !== "undefined") {
			colorList = data.series.colors;
		}
        // vary colors only for single-set data
        if (!multiBar) {
            series.rendererOptions.varyBarColor = true;
        }

		//---- this section defines the axis for the our plot
		var plotAxes = {};
		if( data.series.direction == "horizontal" ) {
			plotAxes.yaxis = {
					renderer: $.jqplot.CategoryAxisRenderer,
					ticks: xLabelTicks
				}
		} else {
			plotAxes.xaxis = {
				renderer: $.jqplot.CategoryAxisRenderer,
				ticks: xLabelTicks,
				label: data.series.xlabel,
				labelRenderer: $.jqplot.CanvasAxisLabelRenderer
			}
			plotAxes.yaxis = {
				label: data.series.ylabel,
				labelRenderer: $.jqplot.CanvasAxisLabelRenderer
			}
		}
        
        // This function defines the legend for the columns. It uses column header if alt_legend is not defined.
        function getSeries() {
            var cLabels = []
            var argStr;
            
            var altLegend = data.series.alt_legend;
            var state = -1;
            var columnHeaders;
            
            if(data.imports_from) columnHeaders = data.imports_from.y.column_header;
            else columnHeaders = data.series.labels;
            
            for(var i =0; i < columnHeaders.length; i++) {
                if(altLegend[i] == "" || altLegend[i] == undefined) argStr = { label: ''+columnHeaders[i]+''};
                else argStr = { label: ''+altLegend[i]+''};
                cLabels.push(argStr);
            }
            
            return cLabels;
        }
        
        
        
        //----- main section to draw the bar graph on our plot
		if($('#' + plotString).length > 0) {
            /* we have to use this workaround where we create
               separate legendOptions objects depending on whether data.series.legend
               is true or false because simply setting show: data.series.legend does not work
               for some reason when the option is false. */
            var legendOptions = null;
            if (data.series.legend) {
                legendOptions = {
                    show: true,
                    placement: data.series.legend_position
                };
            } else {
                legendOptions = {
                    show: false
                };
            }
            var plotOptions = {
                seriesDefaults : series,
                seriesColors : colorList,
                negativeSeriesColors: data.series.colors,
                axes: plotAxes,
                highlighter: {
                    show: true,
                    tooltipLocation: 'n',
                    tooltipContentEditor: function(str, seriesIndex, pointIndex, jqPlot) {
                        return str.split(",")[1];
                    }
                },
                series: getSeries(),
                legend: legendOptions
            };
            myPlot = $.jqplot(plotString, seriesData, plotOptions);
            
            myPlot.replot();

			VignetteController.addResizeFunction(function () {
				if (graphContainer.is(':visible')) {
					myPlot.replot();
				}
			});
        }
	}

    // Draw the graphs once on load (due to jqplot bugs)
	VignetteController.addPageFlipListener(function (event) {
		if (event.type === "load") {
			drawGraph();
		}
		return true;
	});
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/bar-graph", callback);
};
