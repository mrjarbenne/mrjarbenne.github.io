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

 
 /**
 * Global Debugging singleton.  Provides utilities for logging and alerting.
 *  Also intercepts and prepares jQuery before Loader uses any of it.
 *
 * @class Debug
 * @property {boolean} debug whether or not Debug is set to log and alert
 */
var Debug = {

	// Whether or not to actually do console logging and alerting
	debug: true,

	/**
	 * Executes before Loader starts loading.  Can override default jQuery
	 *  parameters (see $.ajaxSetup) and could consider overriding $.getScript
	 *  in order to be able to see JS files listed in chrome.
	 *
	 */
	prepare: function () {
		// Does the URL contain debug=true?
		Debug.debug = (/debug=true/i.test(window.location));

		if (Debug.debug) {
			$.ajaxSetup({
				async: false,
				crossDomain: false,
				//crossDomain: true,  // Forces $.getScript to be async, bad
				cache: false
			});
		} else {
			$.ajaxSetup({
				async: false,
				crossDomain: false,
				cache: true
			});
		}

		// Use to print stuff anyway
		//Debug.debug = true;
	},

	/**
	 * Logs output to console, assuming it exists and we're debugging.
	 *
	 * @param {String} str the string to print
	 *
	 */
	log: function (str) {
		if (_.has(window, "console") && Debug.debug) {
			console.log(str);
		}
	},

	/**
	 * Pops up an alert dialog, assuming we're debugging.
	 *  It's a wrapper around window.alert(str).
	 *
	 * @param {String} str the string to alert
	 *
	 */
	alert: function (str) {
		if (Debug.debug) {
			alert(str);
		}
	}
};

Debug.prepare();