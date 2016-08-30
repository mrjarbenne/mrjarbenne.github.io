/**
 * Copyright (c) 2014, Interactive Video Vignettes Project at Rochester Institute of Technology.
 * <ivv.rit.edu>
 * <www.compadre.org/ivv>
 * This software is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 license
 * <http://creativecommons.org/licenses/by-nc-sa/4.0/>. You may not use this software for commercial
 * purposes without written permission from Rochester Institute of Technology; If you alter,
 * transform, or build upon this software, you may distribute the resulting software only under the same
 * or similar license to this one.
 */

 
 "use strict";

/**
* The LoadUtilities class.
* This class sets up initial page dependencies and triggers the VignetteEngine
* to load the page.
* 
* @class LoadUtilities
*/
var LoadUtilities = {
	init: 0,
	/**
	 * This method marks the beginning of a vignette being loaded.
	 */
	beginLoading: function () {
		// Remove JavaScript warning
		$("#container").html("");
		LoadUtilities.showLoading();
	},
	/**
	 * This method adds the loading div to the page.
	 */
	showLoading: function () {
		// Insert loading status div once; any other time, just show it
		if (LoadUtilities.init !== 1) {
			var loadBlock = document.createElement('div');
			LoadUtilities.init = 1;
			$(loadBlock).attr("id", "load-block").appendTo("#container");
		} else {
			$("#load-block").show();
		}

	},
	/**
	 * This method marks the end of a vignette being loaded.
	 */
	loadComplete: function () {
		// Hide loading status div
		$("#load-block").hide();
	}
};

String.prototype.truncate = function(n, useWordBoundary){
	var tooLong = this.length>n,
		str = tooLong ? this.substr(0,n-1) : this;
	str = useWordBoundary && tooLong ? str.substr(0,str.lastIndexOf(' ')) : str;
	return  tooLong ? str + '&hellip;' : str;
};

/**
* The "main" method.  Dependencies are set up here.
*/
$(function () {
	// If we're here, client has JavaScript
	LoadUtilities.beginLoading();

	// Declared inside function to prevent namespace conflicts
	var config = {
		"root": "../",
		"scripts": [
			"lib/jquery.jqplot.min.js",
			"lib/jqplot.canvasTextRenderer.min.js",
			"lib/jqplot.canvasAxisLabelRenderer.min.js",
			"lib/jqplot.trendline.min.js",
			"lib/jqplot.categoryAxisRenderer.js",
			"lib/jqplot.dragableModel.js",
			"lib/jquery.dataTables.min.js",
			"lib/jqplot.barRenderer.min.js",
			"lib/jqplot.highlighter.js",
			"lib/mediaelement-and-player.js",
			"lib/underscore.js",
			"lib/class.js",
			"lib/jquery-ui.min.js",
			"lib/jquery.vimeo.api.min.js",
			"src/VignetteDrivers.js",
			"src/ScrubBar.js",
			//"src/Report.js",
			"src/Reporter.js",
			"src/Registry.js",
			"src/ImagePlayer.js",
			"src/Controller.js",
			"src/CanvasEngine.js",
			"src/DrawLib.js",
			"src/AnalysisHandlers.js"
		]
	};

	var index = 0;
	// And attach all the script dependencies
	var loadNext = function () {
		if (index < config.scripts.length) {

			$.getScript(config.root + config.scripts[index], function () {
				index += 1;
				setTimeout(loadNext,1);
			});
		} else {
			VignetteEngine.loadVignette();
			VignetteController.init();
			LoadUtilities.loadComplete();

			//Report.sendReport([], []);
		}
	};
	loadNext();
});
