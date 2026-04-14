import React from 'react';
import { useState } from "react";

// Contact Page
function Contact(){

	return(
		<div className="flex">
			{/*Main Content*/}
			<div className="w-2/3 lg:w-full min-h-screen flex-1 flex-col">
				<div className="max-w-3xl bg-gray-200 rounded-lg mx-auto my-16 p-16 w-5/6">
					<h1 className="text-2xl font-medium mb-2">
						Contact
					</h1>
					<h2 className="font-medium text-sm text-indigo-400 mb-4 tracking-wide">
						Leave a message!
					</h2>
					<p>
						This may one day feature a contact form.
					</p>
				</div>
			</div>
			{/*End Main Content*/}
		</div>
	);
}


export default Contact;