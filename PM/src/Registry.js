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
 * A central registration singleton for post processing callbacks.
 *
 * @class Registry
 */
var Registry = {

	// The postProcess callbacks
	callbacks: {},

	/**
	 * Registers a given callback function to the given string key.
	 *
	 * @param {String} str the key to register to
	 * @param {function} callback the callback to register
	 *
	 */
	register: function (str, callback, pageNumber) {
		Registry.callbacks[str] = callback;
	},

	/**
	 * Runs the specified callback with context and data.
	 *
	 * @param {String} str the key of the registered function to run
	 * @param {Object} context the HTML context for the postProcessing to 
	 *                  operate on.
	 * @param {Object} data the vignette/page/widget JSON to use as options
	 * @param {int} pageNumber The page number to which the callback applies
	 *
	 */
	run: function (str, context, data, pageNumber) {
		if (typeof Registry.callbacks[str] !== "undefined") {
			Registry.callbacks[str](context, data, pageNumber);
		}
	}
};