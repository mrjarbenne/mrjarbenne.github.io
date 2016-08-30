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
 
 var AnalysisHandlers = {
 	/** Returns mouse postion relative to a given offset
 	 *
 	 * @param e : event to retrieve mouse from
 	 * @param offset : page offset of element
 	 */
 	getMouse : function(e, offset){
 		var mouse = {};
		mouse.x = e.pageX - offset.x;
		mouse.y = e.pageY - offset.y;
		return mouse;
 	},
 	/** Draws circles based on tracker data
 	 *
 	 * @param tracker : current tracker data
 	 */
 	drawCircles : function( tracker ) {
		//Draw each mark from tracker data
		tracker.trackedData.forEach( function(point, index){
			var xScaled = point.x/16 * tracker.canvas.width;
			var yScaled = point.y/9 * tracker.canvas.height;
			if( index !== tracker.currentFrame ) {
				DrawLib.circle( tracker.ctx, xScaled, yScaled, 3, 'black' );
			} else {
				DrawLib.circle( tracker.ctx, xScaled, yScaled, 3, 'red' );
			}
		});
 	},

 	drawLines : function( tracker ) {
 		tracker.trackedData.forEach( function( coords, index) {
 			var x1Scaled = coords[0].x/16 * tracker.canvas.width;
 			var y1Scaled = coords[0].y/9 * tracker.canvas.height;
 			var x2Scaled = coords[1].x/16 * tracker.canvas.width;
 			var y2Scaled = coords[1].y/9 * tracker.canvas.height;

 			if( index !== tracker.currentFrame )
				DrawLib.line( tracker.ctx, x1Scaled, y1Scaled, x2Scaled, y2Scaled, 1, 'black' );
			else
				DrawLib.line( tracker.ctx, x1Scaled, y1Scaled, x2Scaled, y2Scaled, 1, 'red' );
 		});
 	},
 	/** Draws the image given to the canvas
 	 *
 	 * @param image : image source
 	 * @param ctx : drawing context
 	 * @param canvas : canvas being drawn to
 	 */
 	drawFrame : function( image, ctx, canvas ) {
 		DrawLib.image(ctx, image, 0, 0, canvas.width, canvas.height);
 	},
 	/** Draws the controls on the screen scalled for the canvas
 	 *
 	 * @param mouse : current mouse position 
 	 * @param tracker : current tracker data
 	 */
 	drawControls : function( mouse, tracker ) {
 		var ctrlHeight = tracker.canvas.height/11;
 		var ymin = tracker.canvas.height - ctrlHeight;
 		var ymax = tracker.canvas.height;
 		var xmin = 0;
 		var xmax = tracker.canvas.width;
 		//The coords created for the controls are all relative
 		//Back drop
 		DrawLib.rect(tracker.ctx, xmin, ymin, xmax, ctrlHeight, 'Black');
 		//Progress bar
 		var barX = ctrlHeight + 5;
 		var barY = ymin + tracker.canvas.height/20 - 5;
 		var barLength = xmax - 3 * ctrlHeight - 10;
 		var barHeight = tracker.canvas.height/20 - 4;
 		var barFill = barLength / (tracker.playerImages.length - 1) * ( tracker.currentFrame );
 		if( mouse !== 0 && tracker.mouseDown && mouse.x > barX && mouse.x < barX + barLength)
 		 { barFill = mouse.x - barX; }

 		DrawLib.rect(tracker.ctx, barX, barY, barLength, barHeight, 'Blue');
 		DrawLib.rect(tracker.ctx, barX, barY, barFill, barHeight, 'White');
 		//Clear Button
 		var x0 = { x: 5, y: ymin + 5 };
 		var x1 = { x: tracker.canvas.height/11 - 5, y: ymax - 5 };
 		var x2 = { x: x0.x, y: x1.y };
 		var x3 = { x: x1.x, y: x0.y };
 		DrawLib.line( tracker.ctx, x0.x, x0.y,
 					  x1.x, x1.y, 3, 'White');
 		DrawLib.line( tracker.ctx, x2.x, x2.y,
 					  x3.x, x3.y, 3, 'White');
 		//back button
 		var b0 = { x: xmax - ctrlHeight*1.1 - 5, y: ymin + 5 };
 		var b1 = { x: xmax - ctrlHeight*1.9, y: ymax - ctrlHeight/2 };
 		var b2 = { x: b1.x, y: b1.y };
 		var b3 = { x: b0.x, y: ymax - 5 };
 		DrawLib.line( tracker.ctx, b0.x, b0.y,
 					  b1.x, b1.y, 3, 'White');
 		DrawLib.line( tracker.ctx, b2.x, b2.y,
 					  b3.x, b3.y, 3, 'White');
 		//forward button
 		var f0 = { x: xmax - ctrlHeight*.9, y: b0.y };
 		var f1 = { x: xmax - ctrlHeight*.1 - 5, y: b1.y };
 		var f2 = { x: f1.x, y: f1.y };
 		var f3 = { x: f0.x, y: ymax - 5 };
 		DrawLib.line( tracker.ctx, f0.x, f0.y,
 					  f1.x, f1.y, 3, 'White');
 		DrawLib.line( tracker.ctx, f2.x, f2.y,
 					  f3.x, f3.y, 3, 'White');
 	},
 	/** If two points are within a certain distance from each other
 	 *
 	 * @param x1 : point 1 X coord
 	 * @param y1 : point 1 Y coord
 	 * @param x2 : point 2 X coord
 	 * @param y2 : point 2 Y coord
 	 * @param r : radius
 	 */
 	circleDetect : function( x1, y1, x2, y2, r ) {
 		var distSq = (x2 - x1)*(x2 - x1) + (y2 - y1)*(y2 - y1);
 		var radSq = r * r;
 		if(distSq < radSq)
 			return true;
 		else
 			return false;
 	},
 	/** Sends data from shared data *Transposed directly from old
 		canvas engine so conflicts would be minimal, but I am not 
 		a fan of this method*
 	 *
 	 * @param data : data to be sent to shared data
 	 * @param exportLoc : location in sharedData to send data to
 	 * @param tracker : tracker obj
 	 */
 	sendPosData : function( data, exportLoc, tracker ) {
 		if (typeof SharedData.getter( exportLoc ) === "undefined") {
			SharedData.setter( exportLoc, data, tracker.pageNum );
		} else {
			var exportedData = SharedData.getter( exportLoc );
			var sortFunc = function (a, b) {
				return a[0] - b[0];
			};
			var foundFrame = false;
			$.each(exportedData, function (index, value) {
				if ( value[0] === tracker.currentFrame ) {
					SharedData.replace( exportLoc, index, data, sortFunc, tracker.pageNum );
					foundFrame = true;
					return false;
				}
				return true;
			});

			if (!foundFrame) {
				SharedData.adder(exportLoc, data, sortFunc, tracker.pageNum);
			}		
		}
 	},

 	sendLineColorData : function( start, end, dist, tracker ) {
 		var lineColorData = [];
 		var allPoints = [];

 		var length = Math.floor(dist);

		var intervalX = ( end.x - start.x ) / length;
		var intervalY = ( end.y - start.y ) / length;
		

		for(var i = 0; i < length; i++) {
			var coords = {
				x: start.x + ( intervalX * i ),
				y: start.y + ( intervalY * i )
			};
			lineColorData.push( this.getPointColorData(coords, tracker));
		}

		SharedData.setter(tracker.exportLoc + "_rgb", lineColorData, tracker.pageNum );
		//SharedData.dict[tracker.exportLoc + "_rgb"] = lineColorData;
		tracker.colorData[tracker.currentFrame] = lineColorData;
		//console.log(tracker.exportLoc + "_rgb");
		//console.log(SharedData.dict[tracker.exportLoc + "_rgb"]);
		
 	},

 	sendColorData : function( mouse, tracker ) {
		tracker.colorData[tracker.currentFrame] = this.getPointColorData( mouse, tracker);
		SharedData.setter(tracker.colorExport, tracker.colorData, "", tracker.pageNum);
 	},

 	getPointColorData : function( point, tracker ) {
 		//Get the image data at the correct coords
		var imgData = tracker.ctx.getImageData( point.x, point.y, 2, 2).data;
		
		//Get the intensity of red green and blue at the specified area of the picture
		var red = 0;
		var green = 0;
		var blue = 0;
		for(var i = 0; i < imgData.length/4; i++) {
			red += parseInt(imgData[0 + 4*i]);
			green += parseInt(imgData[1 + 4*i]);
			blue += parseInt(imgData[2 + 4*i]);
		}
		red = Math.round(red/(imgData.length/4));
		green = Math.round(green/(imgData.length/4));
		blue = Math.round(blue/(imgData.length/4));

		return [red, green, blue];
 	},

 	handleControlsMove : function( mouse, tracker ) {
 		//progressbar handling
 		var height = tracker.canvas.height/11;
 		var barX = height + 5;
 		var barXmax = tracker.canvas.width - barX * 3;
 		var barY = tracker.canvas.height*10/11 + tracker.canvas.height/20 - 5;
 		var barYmax = barY + tracker.canvas.height/20 - 4;
 		//Check if the progress bar is used and set new frame
 		if( mouse.x > barX && mouse.x < barXmax	) {
 			var newFrame = (mouse.x - barX)/(barXmax - barX) * (tracker.playerImages.length-1);
 			tracker.currentFrame = Math.round(newFrame);
 			this.drawFrame( tracker.playerImages[tracker.currentFrame], tracker.ctx, tracker.canvas);
	 		this.drawCircles( tracker );
	 		this.drawControls( mouse, tracker );
 		}
 	},

 	handleControlsUp : function( mouse, tracker ) {
 		//progressbar handling
 		var height = tracker.canvas.height/11;
 		var xmax = tracker.canvas.width;
 		var barX = height + 5;
 		var barXmax = tracker.canvas.width - barX * 3;
 		var barY = tracker.canvas.height*10/11 + tracker.canvas.height/20 - 5;
 		var barYmax = barY + tracker.canvas.height/20 - 4;
 		//Check if the progress bar is used and set new frame
 		if( mouse.x > barX && mouse.x < barXmax	&& mouse.y > barY && mouse.y < barYmax ) {
 			var newFrame = (mouse.x - barX)/(barXmax - barX) * (tracker.playerImages.length-1);
 			tracker.currentFrame = Math.round(newFrame);
 		} else if( mouse.x > 5 && mouse.x < height - 5 
 				&& mouse.y < tracker.canvas.height - 5 
 				&& mouse.y > tracker.canvas.height - height + 5) {
 			tracker.currentFrame = 0;
 			tracker.trackedData = [];
 		} else if( mouse.x > xmax - 2*height - 5 && mouse.x < xmax - height
 				&& mouse.y < tracker.canvas.height - 5 
 				&& mouse.y > tracker.canvas.height - height + 5) {
 			tracker.currentFrame > 0 ? tracker.currentFrame-- : false;
 		} else if( mouse.x > xmax - height + 5 && mouse.x < xmax - 5
 				&& mouse.y < tracker.canvas.height - 5 
 				&& mouse.y > tracker.canvas.height - height + 5) {
			tracker.currentFrame < tracker.playerImages.length -1 ? tracker.currentFrame++ : false;
 		}
 	},
 	/** Canvas down handler function for the any tracker, also handles mouse leave
 	 *
 	 * @param tracker : tracker object 
 	 */
 	anyTrackerDownHandler : function( tracker ){
 		var self = this;
 		tracker.canvas.addEventListener("mousedown", function(e) {
 			var mouse = self.getMouse(e, tracker.offset);
 			tracker.mouseDown = true;
 			tracker.mouseStart = mouse;
 		}, false);
 		tracker.canvas.addEventListener("mouseleave", function(e) {
 			tracker.mouseDown = false;
 		}, false);
 	},
 	/** Canvas up handler function for the any tracker, also handles mouse leave
 	 *
 	 * @param tracker : tracker object 
 	 */
 	anyTrackerUpHandler : function( tracker ){
 		var self = this;
 		tracker.canvas.addEventListener("mouseup", function(e) {
 			tracker.mouseDown = false;
 			var mouse = self.getMouse(e, tracker.offset);
 			//If the mouse is not on the controls collect data
 			if( mouse.y < tracker.canvas.height*10/11) {
 				//scale mouse coords to 15 by 9
 				var xScaled = mouse.x/tracker.canvas.width * 16;
 				var yScaled = mouse.y/tracker.canvas.height * 9;
 				tracker.trackedData[tracker.currentFrame] = {x : xScaled, y : yScaled};
 				//Export data
 				var data = [tracker.currentFrame, xScaled, yScaled, tracker.currentFrame * tracker.stepTime];
 				self.sendPosData( data, tracker.exportLoc, tracker );
 				self.sendColorData( mouse, tracker );
 				tracker.currentFrame += (tracker.currentFrame < tracker.playerImages.length - 1) ? 1 : 0;
 				//Redraw
 				DrawLib.clear( tracker.ctx, 0, 0, tracker.canvas.width, tracker.canvas.height);
 				self.drawFrame( tracker.playerImages[tracker.currentFrame], tracker.ctx, tracker.canvas);
				self.drawCircles( tracker );
				self.drawControls( 0, tracker );
	 		} else {
	 			self.handleControlsUp( mouse, tracker );
	 			self.drawFrame( tracker.playerImages[tracker.currentFrame], tracker.ctx, tracker.canvas);
	 			self.drawCircles( tracker );
	 			self.drawControls( 0, tracker );
	 		}
 		}, false);
 	},
 	/** Canvas up handler function for the any tracker, also handles mouse leave
 	 *
 	 * @param tracker : tracker object 
 	 */
 	anyTrackerMoveHandler : function( tracker ){
 		var self = this;
 		tracker.canvas.addEventListener("mousemove", function(e) {
 			var mouse = self.getMouse(e, tracker.offset);
 			if( tracker.mouseDown && mouse.y > tracker.canvas.height*10/11 ) {
 				self.handleControlsMove( mouse, tracker );
 			}
 		}, false);
 	},
 	/** Canvas up handler function for the circle tracker, also handles mouse leave
 	 *
 	 * @param tracker : tracker object 
 	 */
 	circleTrackerUpHandler : function( tracker ) {
 		var self = this;
 		tracker.canvas.addEventListener("mouseup", function(e) {
 			tracker.mouseDown = false;
 			var mouse = self.getMouse(e, tracker.offset);
 			//If the mouse is not on the controls collect data
 			if( mouse.y < tracker.canvas.height*10/11) {
	 			
	 			//check if click is good
 				var x1 = mouse.x/tracker.canvas.width * tracker.scale.x;
 				var y1 = tracker.scale.y - mouse.y/tracker.canvas.height * tracker.scale.y;
 				var x2 = tracker.trackLocations[tracker.currentFrame].x;
 				var y2 = tracker.trackLocations[tracker.currentFrame].y;

 				if(self.circleDetect(x1, y1, x2, y2, tracker.trackLocations[tracker.currentFrame].r)) {	
 					//Export data
 					var data = [tracker.currentFrame, x2, y2, tracker.currentFrame * tracker.stepTime];
 					self.sendPosData( data, tracker.exportLoc, tracker );
 					self.sendColorData( mouse, tracker );
 					//scale mouse coords to 15 by 9
	 				var xScaled = x2/tracker.scale.x * 16;
	 				var yScaled = (tracker.scale.y - y2)/tracker.scale.y * 9;
	 				tracker.trackedData[tracker.currentFrame] = { x : xScaled, y : yScaled };	

	 				tracker.currentFrame += (tracker.currentFrame < tracker.playerImages.length - 1) ? 1 : 0;
	 				//Redraw
	 				DrawLib.clear( tracker.ctx, 0, 0, tracker.canvas.width, tracker.canvas.height);
	 				self.drawFrame( tracker.playerImages[tracker.currentFrame], tracker.ctx, tracker.canvas);
					self.drawCircles( tracker );
					self.drawControls( 0, tracker );
	 			}
	 		} else {
	 			self.handleControlsUp( mouse, tracker );
	 			self.drawFrame( tracker.playerImages[tracker.currentFrame], tracker.ctx, tracker.canvas);
	 			self.drawCircles( tracker );
	 			self.drawControls( 0, tracker );
	 		}
 		}, false);
 	},

 	anyLineTrackerMoveHandler : function( tracker ) {
 		var self = this;
 		tracker.canvas.addEventListener("mousemove", function(e) {
 			var mouse = self.getMouse(e, tracker.offset);
 			
 			if( tracker.mouseDown && mouse.y < tracker.canvas.height*10/11 ) {
 				self.drawFrame( tracker.playerImages[tracker.currentFrame], tracker.ctx, tracker.canvas);
	 			self.drawLines( tracker );
	 			DrawLib.line(tracker.ctx, tracker.mouseStart.x, tracker.mouseStart.y, 
	 				mouse.x, mouse.y, tracker.lineWidth, "red");
	 			self.drawControls( 0, tracker );
 			} else if(tracker.mouseDown){
 				if( mouse.y > tracker.canvas.height*10/11 )
 					self.handleControlsMove( mouse, tracker );
 				self.drawFrame( tracker.playerImages[tracker.currentFrame], tracker.ctx, tracker.canvas);
	 			self.drawLines( tracker );
	 			self.drawControls( 0, tracker );
 			}
 		}, false);	
 	},

 	anyLineTrackerUpHandler : function( tracker ) {
 		var self = this;
 		tracker.canvas.addEventListener("mouseup", function(e){

 			var mouse = self.getMouse(e, tracker.offset);
 			if( tracker.mouseDown && mouse.y < tracker.canvas.height*10/11 ) {
 				//self.sendLineColorData( tracker );
 				//scale mouse coords to 15 by 9
 				var xScaled0 = tracker.mouseStart.x/tracker.canvas.width * 16;
 				var yScaled0 = tracker.mouseStart.y/tracker.canvas.height * 9;
 				var xScaled1 = mouse.x/tracker.canvas.width * 16;
 				var yScaled1 = mouse.y/tracker.canvas.height * 9;
 				tracker.trackedData[tracker.currentFrame] = [{x : xScaled0, y : yScaled0}, {x : xScaled1, y : yScaled1}];
 				//Get unscaled distance
 				var deltaXUnscaled = mouse.x - tracker.mouseStart.x;
 				var deltaYUnscaled = mouse.y - tracker.mouseStart.y;
 				//get distance
 				var deltaX = xScaled1 - xScaled0;
 				var deltaY = yScaled1 - yScaled0;
 				//Export data
 				var data = [tracker.currentFrame, deltaX, deltaY, tracker.currentFrame * tracker.stepTime];
 				self.sendPosData( data, tracker.exportLoc, tracker );
 				var dist = Math.floor( Math.sqrt( (deltaXUnscaled * deltaXUnscaled) + 
 									 (deltaYUnscaled * deltaYUnscaled) ));
 				self.sendLineColorData( tracker.mouseStart, mouse, dist, tracker );
 				//increment if necessary
 				tracker.currentFrame += (tracker.currentFrame < tracker.playerImages.length - 1) ? 1 : 0;
 				//Redraw
 				DrawLib.clear( tracker.ctx, 0, 0, tracker.canvas.width, tracker.canvas.height);
 				self.drawFrame( tracker.playerImages[tracker.currentFrame], tracker.ctx, tracker.canvas);
				self.drawCircles( tracker );
				self.drawControls( 0, tracker );
				self.drawLines( tracker );
				tracker.mousedown = false;
 			} else {
 				if( mouse.y > tracker.canvas.height*10/11 )
 					self.handleControlsUp( mouse, tracker );
 				self.drawFrame( tracker.playerImages[tracker.currentFrame], tracker.ctx, tracker.canvas);
	 			self.drawLines( tracker );
	 			self.drawControls( 0, tracker );
	 			tracker.mousedown = false;
 			}
 			tracker.mouseDown = false;
 		}, false);
 	}
 };