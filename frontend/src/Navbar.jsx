import React from 'react';
import { useState } from "react";
import './styles/app.css';

// Responsive Navbar
function Navbar({ page, setPage }){

	return(
		<header className="lg:px-16 lg:py-0 px-6 py-2 bg-brand-900 flex flex-wrap items-center">
			<div className="flex-1 flex justify-between items-center">
				{/* Logo */}
				<a className="flex items-center" href="/">
					<span className="mr-2 text-brand-100">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M11 6h-.82C9.07 6 8 7.2 8 8.16V10l-3 3v-3H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2zm0 1h6c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2h-2v3l-3-3h-1c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2"/></svg> 
					</span>
					<p className="logo_text">We have Al at home</p>
				</a>
		 	</div>

		     <input className="peer hidden" type="checkbox" id="expand-nav" />
		     <label htmlFor="expand-nav" className="cursor-pointer lg:hidden block">
		     	<svg xmlns="http://www.w3.org/2000/svg" className="text-white" width="24" height="24" viewBox="0 0 24 24"><g fill="none"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M20 17.5a1.5 1.5 0 0 1 .144 2.993L20 20.5H4a1.5 1.5 0 0 1-.144-2.993L4 17.5zm0-7a1.5 1.5 0 0 1 0 3H4a1.5 1.5 0 0 1 0-3zm0-7a1.5 1.5 0 0 1 0 3H4a1.5 1.5 0 1 1 0-3z"/></g></svg>
		     </label>
		     
		     <div className="hidden lg:flex lg:items-center lg:w-auto w-full peer-checked:block">
		     	<nav>
		     		<ul className="lg:flex lg:pt-0 pt-4 items-center justify-between text-base">
		     			<li><a className={"navlink" + (page==="About"?" bg-brand-800":"")} onClick={() => setPage("About")}>About</a></li>
		     			<li><a className={"navlink" + (page==="Contact"?" bg-brand-800":"")} onClick={() => setPage("Contact")}>Contact</a></li>
		     			<li><a className={"navlink" + (page==="Chat"?" bg-brand-800":"")} onClick={() => setPage("Chat")}>Chat</a></li>
		     		</ul>
		     	</nav>
		     </div>


		</header>

	);
}



export default Navbar;