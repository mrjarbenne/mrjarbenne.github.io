var callback = function (context, data, pageNumber) {
	var vimeoObject;
	var url_error = false;

	function vimeoSetup() {
		// Setup vimeo API access. We manually play and pause vimeo videos
		// because the nature of a vignette, which loads multiple pages
		// at once, will allow videos on different pages to autoplay
		// at the same time if the autoplay URL parameter is set.
		var iframe = $("#vimeo_" + data.id, context);
		if (typeof iframe !== "undefined") {
			iframe.ready(function() {
				vimeoObject = iframe;
				var src = changeToEmbedURL(data.url);
				if (src == null) {
					// the URL is not in acceptable form, error
					urlError();
				} else {
					addURLParameters(src);
				}
			});
		}
	}

	function vimeoPlay() {
		if (typeof vimeoObject === "undefined")
			return;
		reloadWidget();
		vimeoObject.vimeo("play");
		console.log("play");
	}

	function vimeoPause() {
		if (typeof vimeoObject === "undefined")
			return;
		vimeoObject.vimeo("pause");
	}

	/**
     * Checks that the src URL is in the embed form.
     * Normal webpage form: https://vimeo.com/152018686
     * Embed form: https://player.vimeo.com/video/152018686
     * Each form also optionally has parameters at the end.
     * 
     * If src is in normal webpage form, it is changed into
     * the embed form.
     * If src is already in embed form, src is returned.
     * Else, null is returned to signal an error in the widget.
	 */
	function changeToEmbedURL(src) {
		var webpageForm = /vimeo.com\/(\d+)(\S*)/ig;
		var webpageFormResult = webpageForm.exec(src);
		if (webpageFormResult == null) {
			// if null, the match failed
			// check if src is in embed form
			var embedForm = /player.vimeo.com\/video\/(\d+)/ig;
			var embedFormResult = embedForm.exec(src);
			if (embedFormResult == null) {
				// src is not in any acceptable form, return null
				return null;
			} else {
				// src is in embed form, so return it as is
				return src;
			}
		} else {
			// src is in normal webpage form, convert it to
			// embed form and return it
			var videoId = webpageFormResult[1]; // first capture group from the regex
			var params = webpageFormResult[2]; // url parameters
			var embedForm = "https://player.vimeo.com/video/" + videoId + params;
			return embedForm;
		}
	}

	/**
	 * Display an error in the widget area that says
	 * the given URL is formatted incorrectly.
	 */
	function urlError() {
		url_error = true;
		$(".vimeo-wrapper", context).hide();
		$(".vimeo-error", context).css("display", "block");
	}

	/**
     * This function expects a URL of the form:
     *   https://player.vimeo.com/video/152018686
     * in data.src, and does the following:
     *   - adds the query marker (?) if not present
     *   - adds the following parameters if not present:
     *     - api=1, enables vimeo api access
     *	   - player_id=vimeo_[widget-id], required to use
     *       the api with multiple vimeos embeds on a 
     *       single page
     *     - badge=0, disables the vimeo logo on the video
     *     - byline=0, disables the user's byline
     *     - portrait=0, disables user's portrait
     *     - title=0, disables the title on the video
	 */
	function addURLParameters(src) {
		var marker = src.indexOf("?");
		var api = src.indexOf("api=1");
		var player_id = src.indexOf("player_id=");
		var badge = src.indexOf("badge=");
		var byline = src.indexOf("byline=");
		var portrait = src.indexOf("portrait=");
		var title = src.indexOf("title=");
		if (marker == -1) {
			src += "?";
		}
		if (api == -1) {
			src += "&api=1";
		}
		if (player_id == -1) {
			src += "&player_id=vimeo_" + data.id;
		}
		if (badge == -1) {
			src += "&badge=0";
		}
		if (byline == -1) {
			src += "&byline=0";
		}
		if (portrait == -1) {
			src += "&portrait=0";
		}
		if (title == -1) {
			src += "&title=0";
		}
		console.log("final url: "+src);
		vimeoObject.attr("src", src);
	}

	/**
	This is a bit ugly, but we need to reload the iframe
	in order to ensure that the video autoplays correctly.
	Otherwise, when the user navigates back to a page
	that has already autoplayed its video, it will not play.
	Reloading the template seems the simplest way to do this.
	**/
	function reloadWidget() {
		var displayText = "";
		$.get("../templates/widget/vimeo/index.html", function(text) {
			displayText += text;
		});
		displayText = _.template(displayText, data);
		$(".vimeo-wrapper", context).replaceWith(displayText);
		// add URL parameters again since they were wiped with the reload
		vimeoObject = $("#vimeo_" + data.id, context);
		addURLParameters(changeToEmbedURL(data.url));
	}

	VignetteController.addPageFlipListener(function (event) {
		if (event.type === "flip") {
			vimeoPause();
		} else if (event.type === "load") {
			vimeoSetup();
			// Autoplay defaults to true if the option is not specified
			if (typeof data.autoplay === "undefined" || data.autoplay) {
				vimeoObject.ready(function() {
					if (!url_error) {
						vimeoPlay();
					}
				});
			}
		}
		return true;
	});
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/vimeo", callback);
};