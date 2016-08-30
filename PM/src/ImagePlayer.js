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
 
 
var ImagePlayer = Class.extend(

// ---- Begin ImagePlayer ----
/**  @lends ImagePlayer.prototype */
		{

	// The current image being displayed in the browser
	index: 0,

	// Whether or not this player is currently autoplaying
	isReplaying: false,
	
	// The callback for when the image player flips to another frame
	onFlip: 0,
	
	// The callback for when the image player flips back to the first frame
	// after going through all the frames
	onReset: 0,

	/**
	 * <b>Class Overview:</b><br />
	 * This class acts as a helper for widgets that need to play through
	 *  and display images
	 * <br /><br />
	 * <b>Constructor:</b><br />
	 * The constructor for image players.
	 *
	 * @constructs
	 * @memberOf ImagePlayer
	 * @param {Array} selector an array of the
	 *                                       objects to show/hide
	 * @param {boolean} doLoop whether or not to allow looping 
	 *               (starting over at 0 after hitting the end of the list)
	 * @param {int} stepTime the amount of time to pause between flipping
	 *                        images (needed if startAutoplay will be used)
	 *
	 */
	init: function (selector, doLoop, frame, stepTime) {
		// The magic to allow functions to be used as callbacks directly
		//  Otherwise, JS would throw errors when you try, for example,
		//   $(whateverObjects).click(myObject.function)
		// Use this in every class's init function for paranoia
		_.bindAll(this);
		
		$(selector[frame]).css('display', 'block');
		
		this.selector = selector;
		this.index = frame;
		this.doLoop = doLoop;
		this.stepTime = stepTime;
		
		// Fix flickering for IE
		var isIE = false;
        var ua = window.navigator.userAgent;
        var msie = ua.indexOf("MSIE ");

        if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))
		{
			isIE = true;
		}
        else
		{
			isIE = false;
		}
		
		if( isIE === true )
		{
			// Fix goes here...
		}
	},

	/**
	 * Shows the image given by the selected index.
	 *
	 * @memberOf ImagePlayer
	 * @param {int} newIndex the index of the image to show
	 *
	 */
	flipTo: function (newIndex) {
		if (this.index !== newIndex) {
			$(this.selector[newIndex]).show();
			$(this.selector[this.index]).hide();
			
			this.index = newIndex;
			
			if( this.onFlip ) {
				this.onFlip();
			}
		}
	},

	/**
	 * Shows the next image in the given selector sequence.
	 *
	 * @memberOf ImagePlayer
	 */
	next: function () {
		if (this.index < this.selector.length || this.doLoop) {
			var newIndex = (this.index + 1) % this.selector.length;
			this.flipTo(newIndex);
		}
	},

	/**
	 * Shows the previous image in the given selector sequence.
	 *
	 * @memberOf ImagePlayer
	 */
	back: function () {
		if (this.index > 0 || this.doLoop) {
			var newIndex = (this.index - 1 + this.selector.length)
				% this.selector.length;
			this.flipTo(newIndex);
		}
	},

	/**
	 * Internal autoplay function for ImagePlayer.
	 *  Flips the image, and sets a timeout to call itself again.
	 *
	 * @memberOf ImagePlayer
	 */
	autoplay: function () {
		if( this.isReplaying === true )
		{
			if (this.index === this.selector.length - 1 && this.doLoop) {
				// When the image player has run through all the frames
				// and is going back to pause on the first one
				this.next();
				this.isReplaying = false;
				
				if( this.onReset ) {
					this.onReset();
				}
				
				return;
			} else if (this.index === this.selector.length - 1) {
				this.isReplaying = false;
				return;
			}
		
			this.next();
			window.setTimeout(this.autoplay, this.stepTime);
		}
	},

	/**
	 * External autoplay function for ImagePlayer.
	 *  Call this to start playing through images automatically.
	 *
	 * @memberOf ImagePlayer
	 */
	startAutoplay: function () {
		if (!this.isReplaying) {
			this.isReplaying = true;
			window.setTimeout(this.autoplay, this.stepTime);
		}
	},
	
	/**
	 * Pauses the frame player
	 */
	pause: function() {
		this.isReplaying = false;
	}
});
