import { useState, useRef, useEffect } from "react";
import Navbar from './Navbar';
import Footer from './Footer';
import About from './About';
import Contact from './Contact';
import './styles/app.css';

export default function Test(){
	const [page, setPage] = useState("About");


	return (
		<>
			<Navbar page={page} setPage={setPage} />
			<div className="bg-gray-300">
				{page === "About" && (
					<>
						<About />
					</>
				)}
				{page === "Contact" &&(
					<>
						<Contact />
					</>
				)}
			</div>
			<Footer />
		</>
	);
}