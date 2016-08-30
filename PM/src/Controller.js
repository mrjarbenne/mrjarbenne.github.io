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
* VignetteEngine class.
* This class grabs the vignette's configuration and loads it for use.
*
* @class VignetteEngine
*/
var VignetteEngine = {
	// The root folder for the vignette to be loaded
	root: "../templates/",

	// The vignette container.  Used to store vignette page configuration
	vignette: [],

	// The data from the index.json file. Removes the need for some of the
	// getJSON calls
	jsonData: "",

	// Boolean to tell if the Vignette HTML Template has been loaded yet
	// Is also used to check if VignetteController has been initialized
	templateLoad: false,

	// Integer keeps track of what page you are currently loading
	// so the Listeners go on the proper pages
	listenerPage: -2,

	// The root for requests for different JSON files, overridden by tests
	dataRoot: "",
	
	// The total amount of pages for the vignette
	totalPages: -1,

	/**
	 * Loads the vignette page's configuration
	 *
	 * @method loadVignette
	 */
	loadVignette: function () {
		// Assuming the first page is an Intro, and there is no branching from page 0
		// to any other pages
		VignetteEngine.vignette = VignetteEngine.loadPage("index.json", [0]);
	},

	/**
	 * Loads and populates a template based on given data and url.
	 *
	 * @method loadTemplate
	 * @param {Object} data The data specified in the JSON
	 * @param {Int} index The index of this child within the parent JSON
	 */
	loadTemplate: function (data, index) {
		// Get the url of the template to be loaded
		var template_url = VignetteEngine.getTemplateUrl(data), html;
		Debug.log("Compiling " + template_url);

		// Load and compile the template
		$.get(template_url + "/index.html", function (template) {
			try {
				if (data.data.sources !== undefined) {
					var navAgent = navigator.userAgent;
					var isFirefox = navAgent.indexOf("Firefox");
					var isChrome = navAgent.indexOf("Chrome");

					if (isFirefox != -1 || isChrome != -1) {
						for (var i = 0; i < data.data.sources.length; i++) {
							if (data.data.sources[i].type === "video/mp4") {
								data.data.sources.splice(i, 1);
							}
						}
					}
				}
				
				if (data.layout.type === "page") {
					// Apply a page ID
					data.data.id = "page-" + index;
					// Inform vignette controller of a new page
					VignetteController.registerPage();
				} else if (data.layout.type === "widget") {
					// Inform vignette controller of a new widget
					VignetteController.registerWidget(data.data.id);
				}
				// Proceed to compiling template

				html = $('<div class="' + data.layout.type + '">'
						+ _.template(template, data.data)
						+ '</div>');
						
			} catch (err) {
				// There was an error, report it
				Debug.log(err);
				Debug.log(err.message + " in compiling "
					+ data.layout.type + " template.");
			}
		});
		return html;
	},

	/**
	 * Applies post processing scripts to the html context
	 *
	 * @method applyScripts
	 * @param {String} template_url The url of the post processing to be run
	 * @param {String} html The context for individual widget post processing
	 * @param {Object} data The data specified in the JSON
	 * @param {int} pageNumber The page number to which the script applies
	 */
	applyScripts: function (template_url, html, data, pageNumber) {
		$.getScript(template_url + "/../postProcess.js", function () {
			// Use to easily tell if getScript is being synchronous
			// Debug.log("Doing it");
			if (window.handler !== undefined) {
				try {
					window.handler();
					var callbackName = data.layout.type;
					
					Registry.run(callbackName, html, data.data, pageNumber);
				} catch (err) {
					Debug.log(err);
					Debug.log(err.message + " in generic " +
						data.layout.type + " postProcess.js");
				}
			}
		});
		
		// Use to easily tell if getScript is being synchronous
		// Debug.log("After doing it");

		$.getScript(template_url + "/postProcess.js", function () {
			if (window.handler !== undefined) {
				try {
					window.handler();
					var callbackName = data.layout.type + "/" +
						data.layout.template;
						
					Registry.run(callbackName, html, data.data, pageNumber);
				} catch (err) {
					Debug.log(err);
					Debug.log(err.message + " in " + template_url + "/postProcess.js");
				}
			}
		});
	},

	/**
	 * Sets up an object that is known to be a vignette with the appropriate metadata and reporting options
	 *
	 * @method setupVignetteObject
	 * @param {Object} data a JavaScript object that should be treated as a vignette
	 */
	setupVignetteObject: function (data) {
		data.layout = {};
		// Set layout type
		data.layout.type = "vignette";
		// Mobile template mumbo jumbo
		var mobile = (/iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase()));

		if (data.data.force_template !== undefined) {
			data.layout.template = data.data.force_template;
		} else if (mobile) {
			data.layout.template = "normal";
		} else {
			data.layout.template = "normal";
		}

		//Report.config(data.data);
		// TODO: provide an option for the user to actually use mobile
		//  template or not

		return data;
	},

	/**
	 * Gets the URL of the template for a given data object
	 *
	 * @method getTemplateUrl
	 * @param {Object} data a JavaScript object that can be used to fill out a template
	 */
	getTemplateUrl: function (data) {
		return VignetteEngine.root + data.layout.type + "/" + data.layout.template;
	},

	/**
	 *  Iterate over a given array of pages to load and recursively
	 *  load each item inside the pages
	 *
	 *  @param {String} json_file The name of the json file containing the page information
	 *  @param {Array<Number>} pages Array of pages to be loaded into the DOM
	 */
	loadPage: function (json_file, pages) {
		var html, i;
		$.getJSON(json_file, function (data) {
			
			// Start reporting if this is the first thing being
			// loaded (the vignette itself)
			if( pages.length === 1 && pages[0] === 0 )
			{
				Reporter.startReporting( data.data );
			}
		
			// The total amount of pages for the vignette
			totalPages = data.elements.length;
			
			//if no layout defined, treat as vignette
			if (data.layout === undefined) {
				data = VignetteEngine.setupVignetteObject(data);
				VignetteEngine.jsonData = data;
			}
			// Compile the Template if it has not yet been compiled
			// Also initialize the listener objects/arrays
			if (!VignetteEngine.templateLoad) {
				html = VignetteEngine.loadTemplate(data, 0);
				for (i = 0; i < VignetteEngine.jsonData.elements.length; i += 1) {
					VignetteController.pageFlipListeners[i] = {};
					//VignetteController.reportListeners[i] = [];
				}
			}

			// If more pages than the threshold, don't load any of them
			// Otherwise, load the load_list for the page if it exists
			if (pages.length >= VignetteController.threshold) {
				if (data.elements[VignetteController.pageForward[VignetteController.targetBranch]].load_list !== undefined) {
					pages = data.elements[VignetteController.pageForward[VignetteController.targetBranch]].load_list;
				} else {
					return html;
				}
			}
			// Load each specified page	
			$.each(pages, function (index, num) {
				// Skip loading this page if it's already loaded and the
				// VignetteController has already been initialized
				if (_.contains(VignetteController.pastPages, num) && VignetteEngine.templateLoad || num === -1) {
					return;
				}

				// Save the page number for listeners
				VignetteEngine.listenerPage = num;
				
				// Load page elements and widgets
				VignetteController.pastPages.push(num);
				var childHTML = VignetteEngine.loadRecursive(
					VignetteEngine.dataRoot + data.elements[num].type + "/" + data.elements[num].data,
					num, num
				);
				$(data.elements[index].slot, html).append(childHTML);
			});
			//Only load the Vignette/normal postProcess.js once
			if (!VignetteEngine.templateLoad) {
				VignetteEngine.applyScripts(VignetteEngine.getTemplateUrl(data), html, data, -1);
				VignetteEngine.templateLoad = true;
			}
		});
		return html;
	},

	/**
	 * Recursively loads a vignette page's configuration given a JSON file.
	 *
	 * @method loadRecursive
	 * @param {Object} json_file The json file to begin recursive loading
	 * @param {Int} num The index of this child within the parent JSON
	 * @param {int} pageNumber The page number to which the script applies
	 */
	loadRecursive: function (json_file, num, pageNumber) {
		var html;
		$.getJSON(json_file, function (data) {
			// Compile the template
			html = VignetteEngine.loadTemplate(data, num);
			// Iterate over children and insert HTML into slots
			if (data.elements !== undefined) {
				$.each(data.elements, function (index, element) {
					var childHTML = VignetteEngine.loadRecursive(
						VignetteEngine.dataRoot + element.type + "/" + element.data,
						num, pageNumber
					);
					
					// Make some widgets mobile / normal template only
					if (element.limit_to !== undefined) {
						$(childHTML).each(function (i, elem) {
							$(elem).toggleClass(element.limit_to, true);
						});
					}

					$(element.slot, html).append(childHTML);
				});
			}
			VignetteEngine.applyScripts(VignetteEngine.getTemplateUrl(data), html, data, pageNumber);
		});
		return html;
	}
};

