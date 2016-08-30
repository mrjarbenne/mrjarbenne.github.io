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
* The SharedData class.
* This class acts as a helper by passing data between vignette widgets.
* 
* @class SharedData
*/
var SharedData = {

	// The data dictionary.  Container for data to be shared.
	dict: {},

	// The listener container.
	listeners: {},
	
	widgetIds: [],

	/**
	 * Clears out the entry stored at <i>key</i>. (Sets it to <b>undefined</b>)
	 *  Does not notify listeners of the change.
	 * 
	 * @param {String} key the key pointing to the entry to be cleared
	 */
	clear: function (key) {
		SharedData.dict[key] = undefined;
	},

	/**
	 * Replaces the entries at <i>key</i> to <i>values</i>
	 * 
	 * @param {String} key the key for the value(s) to be added to the 
	 *                  dictionary
	 * @param {Object} values the value(s) to be added to the dictionary
	 * @param {int} pageNumber The page number to which the callback applies
	 */
	setter: function (key, values, pageNumber) {
		SharedData.dict[key] = [values];
		
		if (_.has(SharedData.listeners, pageNumber) && _.has(SharedData.listeners[pageNumber], key)) {
			$.each(SharedData.listeners[pageNumber][key], function (index, callback) {
				callback(values, pageNumber);
			});
		}
	},

	/**
	 * Adds the entry <i>values</i> to <i>key</i>
	 * 
	 * @param {String} key the key for the value(s) to be added to the 
	 *                  dictionary
	 * @param {Object} values the value(s) to be added to the dictionary
	 * @param {Function} sortFunc an optional parameter that will sort the
	 *                    values at key before notifying listeners
	 * @param {int} pageNumber The page number to which the callback applies
	 */
	adder: function (key, values, sortFunc, pageNumber) {
		if (typeof SharedData.dict[key] === "undefined") {
			SharedData.dict[key] = [];
		}

		SharedData.dict[key].push(values);

		if (typeof sortFunc === "function") {
			SharedData.dict[key].sort(sortFunc);
		}

		if (_.has(SharedData.listeners, pageNumber) && _.has(SharedData.listeners[pageNumber], key)) {
			$.each(SharedData.listeners[pageNumber][key], function (index, callback) {
				callback(values, pageNumber);
			});
		}
	},

    /**
	 * Checks the entry at <i>key</i>.
	 * 
	 * @param {String} key for the requested value(s) in the dictionary
	 * @returns {Boolean} value	depending if value was present or not
    */
	checkHasData: function (key) {
        if(typeof SharedData.dict[key] === "undefined") return false;
        else return true;
	},
    
	/**
	 * Gets the entry at <i>key</i>.
	 * 
	 * @param {String} key for the requested value(s) in the dictionary
	 * @returns {String} value in the dictionary at key
	 */
	getter: function (key) {
		return SharedData.dict[key];
	},

	/**
	 * Replaces the entry at <i>index</i> of <i>key</i> with <i>value</i>.
	 *
	 * @function replace
	 * @param {String} key the key of the data collection to be replaced
	 * @param {int} index the index of the value to be replaced
	 * @param {Object} value the new value to be used
	 * @param {Function} sortFunc an optional parameter that will sort the
	 *                    values at key before notifying listeners
	 * @param {int} pageNumber The page number to which the callback applies
	 *
	 */
	replace: function (key, index, value, sortFunc, pageNumber) {
		if (!_.has(SharedData.dict, key)) {
			SharedData.dict[key] = [];
		}

		if (_.has(SharedData.dict[key], index)) {
			SharedData.dict[key][index] = value;
		} else {
			SharedData.dict[key].push(value);
		}

		if (typeof sortFunc === "function") {
			SharedData.dict[key].sort(sortFunc);
		}
		
		if (_.has(SharedData.listeners, pageNumber) && _.has(SharedData.listeners[pageNumber], key)) {
			$.each(SharedData.listeners[pageNumber][key], function (index, callback) {
				callback(value, pageNumber);
			});
		}
	},

	/**
	 * Clears the entry at <i>index</i> of <i>key</i>.
	 *
	 * @param {String} key the key of the data collection to be cleared
	 * @param {int} index the index of the value to be cleared
	 *
	 */
	clearEntry: function (key, index) {
		if (typeof SharedData.dict[key] === "undefined") {
			return;
		}

		if (typeof SharedData.dict[key][index] !== "undefined") {
			SharedData.dict[key].splice(index, 1);
		}
	},

	/**
	 * Adds an event listener to the entry at <i>key</i>.
	 *  Note that these events are only called with new data -
	 *  they are not invoked when data is cleared.
	 * 
	 * @param {String} key the key to add the listener to
	 * @param {Object} callback the callback event
	 * @param {int} pageNumber The page number to which the callback applies
	 */
	addListener: function (key, callback, pageNumber) {
		// Check if the page has any listeners yet
		if( !_.has( SharedData.listeners, pageNumber ) ) {
			SharedData.listeners[pageNumber] = {};
		}
		
		// Check if there are any listeners in the current page
		// for the current key
		if (!_.has(SharedData.listeners[pageNumber], key)) {
			SharedData.listeners[pageNumber][key] = [];
		}
		
		// Add listener
		SharedData.listeners[pageNumber][key].push(callback);
	},
	
	/**
	 * Removes all event listeners on a given page
	 *
	 * @param {String} pageNumber The page from which to remove listeners
	 */
	removeListenersForPage: function (pageNumber) {
		if (_.has(SharedData.listeners, pageNumber))
		{
			// Delete all listeners for the page
			for( var key in SharedData.listeners[pageNumber] )
			{
				for( var listener in SharedData.listeners[pageNumber][key] )
				{
					delete SharedData.listeners[pageNumber][key][listener];
				}
				delete SharedData.listeners[pageNumber][key];
			}
			delete SharedData.listeners[pageNumber];
		}
	},
	
	/**
	 * Gets the current total amount of listeners for the vignette
	 */
	getTotalListeners: function() {
		var total = 0;
		
		for( var pageNumber in SharedData.listeners )
		{
			for( var key in SharedData.listeners[pageNumber] )
			{
				for( var listener in SharedData.listeners[pageNumber][key] )
				{
					total++;
				}
			}
		}
		
		return total;
	}
};
