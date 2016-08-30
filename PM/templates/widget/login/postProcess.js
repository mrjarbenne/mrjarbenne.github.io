
var callback = function (context, data, pageNumber) {
	var container = $("#" + data.id, context);
	
	// If there is a default message show it.. there should be
	$.get("resources/Text/" + data.id + ".html", function(text) {
		container.find(".login_intro").append(text);
		
		// Apply custom formatting for input fields
		if( data.custom_formatting )
		{
			$.each( data.fields, function( index, field ) {
				var currentElement = $('input[name=login-' + index + ']', context);
				var currentValueId = 'login-' + data.id + '-' + index;
				
				currentElement.attr({
					'id': currentValueId,
					'class': 'login_text',
					'type': 'text',
					'name': 'login-' + index,
					'maxlength': field.max_length <= 0 ? '524288' : field.max_length,
					'size': field.width
				});
				
				if( index === 0 )
				{
					currentElement.attr({
						'autofocus': true
					});
				}
			});
		}
	});
	
	
	// Once the user has submitted an answer, indicate & export
	function attemptSubmit() {
		var inputData = [];
			
		// Check if the user has input an answer before moving forward
		var responded = true;
		
		$.each( data.fields, function( index, field ) {
			var currentValueId = '#login-' + data.id + '-' + index;
		
			responded = responded && $(currentValueId, context).val().trim() !== '';
			
			inputData.push(
				{
					'label': field.label,
					'value': $(currentValueId, context).val().trim()
				}
			);
		});
		
		if (responded) {
			container.removeClass("error");
			container.addClass("completed");
			SharedData.setter(data.exports_to, inputData, pageNumber);
			
			if(typeof SharedData.getter(data.exports_to+ "-time") === "undefined") {
				//Get the start time
				var date = new Date();
				SharedData.setter(data.exports_to+ "-time", date, pageNumber);
			}
			
			Reporter.setUserInfo( inputData );
		} else {
			container.addClass("error");
			container.removeClass("completed");
		}
		
		return responded;
	};
	
	// Submit the answer if the user presses the enter key while
	// the text field is focused
	$('form', context).submit(function (event) {
		/**
		 * Uncomment if you want the Enter key to also submit the form
		var submitResult = attemptSubmit();
		
		// Force page flip if an answer was typed and the user
		// pressed the Enter key instead of clicking "Next Page"
		if (submitResult === true) {
			VignetteController.nextPage();
		}
		*/
		
		// Prevent submission of form from redirecting and refreshing the page
		return false;
	});
	
	//Allow fields to be restricted
	$.each(data.fields, function(index, field) {
		// Prevent pasting (CTRL+V) if there are any restrictions
		if( field.restrict !== "" )
		{
			$("#login-" + data.id + "-" + index, context).bind('paste', function(event) {
				return false;
			});
		}
	
		// Restrict characters when desired
		$("#login-" + data.id + "-" + index, context).keypress(function(event) {
			var key = (event.keyCode ? event.keyCode : event.which);
			
			if(field.restrict === "numbers") {
				if(!((key >= 48 && key <= 57) || key === 8)) {
					event.preventDefault();
				}
			} else if(field.restrict === "letters") {
				if(!((key >= 65 && key <= 90) || (key >= 97 && key <= 122) || key === 8)) {
					event.preventDefault();
				}
			} else if(field.restrict === "name") {
				if(!((key >= 65 && key <= 90) || (key >= 97 && key <= 122) || key === 222 || key === 188 || key === 190 || key === 173 || key === 8 || key === 32)) {
					event.preventDefault();
				}
			} else if(field.restrict === "no_symbols") {
				if(!((key >= 65 && key <= 90) || (key >= 97 && key <= 122) || (key >= 48 && key <= 57) || key === 173 || key === 8 || key === 32)) {
					event.preventDefault();
				}
			}
		});
	});

	

	VignetteController.addPageFlipListener(function (event) {
		if (event.type === "flip") {
			if (event.direction === "forward") {
				var submitResult = attemptSubmit();
				return submitResult;
			}
		}

		// And ignore other events
		return true;
	});

	// Setup reporting for questions
	//  Only exports a #
	/*VignetteController.addReportListener(function () {
		var result = {};
		if (typeof SharedData.getter(data.exports_to) !== "undefined") {
			result = Report.format(data, {
				answer: SharedData.getter(data.exports_to)[0]
			});
		}
		return result;
	});*/

	// If this question has been answered before but it is now being reloaded,
	// put the previous answer from SharedData back into the input text field
	var currentData = SharedData.getter(data.exports_to)[0];
	if (typeof currentData !== "undefined") {
		$.each( currentData, function( index, element ) {
			var currentValueId = '#login-' + data.id + '-' + index;
			$(currentValueId, context).val(element.value);
		});
		// Mark the question as completed
		container.addClass("completed");
	}
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/login", callback);
};
