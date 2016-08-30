var callback = function (context, data, pageNumber) {
	var image_wrapper = $(".image-wrapper", context);
	if (typeof(data.image_scroll) !== "undefined" && data.image_scroll) {
		var scale;
		if (typeof(data.image_scale) !== "undefined") {
			scale = data.image_scale;
		} else {
			scale = 1.0;
		}
		image_wrapper.addClass("image-scale");
		var image = $(".image-scale img", context);
		image.one("load", function() {
			var new_width = image.width() * scale;
			var new_height = image.height() * scale;
			image.css("width", new_width);
			image.css("height", new_height);
		});
	} else {
		image_wrapper.addClass("nostretch");
	}

	if (typeof data.bg_color !== "undefined") {
		image_wrapper.css("background-color", data.bg_color);
	}
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/image", callback);
};