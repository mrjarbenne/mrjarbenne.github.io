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
 
 
var ScrubBar = Class.extend(

// ---- Begin ScrubBar ----
/**  @lends ScrubBar.prototype */
		{

	// The context of the scrub bar
	context: 0,
	
	// The ui elements on the same bar as the scrub bar
	uiElements: [],
	
	// The selector referring to this scrub bar
	selector: '',
	
	// The exportsTo in the widget JSON data that has a scrub bar
	exportsTo: '',
	
	// The image player that this scrub bar is linked with
	imagePlayer: 0,
	
	// The page that the scrub bar is on
	pageNumber: -1,
	
	// Handle dragging
	mouseDown: false,
	
	// The callback for when the scrub bar updates
	onUpdate: function(){},
	
	// The callback for when the image player's frame flips
	onMouseDrag: function(){},
	

	/**
	 * <b>Class Overview:</b><br />
	 * This class acts as a scrub bar for widgets that need to
	 * scrub through a bunch of visual data
	 * <br /><br />
	 * <b>Constructor:</b><br />
	 * The constructor for scrub bars.
	 *
	 * @constructs
	 * @memberOf ScrubBar
	 * @param {Array} selector an array of the objects to show/hide
	 *
	 */
	init: function ( widgetDiv, selector, exportsTo, context, imagePlayer, pageNumber )
	{
		// The magic to allow functions to be used as callbacks directly
		//  Otherwise, JS would throw errors when you try, for example,
		//   $(whateverObjects).click(myObject.function)
		// Use this in every class's init function for paranoia
		_.bindAll(this);
		
		this.uiElements = [];
		
		this.widgetDiv = widgetDiv;
		this.context = context;
		this.selector = selector;
		this.exportsTo = exportsTo;
		this.imagePlayer = imagePlayer;
		this.pageNumber = pageNumber;
		
		this.setUpMouse();
	},

	getTotalWidthOfElement: function( elementSelector )
	{
		var element = $( elementSelector, this.context );
		if( element.length === 0 ) return 0;
		return parseInt( element.outerWidth(true) );
	},
	
	/**
	 * Resize the scrub bar to fit the remaining area in the frame player
	 */
	resize: function()
	{
		var widgetWidth = $(this.widgetDiv, this.context).width();
		var paddingL = $(this.selector, this.context).css('padding-left');
		var paddingR = $(this.selector, this.context).css('padding-right');
		var padding = parseInt(paddingL) + parseInt(paddingR);
		var marginL = $(this.selector, this.context).css('margin-left');
		var marginR = $(this.selector, this.context).css('margin-right');
		var margin = parseInt(marginL) + parseInt(marginR);
		
		var buttonsTotalWidth = 0;
		
		for( var i = 0; i < this.uiElements.length; i++ )
		{
			buttonsTotalWidth += this.getTotalWidthOfElement( this.uiElements[i] );
		}
		
		$(this.selector, this.context).width( widgetWidth - padding - margin - buttonsTotalWidth - 1 );
		this.updateProgress();
		
		// Keep refreshing the scrub bar (with a timeout) until everything
		// has been loaded correctly
		if( $(this.selector, this.context).width() === 0 )
		{
			this.refresh();
		}
	},
	
	/**
	 * Updates the width of the progress bar to indicate how far the user
	 * is into the animation
	 */
	updateProgress: function( desiredPercentage )
	{
		if( typeof desiredPercentage === "undefined" )
		{
			desiredPercentage = this.imagePlayer.index / ( this.imagePlayer.selector.length - 1 );
		}
		
		$(this.selector + " > .meter", this.context).width( $(this.selector, this.context).width() * desiredPercentage );
		
		this.onUpdate();
	},
	
	/**
	 * Adds a UI Element to be taken into account for size calculations
	 * -- All added elements should be on the same bar that the scrub bar is on
	 */
	addUIElement: function( elementSelector )
	{
		this.uiElements.push( elementSelector );
	},
	
	/**
	 * Sets up callbacks for mouse events that the scrub bar needs
	 */
	setUpMouse: function()
	{
		var self = this;
		
		$(document).mouseup(function (event) {
			if( VignetteController.currentPage !== self.pageNumber ) return;
			
			self.mouseDown = false;
		});
		
		$(self.selector + " > .meter", self.context).mousedown(function (event) {
			if( VignetteController.currentPage !== self.pageNumber ) return;
			
			self.mouseDown = true;
			self.adjustToMouse( event );
		});
		
		$(self.selector, self.context).mousedown(function (event) {
			if( VignetteController.currentPage !== self.pageNumber ) return;
		
			self.mouseDown = true;
			self.adjustToMouse( event );
		});
		
		$(document).mousemove(function (event) {
			if( VignetteController.currentPage !== self.pageNumber ) return;
			
			self.adjustToMouse( event );
		});
	},
	
	/**
	 * Adjusts the progress bar to the mouse
	 */
	adjustToMouse: function(event)
	{
		if( this.mouseDown ) {
			var offsetX = event.clientX - $(this.selector, this.context).offset().left;
			var desiredPercentage = offsetX / $(".scrub_bar", this.context).width();
			
			// Keep percentage in bounds
			desiredPercentage = Math.min( 1, Math.max( 0, desiredPercentage ) );
			
			var desiredFrame = Math.round( ( this.imagePlayer.selector.length - 1 ) * desiredPercentage );
			this.imagePlayer.flipTo(desiredFrame);
			this.onMouseDrag(desiredFrame);
			this.updateProgress(desiredPercentage);
			
			// Prevent user from being able to highlight elements
			// in the browser as he drags the mouse to scrub
			if( event.stopPropagation ) event.stopPropagation();
			if( event.preventDefault ) event.preventDefault();
			event.cancelBubble = true;
			event.returnValue = false;
			return false;
		}
	},
	
	/**
	 * Gets the percentage scrubbed with the bar
	 */
	getPercentage: function()
	{
		return $(this.selector + " > .meter", this.context).width() / $(this.selector, this.context).width();
	},
	
	/**
	 * Called when the page is flipped
	 */
	onPageFlip: function( event )
	{
		if (event.type === "flip")
		{
			SharedData.setter(this.exportsTo + "_scrub_bar", this.getPercentage(), this.pageNumber);
		}
		else if (event.type === "load")
		{
			var scrubBarPercentage = SharedData.getter( this.exportsTo + "_scrub_bar" ) || 0;
			this.updateProgress( scrubBarPercentage );
			this.resize();
			this.refresh();
		}
	},
	
	/**
	 * Called when the page is resized
	 */
	onPageResize: function()
	{
		this.refresh();
	},
	
	/**
	 * Prepare to refresh the scrub bar after everything has been loaded
	 */
	refresh: function()
	{
		// Load scrub bar when everything is hopefully loaded -- Used to be 0.5
		window.setTimeout( this.resize, 40 );
	}
});
