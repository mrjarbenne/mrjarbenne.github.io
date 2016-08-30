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
* Reporter.
* This class handles reporting for the whole vignette.
*
* @class Reporter
* @property reportingOn     - tells the vignette whether reporting is activated
* @property pageReports     - holds the callbacks for the reporters for each page
* @property widgetReporters - holds the callbacks for the reporters for each widget
* @property startTime       - when the vignette was started
* @property userInfo        - the info obtained from a login widget
* @property vignetteData    - the JSON file of the vignette
* @property vignetteReport  - the current report for the entire vignette
*
*/
var Reporter = {
	//Attributes
	reportingOn: false,
	pageReporters: [],
	widgetReporters: {},
	startTime: 0,
	userInfo: ["NA"],
	vignetteData: {},
	vignetteReport: {},
    ivv: "",
    cid: -1,
    fname: "",
    lname: "",
    userEntry: ["","","","",""],
	
	/**
	 * Sets up and turns on reporting for the vignette. If reporting is not on
	 * the methods in this class will not execute
	 *
	 * @method startReporting
	 * @param data - json data of the vignette
	 */
	startReporting: function( data ) {
		//Turn on reporting
		this.reportingOn = true;
		
		//Set the start time
		this.startTime = +(new Date());
		
		//store the json data for the vignette
		this.vignetteData = data;
		
		//Set up the inital report structure
		this.vignetteReport = {
			start_time: this.startTime,
			user_info: this.userInfo,
			page_data: []
		};
		
		this.setUpVariables();
		this.initialReport(-1,0);
	},
	
	/**
	 * Sets the user info
	 *
	 * @method setUserInfo
	 * @param userInfo - The new user info
	 */
	setUserInfo: function( userInfo )
	{
		this.userInfo = userInfo;
		this.vignetteReport.user_info = this.userInfo;
	},
	
	/**
	 * Adds a page reporter to the pageReporters array at the specified page
	 *
	 * @method addPageReporter
	 * @param callback - callback for the page
	 * @param pageNum  - current page num
	 */
	addPageReporter: function( callback, pageNum ) {
		//Check if reporting is on
		if(!this.reportingOn) { return; }
		
		//Add a reporter for the page if it doesn't exist
		if(typeof this.pageReporters[pageNum] === "undefined") {
			this.pageReporters[pageNum] = callback;
		}
	},
	
	/**
	 * Adds a widget reporter to the widgetReporters array at the proper page num
	 *
	 * @method addWidgetReporter
	 * @param callback - callback for the widget
	 * @param pageNum  - page that the widget is on
	 * @param widgetID - ID of the widget to determine its key
	 */
	addWidgetReporter: function( callback, pageNum, widgetID ) {
		//Check if reporting is on
		if(!this.reportingOn) { return; }
		
		//Make sure the widget can be added at the correct page
		if(typeof this.widgetReporters[pageNum] === "undefined") {
			this.widgetReporters[pageNum] = {};
		}
		
		//Add the widget callback if it doesn't already exist
		if(typeof this.widgetReporters[pageNum][widgetID] === "undefined") {
			this.widgetReporters[pageNum][widgetID] = callback;
		}
	},
	
	/**
	 * Gets the report data for the given page
	 *
	 * @method getPageReportData
	 * @param pageNum  - page that the widget is on
	 */
	getPageReportData: function( pageNum )
	{
		if( typeof this.vignetteReport.page_data[pageNum] !== "undefined" )
		{
			return this.vignetteReport.page_data[pageNum];
		}
		
		return;
	},
	
	/**
	 * Gets the report data for the given widget on the given page number
	 *
	 * @method getWidgetReportData
	 * @param pageNum  - page that the widget is on
	 * @param widgetID - the ID for the widget given
	 */
	getWidgetReportData: function( pageNum, widgetID )
	{
		if( typeof this.vignetteReport.page_data[pageNum] !== "undefined" )
		{
			if( typeof this.vignetteReport.page_data[pageNum].widget_data[widgetID] !== "undefined" )
			{
				return this.vignetteReport.page_data[pageNum].widget_data[widgetID];
			}
		}
		
		return;
	},
	
	/**
	 * Compiles the information from all of the callbacks on the current page and writes the report
	 *
	 * @method runReports
	 * @param currentPage - The page that the vignette is currently on
	 */
	runReports: function( currentPage ) {
		//Check if reporting is on
		if(!this.reportingOn) { return; }
		
		//Set the report data for the current page
		if( typeof this.pageReporters[currentPage] !== "undefined" )
		{
			this.vignetteReport.page_data[currentPage] = this.pageReporters[currentPage]();
			
			//Set the report data for the widgets on the current page
			for(var key in this.widgetReporters[currentPage]) {
				this.vignetteReport.page_data[currentPage].widget_data[key] = this.widgetReporters[currentPage][key]();
			}
		}
		// Write the report
        
        // console.log("currentPage: "+currentPage);
		var latestPageCounter = this.getPageReportData(currentPage).page_visits.length;
		var time1 = this.getPageReportData(currentPage).page_visits[latestPageCounter-1][0];
		var time2 = this.getPageReportData(currentPage).page_visits[latestPageCounter-1][1];
		var duration = time2 - time1;
        
		this.writeReport();
        this.setUpVariables();
        this.writeReportToSql(currentPage, duration, this.getPageReportData(currentPage).widget_data);
	},
	
	/**
	 * Sends the report to the server
	 *
	 * @method writeReport
	 */
	writeReport: function() {
		if(!this.reportingOn) { return; }
		
		try
		{
			$.ajax({
				type: 'POST',
				url: 'report.php',
				data: this.vignetteReport,
				success: function (response) {
					//console.log(response);
				},
				error: function()
				{
					// file does not exist
				}
			});
		}
		catch (err)
		{
			Debug.log(err);
			Debug.log(err.message + " when attempting to report.");
		}
	},
    
	initialReport: function(currentPage, duration) {
		
		try
		{
			$.ajax({
				type: 'POST',
				url: 'reportToSql.php',
				data: {
                        ivv: this.ivv,	
                        cid: this.cid,
                        entry1: mainFirst,
                        entry2: mainSecond,
                        entry3: mainThird,
                        entry4: mainFourth,
                        entry5: mainFifth,
						current_page: currentPage,
						Duration: duration,
						Widget_keys1: "" ,
						Widget_values1: "" ,
						Widget_keys2: "" ,
						Widget_values2: "" ,
						Widget_keys3: "" ,
						Widget_values3: "" ,
						browserInfo: navigator.userAgent
                      },
				success: function (response) {
                    // console.log(response);
				},
				error: function()
				{
					// file does not exist
				}
			});
		}
		catch (err)
		{
			Debug.log(err);
			Debug.log(err.message + " when attempting to report.");
		}
	},
	
    writeReportToSql: function(currentPage, duration, widget_data) {
		
		var keyVector = [];
		var valueVector = [];
		
		$.each(this.getPageReportData(currentPage).widget_data, function(key, element) {
		 	keyVector.push(key);
			valueVector.push(JSON.stringify(element));
			// console.log('key: ' + keyVector + '\n' + 'value: ' + valueVector);
		});
		
        try
		{
			$.ajax({
				type: 'POST',
				url: 'reportToSql.php',
				data: {
                        data1: this.vignetteReport,
                        ivv: this.ivv,
                        cid: this.cid,
                        entry1: mainFirst,
                        entry2: mainSecond,
                        entry3: mainThird,
                        entry4: mainFourth,
                        entry5: mainFifth,
						current_page: currentPage,
						Duration: duration,
						Widget_keys1: keyVector[0] != null ? keyVector[0] : "" ,
						Widget_values1: valueVector[0] != null ? valueVector[0] : "" ,
						Widget_keys2: keyVector[1] != null ? keyVector[1] : "" ,
						Widget_values2: valueVector[1] != null ? valueVector[1] : "" ,
						Widget_keys3: keyVector[2] != null ? keyVector[2] : "" ,
						Widget_values3: valueVector[2] != null ? valueVector[2] : "" ,
						browserInfo: navigator.userAgent
                      },
				success: function (response) {
                    // console.log(response);
				},
				error: function()
				{
					// file does not exist
				}
			});
		}
		catch (err)
		{
			Debug.log(err);
			Debug.log(err.message + " when attempting to report.");
		}
	},
    
    setUpVariables: function() {
        var currentPath = window.location.pathname;
        pathSplit = currentPath.split('/');
        this.ivv = pathSplit[pathSplit.length - 4];
        this.cid = parseInt(pathSplit[pathSplit.length - 3]);
        this.userEntry[0] = this.getParameterByName("first");
        this.userEntry[1] = this.getParameterByName("second");
        this.userEntry[2] = this.getParameterByName("third");
        this.userEntry[3] = this.getParameterByName("fourth");
        this.userEntry[4] = this.getParameterByName("fifth");
    },
    
    
    
    getParameterByName: function(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }
};