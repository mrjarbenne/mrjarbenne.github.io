
var callback = function (context, data) {
	$(document).ready(function(){
		$("#" + data.id, context).load("resources//Text//" + data.id + ".html");
	});
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/text-html", callback);
};
