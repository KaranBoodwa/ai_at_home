import { useState, useRef, useEffect } from "react";

export default function App(){
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState("");
	const [page, setPage] = useState("Chat");

	const chatBoxRef = useRef(null);
	const chatEndRef = useRef(null);

	// Auto scrolling chat window function
	const scrollToBottom = () => {
		chatEndRef.current?.scrollIntoView({ behavior: "smooth"});
	};

	const isNearBottom = () =>{
		const el = chatBoxRef.current;
		if(!el) return true;

		const threshold = 120;
		return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
	};

	useEffect(() => {
		if (isNearBottom()){
			scrollToBottom();
		}
	},[messages]);

	const sendMessage = async () => {
		if (!input.trim()) return;

		const userText = input;

		setMessages((prev) =>[
			...prev,
			{ role: "user", content: userText },
			{ role: "bot", content: "..."}
		]);

		setInput("");

		try {
			const response = await fetch("http://localhost:8000/chat",{
				method: "POST",
				headers: {
					"Content-Type":"application/json"
				},
				body: JSON.stringify({ message: userText })
			});

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			let botText = "";

			while(true){
				const {value, done} = await reader.read();
				if(done) break;

				botText +=decoder.decode(value, { stream: true });
				setMessages((prev) =>{
					const updated = [...prev];
					updated[updated.length-1] = {
						role: "bot",
						content: botText,
					};
					return updated;
				});
			}

			
		} catch(error) {
			console.error(error);
		}

	};

	return (
		<div style={styles.page}>
			{/* Navbar */}
			<header style={styles.navbar}>
				<div style={styles.logo}>We have Al at home</div>

				<div style={styles.navLinks}>
					<button onClick={() => setPage("Chat")} style={styles.navlink}>
						Chat
					</button>
					<button onClick={() => setPage("About")} style={styles.navlink}>
						About
					</button>
					<button onClick={() => setPage("Contact")} style={styles.navlink}>
						Contact
					</button>
				</div>
			</header>

		{/*Chatbot Area*/}
		<main style={styles.main}>
			
			{page === "Chat" && (
			<>
				<h2> We have Al at home </h2>
				{/* Messages */}
				<div style={styles.chatOuter}>
					<div style={styles.chatBox} ref={chatBoxRef}>
						{messages.map((msg,i) => (
							<div
								key={i}
								style={{
									...styles.message,
									alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
									background: msg.role === "user" ? "#2563eb" : "#333"
								}}
							>
								{msg.content}
							</div>
						))}
						<div ref={chatEndRef} />
					</div>

					{/* Input */}
					<div style={styles.inputRow}>
						<input
							style={styles.input}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="Type a message..."
							onKeyDown={(e) => e.key === "Enter" && sendMessage()}
						/>
						<button 
							style={styles.button}
							onClick={sendMessage}
						>
							Send
						</button>
					</div>
				</div>
			</>
			)}


			{page === "About" && (
				<div style={{ padding: "10px" }}>
					<h2>About</h2>
					<p>
						This is a creative writing exercise masquerading as a coding side project.
						If this was somehow useful or helpful for you, I apologize. Our engineers are working tirelessly to correct this to ensure it never happens again.

						This will eventually feature a suite of different personalities to chat with (maybe, idk, if I don't get bored I guess)
					</p>
				</div>
			)}

			{page === "Contact" && (
				<div style={{ padding: "10px" }}>
					<h2>Contact Form</h2>
					<p>
						This may one day feature a contact form if I feel so generous
					</p>
				</div>
			)}


		</main>

		{/* Footer */}
		<footer style={styles.footer}>
			© 2026 Karan Boodwa-Ko
		</footer>
	</div>
	);
}

// Styles
const styles = {
	page: {
		height: "100vh",
		width: "100%",
		display: "flex",
		flexDirection: "column",
		background: "#111",
		color: "white",
		overflow:"hidden"
	},

	navbar: {
		width: "100%",
		height: "60px",
		display: "flex",
		alignItems: "center",
		padding: "0 20px",
		borderBottom: "1px solid #222",
		background: "#0a0a0a"
	},

	navLinks: {
		marginLeft:"auto",
		display:"flex",
		gap:"12px"
	},

	navLink: {
		background: "transparent",
		border: "1px solid #333",
		color:"white",
		padding:"6px 10px",
		borderRadius:"6px",
		cursor:"pointer",
		fontSize:"15px"
	},

	logo:{
		fontWeight:"bold",
		fontSize: "16px"
	},

	main: {
		flex: 1,
		display: "flex",
		flexDirection: "column",
		padding: "20px",
		overflow:"hidden",
		minHeight: 0
	},

	footer: {
		width: "100%",
		height: "40px",
		flexShrink: 0,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		borderTop: "3px solid #222",
		marginTop: "auto",
		fontSize: "12px",
		color: "#888",
		background: "0a0a0a"
	},

	chatOuter:{
		flex: 1,
		display: "flex",
		flexDirection: "column",
		maxWidth: "800px",
		width:"100%",
		minHeight: 0,
		margin: "0 auto",
		padding: "0 16px"
	},

	chatBox: {
		flex: 1,
		display: "flex",
		flexDirection: "column",
		gap: "10px",
		overflowY: "auto",
		marginBottom: "10px",
		paddingRight: "5px",
		minHeight: 0
	},

	message: {
		padding: "10px 14px",
		borderRadius: "15px",
		maxWidth: "60%"
	},

	inputRow: {
		display: "flex",
		gap: "10px"
	},

	input: {
		flex: 1,
		padding: "10px",
		borderRadius: "10px",
		border: "none"
	},

	button: {
		padding: "10px 15px",
		borderRadius: "10px",
		border: "none",
		background: "#2563eb",
		color: "white",
		cursor: "pointer"
	}
}