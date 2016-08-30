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

/** Library for all draw methods that involve the canvas. Intended to replace canvas engine
 *
 */

 var DrawLib = {
 	/** Clear a rectangle on the canvas with star point and given dimensions
 	 *@param ctx : Drawing Context
 	 *@param x : starting x coord
 	 *@param y : starting y coord
 	 *@param w : width
 	 *@param h : height
 	 */
 	clear : function( ctx, x, y, w, h ) {
		ctx.clearRect( x, y, w, h );
	},

	/** Fill a rectangle on the canvas with star point and given dimensions
 	 *@param ctx : Drawing Context
 	 *@param x : starting x coord
 	 *@param y : starting y coord
 	 *@param w : width
 	 *@param h : height
 	 *@param col : color
 	 */
	rect : function( ctx, x, y, w, h, col ) {
		ctx.save();
		ctx.fillStyle = col;
		ctx.fillRect( x, y, w, h );
		ctx.restore();
	},
	/** Fill a circle at given coordinates
 	 *@param ctx : Drawing Context
 	 *@param x : center x coord
 	 *@param y : center y coord
 	 *@param r : radius
 	 *@param col : color
 	 */
	circle : function( ctx, x, y, r, col) {
		ctx.save();
		ctx.fillStyle = col;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	},
	/** Stroke a line between two points
 	 *@param ctx : Drawing Context
 	 *@param x0 : starting x coord
 	 *@param y0 : starting y coord
 	 *@param x1 : ending x coord
 	 *@param y1 : ending y coord
 	 *@param w : line width
 	 *@param col : color
 	 */
	line : function( ctx, x0, y0, x1, y1, w, col) {
		ctx.save();
		ctx.strokeStyle = col;
		ctx.lineWidth = w;
		ctx.beginPath();
		ctx.moveTo(x0, y0);
		ctx.lineTo(x1,y1);
		ctx.stroke();
		ctx.restore();
	},
	/** Draw an image at specified position
 	 *@param ctx : Drawing Context
 	 *@param x0 : starting x coord
 	 *@param y0 : starting y coord
 	 *@param x1 : ending x coord
 	 *@param y1 : ending y coord
 	 *@param w : line width
 	 *@param col : color
 	 */
	image : function( ctx, image, x, y, w, h) {
		ctx.drawImage(image, x, y, w, h);
	}
 }
