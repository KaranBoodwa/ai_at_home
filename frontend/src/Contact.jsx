import React from 'react';
import { useState } from "react";

// Contact Page
function Contact(){

	return(
		<>
			<div className="flex">
				{/*Main Content*/}
				<div className="w-2/3 lg:w-full min-h-screen flex-1 flex-col">
					<div className="max-w-3xl bg-gray-200 rounded-lg mx-auto my-16 p-16 w-5/6">
						<h1 className="text-2xl font-medium mb-2">
							Contact
						</h1>
						<h2 className="text-sm text-indigo-400 mb-4 tracking-wide font-bold">
							Leave a message!
						</h2>
						<p>
							This may one day feature a contact form.
						</p>
						<form class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
							<div class="mb-6">
								<label class="block text-gray-700 text-sm font-bold mb-2" htmlfor="password">Password</label>
								<input class="shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="******************" />
							</div>
						</form>
					</div>
				</div>
				{/*End Main Content*/}
			</div>
		</>
	);
}


export default Contact;