/**
* This class loads the elements of a vignette page into the DOM
*
* @class VignetteController
* @global
* @constructor
*/
var VignetteController = {
	flattened: false,
	currentPage: -1,
	currentWidget: -1,
	pageFlipListeners: [],
	//reportListeners: [],
	pageStringElements: [],
	resizeFunctions: [],
	pageForward: 0,
	targetBranch: 0,
	pageNode: -2,
	visited: [],
	pastPages: [],
	requiredPages: [0, 1],
	// Threshold controls the max number of pages loaded at once
	// in the vignette. Set by the designer, default of 7.
	threshold: 7,
    startTime: +(new Date()),


	/**
	 * This method initializes the VignetteController when a vignette
	 * is loaded
	 *
	 * @method init
	 */
	init: function () {
		if (VignetteEngine.jsonData.data.threshold) {
			VignetteController.threshold = VignetteEngine.jsonData.data.threshold;
		}
		Debug.log("Loaded Vignettes: " + VignetteEngine.vignette);
		// Set up resize magic
		var resizer;
		$(window).resize(function (event) {
			$("#load-block").show();
			clearTimeout(resizer);
			resizer = setTimeout(function () {
				VignetteController.executeResizes();
				$("#load-block").hide();
			}, 500);
		});
		// Add the whole vignette to the container
		$("#container").append(VignetteEngine.vignette);

		// Display the first page
		VignetteController.showPage(0);
		
	},

	/**
	 * Updates the current page count in the controller while templates are
	 * being loaded, this is necessary for the proper functioning of page flip
	 * listeners
	 *
	 * @method registerPage
	 * @param index not used
	 */
	registerPage: function (index) {
		var self = VignetteController;
		if (self.pageFlipListeners.length <= VignetteEngine.jsonData.elements.length) {
			self.pageFlipListeners.push({});
			//self.reportListeners.push([]);
			self.currentPage += 1;
		}


	},

	/**
	 * Updates the current widget id in the controller while templates are
	 * being loaded, this is necessary for the proper functioning of page flip
	 * listeners
	 *
	 * @method registerWidget
	 * @param {String} id The id of the widget being loaded
	 */
	registerWidget: function (id) {
		var self = VignetteController;
		// Initialize page flip listener for this widget to null
		self.pageFlipListeners[VignetteEngine.listenerPage][id] = null;
		// Update current widget
		self.currentWidget = id;
	},

	/**
	* This method is used to facilitate page branching.
	*
	* @method setPageNode
	* @param {int} pgNode number of a branching widget.
	*/
	setPageNode: function (pgNode) {
		VignetteController.pageNode = pgNode;
	},

	/**
	* This method is used to facilitate page branching. Loads pageForward
	* with all possible paths(branches) of the current page.
	*
	* @method loadPageTurnData
	*/
	loadPageTurnData: function () {
		var curPage = VignetteController.currentPage;
		VignetteController.pageForward = VignetteEngine.jsonData.elements[curPage].next_page;
	},

	/**
	* Sets the targetBranch to the selected index choice from question
	*
	* @method setTargetBranch
	*/
	setTargetBranch: function (targetPage) {
		VignetteController.targetBranch = targetPage;
	},

	/**
	 * This method hides the current page and shows the next page
	 *
	 * @method showPage
	 * @param page_num the number of the page to be displayed
	 */
	showPage: function (page_num) {
		var self = VignetteController,
			// Cache a jQuery selector that we use multiple times in
			// this function
			page_nav_element = $("#pagenav");

		if (page_num >= 0 && page_num < VignetteEngine.jsonData.elements.length) {
			// unload all unnecessary pages & listeners
			self.unloadPages(self.pastPages);
			self.currentPage = page_num;
			self.loadPageTurnData();
			self.targetBranch = 0;
            self.startTime = +(new Date());

			// If a prior branch question was answered, use the previous data
			// A page click event will add this data if it does not exist and bypass
			// pages that do not have a branching option
			if (SharedData.dict[self.currentPage] !== undefined) {
				self.targetBranch = SharedData.dict[self.pageNode];
			}
			
			// Hide current page (if any)
			$(".page").hide();

			// Show the page to be loaded
			$("#page-" + page_num).parent().show();
			
			// Trigger resize
			self.executeResizes();
			// Toggle buttons based on page_num
			page_nav_element.find(".left").toggleClass("hidden_text", page_num === 0);
			// Checks if current page is an ending page(finish.php).
			page_nav_element.toggleClass("last",
				self.pageForward[0] === -1);
			// Update page number
			$(self.pageStringElements).each(function (i, v) {
				v.html(self.getPageString());
			});
			// Notify page listeners of page load
			self.checkPageFlipListeners(
				{
					type: "load"
				}
			);

			Reporter.addPageReporter( function() {
				var oldData = Reporter.getPageReportData( page_num );
				var endTime = +(new Date());
				var timeSpent = calcTimeSpent(self.startTime, endTime);
				var pageVisit = [self.startTime, endTime , timeSpent];
				var data = self.currentWidget;
				
				if(typeof oldData === "undefined") {
					return {
						page_id: data.id,
						widget_data: {},
						page_visits: [pageVisit]
					};
				} else {
					oldData.page_visits.push( pageVisit );
					return oldData;
				}
			}, page_num );
	
			function calcTimeSpent(st, et) {
				var hour, min, sec;
				var timeSpent = (et - st) / 1000;
				hours = parseInt( timeSpent / 3600 ) % 24;
				minutes = parseInt( timeSpent / 60 ) % 60;
				seconds = timeSpent % 60;

				var result = (hours < 10 ? "0" + hours : hours) + " hr, " + (minutes < 10 ? "0" + minutes : minutes) + " min, " + (seconds  < 10 ? "0" + seconds : seconds) + " sec";
				return result;
			}
			
			// Want to make forward/back buttons more sensible?
			//  Look at the function below:
			//if (typeof window.history.pushState === "function") {
			//	window.history.pushState(null, page_num, page_num);
			//}
			// And this library: https://github.com/balupton/History.js
			//  Especially if you need it to work for IE9
		}
	},

	/**
	 * Method that unloads any non-required page
	 *
	 * @method unloadPages
	 * @param {Array}<Int> pages the self.pastPages Array
	 */
	unloadPages: function (pages) {
		var self = VignetteController;

		// The list of pages to remove from pastPages
		var removablePages = [];
		
		$.each(pages, function (index, num) {
			// If this page isn't the end page
			if (num !== -1) {
				// Remove DOM elements and listeners for this page if
				// it does not need to be kept loaded
				if (!_.contains(self.requiredPages, num)) {
					$("#page-" + num).parent().remove();
					//self.reportListeners[num] = [];
					SharedData.removeListenersForPage(num);
					removablePages.push(num);
				
					self.pageFlipListeners[num] = {};
				}

				// Remove any pages that have been marked to be removed from
				// pastPages
				self.pastPages = _.reject(self.pastPages, function (item) {
					return (_.contains(removablePages, item));
				});
			}
		});
	},

	/**
	 * This method returns a string telling us which page is loaded
	 *
	 * @method getPageString
	 */
	getPageString: function () {
		var totalPages, result = "";

		// Show the current page if it is requested
		if (VignetteEngine.jsonData.data.show_current_page) {
			result = "Page " + (VignetteController.currentPage + 1);

			// Also show the total number of pages if it is requested
			if (VignetteEngine.jsonData.data.show_total_pages) {
				// Get the total pages and add the number of extra pages if it is
				// specified
				totalPages = VignetteEngine.jsonData.elements.length
					+ (VignetteEngine.jsonData.data.extra_pages || 0);

				result += " of " + totalPages;
			}
		}

		return result;
	},

	/**
	 * This method check to see if an integer is in the Required Page list and adds
	 * it if it is not
	 *
	 * @method addRequiredPage
	 * @param {Int} page integer representing the page that needs to be loaded
	 */
	addRequiredPage: function (page) {
		var self = VignetteController;
		if (!_.contains(self.requiredPages, page)) {
			self.requiredPages.push(page);
		}
	},

	/**
	 * This method loads the elements of the next vignette page into
	 * the DOM
	 *
	 * @method nextPage
	 * @param click_event jQuery click event details
	 * @param send_report true if a report should be sent
	 */
	nextPage: function (click_event, send_report) {
		var self = VignetteController,
			targetPage,
			// Set up the page flip event
			event = {
				type: "flip",
				direction: "forward"
			};

		// Check listeners and proceed
		if (self.checkPageFlipListeners(event).ready) {
			$("#pagenav .left").show();
			//Push current page onto visited list before moving on to next page.
			if (self.currentPage !== self.visited[(self.visited.length) - 1]) {
				self.visited.push(self.currentPage);
			}
			
			/*if (send_report) {
				Report.sendReport(self.getReports(),
						[{direction: "Continue"}]
					);
			}*/
			Reporter.runReports( self.currentPage );

			// Resets the required pages array and repopulate it with
			// the current page and its neighbors
			self.requiredPages = [];
			self.addRequiredPage(self.pageForward[self.targetBranch]);
			
			self.addRequiredPage(_.last(self.visited));
			
			if( typeof VignetteEngine.jsonData.elements[self.pageForward[self.targetBranch]] !== "undefined" )
			{
				var reqPages = VignetteEngine.jsonData.elements[self.pageForward[self.targetBranch]].next_page;
				$.each(reqPages, function (i, page) {
					if (page === -1) {
						return;
					}
					self.addRequiredPage(page);
				});
			
				//Show the loading bar until all pages are loaded
				LoadUtilities.showLoading();
				//Load all pages in RequiredPages array
				VignetteEngine.vignette = VignetteEngine.loadPage("index.json", self.requiredPages);

				// hides the loading bar after everything is loaded
				LoadUtilities.loadComplete();
				
				self.showPage(self.pageForward[self.targetBranch]);
			}
		} else {
			// Prevents anything from happening when the user tries to switch
			// pages if the page flip listeners are not ready
			click_event.preventDefault();
			
			// Undoes the attempt at page flipping for all widgets
			// @TODO Look into a better way of doing this
			//this.prevPage( click_event, send_report );
		}
	},

	/**
	 * This method loads the elements of the previous vignette page
	 * into the DOM
	 *
	 * @method prevPage
	 */
	prevPage: function (click_event, send_report) {
		var self = VignetteController,
			// Set up the page flip event
			event = {
				type: "flip",
				direction: "backward"
			};

		// Set up the pages required to load
		self.requiredPages = [];
		self.addRequiredPage(_.last(self.visited));
		
		/*
		if (_.last(self.visited) - 1 !== undefined) {
			self.addRequiredPage(_.last(self.visited) - 1);
		}
		*/
/*		if( self.visited[0] !== undefined ) {
			self.addRequiredPage( self.visited[0] );
		}*/
		
		// Get the next page(s) of the page that you will be showing
		VignetteController.pageForward = VignetteEngine.jsonData.elements[_.last(self.visited)].next_page;
		$.each(self.pageForward, function (i, page) {
			if (page === -1) {
				return;
			}
			self.addRequiredPage(page);
		});

		// Check listeners and proceed
		if (self.checkPageFlipListeners(event).ready) {
			/*if (send_report) {
				Report.sendReport(self.getReports(),
						[{direction: "Back"}]
					);
			}*/
			Reporter.runReports( self.currentPage );
			
			//show the loading bar until all pages are loaded
			LoadUtilities.showLoading();
			VignetteEngine.vignette = VignetteEngine.loadPage("index.json", self.requiredPages);

			//Hides the loading bar once everything is loaded
			LoadUtilities.loadComplete();
			// Remove the last visited page from the history
			self.showPage(self.visited[(self.visited.length) - 1]);
			self.visited.pop();

			//End addition

		}
	},

	/**
	 * This method adds a function to be called on resize
	 *
	 * @method addResizeFunction
	 * @param callback	The function to be called on resize
	 */
	addResizeFunction: function (callback) {
		VignetteController
			.resizeFunctions
			.push(callback);
	},

	/**
	 * This method executes all registered resize functions
	 *
	 * @method executeResizes
	 */
	executeResizes: function (callback) {
		$(VignetteController.resizeFunctions)
			.each(function (index, callback) {
				callback();
			});
	},

	/**
	 * This method adds a listener to the page flip event
	 *
	 * @method addPageFlipListener
	 * @param callback	The handler for the listener callback for widgets
	 */
	addPageFlipListener: function (callback) {
		VignetteController.pageFlipListeners[VignetteEngine.listenerPage][VignetteController.currentWidget] = callback;
	},

	/**
	 * This method notifies all page flip listeners for the current page and
	 * checks whether they are ready for a page flip
	 *
	 * @method checkPageFlipListeners
	 * @param event	The type of event passed to widgets
	 */
	checkPageFlipListeners: function (event) {
		var self = VignetteController,
			widgetCallback,
			// Initialize the response tuple
			resp = {
				ready: true,
				widgetsFailed: []
			};
			
		if (!self.flattened) {
			// Iterate over each widget for the current page
			_.each(
				self.pageFlipListeners[self.currentPage],
				function (callback, widget_id, listeners) {
					if (callback !== null) {
						if (!callback(event)) {
							// Listener isn't ready
							resp.ready = false;
							resp.widgetsFailed.push(widget_id);
						}
					}
				}
			);
		} else {
			// The template is mobile, check the current widget
			widgetCallback = self.pageFlipListeners[self.currentWidget];
			if (widgetCallback !== undefined) {
				if (!widgetCallback(event)) {
					// Listener isn't ready
					resp.ready = false;
					resp.widgetsFailed.push(self.currentWidget);
				}
			}
		}
		
		return resp;
	},

	/**
	 * This method flattens page flip listeners to one widget per page
	 *
	 * @method flattenPageFlipListeners
	 */
	flattenPageFlipListeners: function () {
		var self = VignetteController,
			temp = {};
		_.each(self.pageFlipListeners, function (widgets, index) {
			_.each(widgets, function (callback, id, list) {
				if (callback !== null) {
					temp[id] = callback;
				}
			});
		});
		self.pageFlipListeners = temp;
		self.flattened = true;
	},

	/**
	 * This method adds a listener to the report event
	 *
	 * @method addReportListener
	 * @param callback the handler for the listener callback for widgets
	 */
	/*addReportListener: function (callback) {
		VignetteController
			.reportListeners[VignetteEngine.listenerPage]
			.push(callback);
	},*/
	/**
	 * This method asks all report listeners for any data they need
	 *  to send and pushes them onto a list.
	 *
	 * @method aggregateReports
	 */
	/*getReports: function () {
		var reports = [];
		$(VignetteController
			.reportListeners[VignetteController.currentPage])
			.each(function (index, callback) {
				reports.push(callback());
			});

		return reports;
	},*/
	/**
	 * This method sets the current widget ID.
	 */
	setCurrentWidget: function (widgetId) {
		VignetteController.currentWidget = widgetId;
	},

	/**
	 * Randomize the questions in a question widget
	 */
	randomizeQuestions: function(context, data, pageNumber) {
		// Set up the order of the questions
		var order = SharedData.getter(data.exports_to+"_rand_order");
		if (typeof order == "undefined") {
			// If there's no value stored in order, make a new one
			var questions = [];
			for (var i = 0; i < data.question_answers.length; i++) {
				questions.push(i);
			}
			order = _.shuffle(questions);
			SharedData.setter(data.exports_to+"_rand_order", order, pageNumber);
		} else {
			// If there's a value in order, it's a string, so make it an array
			order = JSON.parse("[" + order + "]");
		}

		// Apply the order to the page
		var parent = $(".question_answers", context);
		var answers = parent.children("p");
		answers.detach();
		for (var i = 0; i < order.length; i++) {
			parent.append(answers[order[i]]);
		}
	}
};
