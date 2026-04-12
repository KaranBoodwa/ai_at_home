import React from 'react';
import { useState } from "react";

// Contact Page
function Contact(){
	return(
		<div className="px-4">
			<div className="max-w-3xl bg-mauve-950 rounded-lg mx-auto my-16 p-16">
				<h1 className="text-2xl font-medium mb-2">
					Contact
				</h1>
				<h2 className="font-medium text-sm text-indigo-400 mb-4 tracking-wide">
					Leave a message!
				</h2>
				<p>
					This may one day feature a contact form if I feel so generous.
				</p>
			</div>
		</div>
	);
}


export default Contact;