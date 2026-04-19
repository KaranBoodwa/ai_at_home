import React from 'react';
import { useState } from "react";

// About page
function About(){
	return(
		<>
		<div className="flex">
			<div className="max-w-3xl bg-gray-200 rounded-lg mx-auto my-16 p-16">
				<h1 className="text-2xl font-medium mb-2">
					About
				</h1>
				<h2 className="text-sm text-indigo-400 mb-4 tracking-wide font-bold">
					What's the backstory?
				</h2>
					This is a creative writing exercise masquerading as a coding side project.
					If this was somehow useful or helpful for you, I apologize. Our engineers are working tirelessly to correct this to ensure it never happens again.

					This will eventually feature a suite of different personalities to chat with (maybe, idk, if I don't get bored I guess)
			</div>
		</div>
		</>
	);
}


export default About;