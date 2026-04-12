import { useState, useRef, useEffect } from "react";
import Navbar from './Navbar';
import Footer from './Footer';
import About from './About';
import Contact from './Contact';
import './styles/app.css';

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
		// chatEndRef.current?.scrollIntoView({ behavior: "smooth"});
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
		<div className="w-full h-full bg-brand-900">
			{/* Navbar */}
			<Navbar page={page} setPage={setPage} />

			{/*Chatbot Area*/}
			{page === "Chat" && (
			<>
			<main className="flex">
				{/* Sidebar*/}
				<div className="flex flex-col w-1/4 items-center overflow-y-scroll h-180">
					<button onClick={newChat} className="new_chat_btn mb-2 mt-1 w-8/9">
						New Chat
					</button>

					{conversations.map((conv) =>(
						<div
							key={conv.id}
							className={"border-1 cursor-pointer text-white basic_btn m-1 w-8/9" + (conversationId === conv.id ? " bg-brand-600" : " bg-brand-900")}
							onClick={() => handleSelectConversation(conv.id)}
						>
							Chat #{conv.id}
						</div>

					))}

				</div>

				{/* Messages */}
				<div className="flex flex-col w-3/4 m-10">
					{ !awaitingPersonality &&( 
						<><h5 className="text-white m-2 text-2xl"> Chatting with {personalityNames[personality]?.name || "Clanker"} </h5>
						<hr className="mb-5"/></>
					)}
					
					<div className="flex flex-col gap-10px mb-10px py-5px overflow-auto" ref={chatBoxRef}>
						{awaitingPersonality &&(
						<div>

							{/* To do: pull list of personalities and loop through*/}

							<h3>Pick a clanker to chat to</h3>
							<button className="basic_btn m-3" onClick={()=> selectPersonality("default")}>
								Ape
							</button>

							<button className="basic_btn m-3" onClick={()=> selectPersonality("sarcastic")}>
								Clown
							</button>
						</div>
						)}

						{messages.map((msg,i) => (
							<div
								className="text-white p-3 rounded-md max-w-70"
								key={i}
								style={{
									alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
									background: msg.role === "user" ? "#48356c" : "#333"
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

					<div className="flex gap-10px mt-10">
						<input
							className="flex w-full border-1 h-full p-1 rounded-md"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="Type a message..."
							onKeyDown={(e) => e.key === "Enter" && sendMessage()}
						/>
						<button 
							className="basic_btn"
							onClick={sendMessage}
						>
							Send
						</button>
					</div>
				</div>
			</main>
			</>
			)}


			{page === "About" && (
				<About />
			)}

			{page === "Contact" && (
				<Contact />
			)}

			{/* Footer */}
			<Footer /> 
		</div>
	);
}