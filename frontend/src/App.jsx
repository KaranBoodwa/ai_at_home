import { useState, useRef, useEffect } from "react";
import Navbar from './Navbar';
import About from './About';
import Contact from './Contact';

export default function App(){
	const [page, setPage] = useState("Chat");
	const [hovered, setHovered] = useState(null);
	const [hasLoaded, setHasLoaded] = useState(false);
	const [conversations, setConversations] = useState([]);
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState("");
	const [personality, setPersonality] = useState("default");
	const [awaitingPersonality, setAwaitingPersonality] = useState(false);
	const [pendingConversationId, setPendingConversationId] = useState(null);
	const [conversationId, setConversationId] = useState(() =>{
		const storedId = localStorage.getItem("conversationId");
		return storedId ? parseInt(storedId) : null;
	});

	const chatBoxRef = useRef(null);
	const chatEndRef = useRef(null);

	const personalityNames = {
		default:{ name: "Ape"},
		sarcastic:{ name: "Clown"}
	};

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


	// Expose setters to browser console for debugging / fixing invalid states 
	useEffect(() => {
		window.__setConversationId = setConversationId;
		window.__setMessages = setMessages;
	}, []);

	useEffect(() =>{
		// Switch to just calling 'fetchConversations' in the future
		const loadConversations = async () => {
			try {
				const response = await fetch("http://localhost:8000/conversations");
				const response_data = await response.json();
				setConversations(response_data);
			}catch(error){
				console.error("Failed to load past conversations.", error)
			}
		};
		loadConversations();
	}, []);

	useEffect(() => {
		if(!conversationId) return;
		const loadMessages = async () => {
			if(!conversationId || hasLoaded) return;

			try{
				// console.log(conversationId);
				const response = await fetch(
					`http://localhost:8000/messages/${conversationId}`
				);
				const response_data = await response.json();
				setMessages(response_data);
				setHasLoaded(true);
			} catch(error){
				console.error("Failed to load message history.", error)
			}
		};
		loadMessages();
	}, [conversationId]);

	const fetchConversations = async () =>{
		const response = await fetch("http://localhost:8000/conversations");
		const response_data = await response.json();
		setConversations(response_data);
	}

	const setActiveConversation = (id) => {
		if (!id) return;
		const parsedId = parseInt(id);
		setConversationId(parsedId);
		localStorage.setItem("conversationId", parsedId);
	};

	// Create new chat, cleanup
	const newChat = () => {
		setMessages([]);
		setConversationId(null);
		localStorage.removeItem("conversationId");
		setPendingConversationId(null);
		setAwaitingPersonality(true);
	};

	const handleSelectConversation = async(id) =>{
		setActiveConversation(id);
		localStorage.setItem("conversationId", id);

		try{
			const response = await fetch(`http://localhost:8000/messages/${id}`);
			const response_data = await response.json();

			setMessages(response_data);
			const conv = conversations.find(c => c.id === id);
			setPersonality(conv?.personality || "default");
		}catch(error){
			console.error("Failed to load messages for conversation <"+id+">.",error)
		};

	};

	const selectPersonality = async(p) => {
		setPersonality(p);
		setAwaitingPersonality(false);
		setPendingConversationId(null);

	};

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
				body: JSON.stringify({ 
					message: userText,
					conversation_id: conversationId,
					personality: personality
				})
			});

			const newConversationId = response.headers.get("X-Conversation-Id");

			if (newConversationId && newConversationId!== "undefined"){
				// console.log("raw id: ",newConversationId);
				const parsedId = parseInt(newConversationId);
				// console.log("parsed id: ", parsedId);
				setActiveConversation(parsedId);
				localStorage.setItem("conversationId", parsedId);
				fetchConversations();
			}


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
			<Navbar page={page} setPage={setPage} />

		{/*Chatbot Area*/}
		<main style={styles.main}>

			{page === "Chat" && (
			<>
				{/* Sidebar*/}
				<div style={styles.sidebar}>
					<button onClick={newChat} style={styles.newChatButton}>
						New Chat
					</button>

					<div style={styles.conversationList}>
						{conversations.map((conv) =>(
							<div
								key={conv.id}
								style={{
									...styles.conversationItem,
									background:
										conversationId === conv.id ? "#1e293b" : "transparent"
								}}
								onClick={() => handleSelectConversation(conv.id)}
							>
								Chat #{conv.id}
							</div>

						))}
					</div>
				</div>

				{/* Messages */}
				<div style={styles.chatOuter}>
					{ !awaitingPersonality &&( <h5> Chatting with {personalityNames[personality]?.name || "Clanker"} </h5>)}
					<div style={styles.chatBox} ref={chatBoxRef}>
						{awaitingPersonality &&(
						<div style={styles.modal}>

							{/* To do: pull list of personalities and loop through*/}

							<h3>Pick a clanker to chat to</h3>
							<button style={styles.personalityButton} onClick={()=> selectPersonality("default")}>
								Ape
							</button>

							<button style={styles.personalityButton} onClick={()=> selectPersonality("sarcastic")}>
								Clown
							</button>
						</div>
						)}

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

					{/* Leaving in commented dropdown personality switcher for later testing*/}
					{/*<select
						value={personality}
						onChange={(e) => setPersonality(e.target.value)}
						style={{ marginRight: "10px", marginBottom: "20px"}}
					>
						<option value="default">Default</option>
						<option value="sarcastic">Sarcastic</option>
					</select>*/}

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
				<About />
			)}

			{page === "Contact" && (
				<Contact />
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

	newChatButton: {
		background: "#2563eb",
		color: "white",
		border: "none",
		padding: "8px 14px",
		borderRadius: "5px",
		cursor: "pointer",
		fontWeight: "500"
	},

	personalityButton: {
		background: "green",
		color: "white",
		border: "none",
		padding: "8px 14px",
		borderRadius: "5px",
		cursor: "pointer",
		fontWeight: "500",
		margin: "10px"
	},

	main: {
		flex: 1,
		display: "flex",
		overflow:"hidden",
		minHeight: 0
	},

	sidebar: {
		width: "250px",
		borderRight: "1px solid #222",
		padding: "10px",
		display:"flex",
		flexDirection: "column",
		gap: "10px",
		background: "#0a0a0a"
	},

	conversationList: {
		display: "flex",
		flexDirection: "column",
		gap: "5px",
		overflow:"auto"
	},

	conversationItem: {
		padding: "10px",
		borderRadius: "5px",
		cursor:"pointer",
		border: "1px solid #222"
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