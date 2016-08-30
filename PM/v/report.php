<?php
	$postString = getReportString( $_POST );
	$file = fopen( "report.txt", 'w' ) or die( "Could not prepare file to write." );
	fwrite( $file, $postString ) or die( "Writing failed." );
	fclose( $file );

	/**
	 * Gets the entire report string
	 */
	function getReportString( $data )
	{
		$report = '';
		
		foreach( $_POST as $key => $value )
		{
			$report .= $key
					 . ": "
					 . getReportElementString( $value );
			
			// Add a comma if not the last element in the report
			$index = array_search( $key, array_keys( $_POST ) );
			
			if( $index < count( $_POST ) - 1 )
			{
				$report .= ","
						 . "\r\n";
			}
		}
		
		return $report;
	}
	
	/**
	 * Gets the string for an element in the report
	 */
	function getReportElementString( $element, $currentDepth = 0 )
	{
		$elementString = '';
	
		/**
		 * Format the data by adding tabs to represent the
		 * depth within an array
		 */
		$tabs = '';
		for( $i = 0; $i < $currentDepth; $i++ )
		{
			$tabs .= "\t";
		}
		
		if( is_array( $element ) ) // Must go through all arrays to print all info
		{
			/**
			 * Begin the array's square bracket
			 */
			$elementString .= "\r\n"
							. $tabs
							. "[";
			
			/**
			 * Recursively get all the elements in the array
			 */
			foreach( $element as $key => $value )
			{
				$elementString .= "\r\n"
							   . $tabs
							   . "\t"
							   . $key
							   . ": "
							   . getReportElementString( $value,
														 $currentDepth + 1 );
				
				// Add a comma if not the last element in the array
				$index = array_search( $key, array_keys( $element ) );
				
				if( $index < count( $element ) - 1 )
				{
					$elementString .= ",";
				}
			}
			
			/**
			 * End the array's square bracket
			 */
			$elementString .= "\r\n"
							. $tabs
							. "]";
		}
		else // The element is a value, not an array
		{	
			$elementString .= $element; 
		}
		
		return $elementString;
	}
?>