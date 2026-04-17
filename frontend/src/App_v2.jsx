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
	const [awaitingPersonality, setAwaitingPersonality] = useState(true);
	const [pendingConversationId, setPendingConversationId] = useState(null);
	const [sidebarOpen, setSideBarOpen] = useState(false);
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

	useEffect(() => {
		scrollToBottom();
	},[messages]);

	useEffect(() => {
		if(page==="Chat"){
			scrollToBottom();
		}
	},[page]);

	const getConversation = async(id) =>{
		try{
			const response = await fetch(`http://localhost:8000/conversation/${id}`)
			if(!response.ok){
				return null;
			}
			const response_data = await response.json();
			console.log(response_data);
			return response_data
		}catch(error){
			console.error(`Failed to load conversation ${id}`, error)
		}
	}


	// Expose setters to browser console for debugging / fixing invalid states 
	useEffect(() => {
		window.__setConversationId = setConversationId;
		window.__setMessages = setMessages;
		window.getConversation = getConversation;
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
		fetchConversations();
		if(!conversationId) return;
		const loadMessages = async () => {
			if(!conversationId || hasLoaded) return;

			try{
				const response = await fetch(
					`http://localhost:8000/conversation/${conversationId}`
				);
				if(!response.ok){
					console.error(`Failed to load message history for ${conversationId}.`)
					localStorage.removeItem("conversationId");
					setConversationId(null);
					setAwaitingPersonality(true);
				}

				const response_data = await response.json();
				setMessages(response_data["messages"]);
				setPersonality(response_data["personality"]);
				setHasLoaded(true);
				setAwaitingPersonality(false);
			} catch(error){
				console.error(`Failed to load message history for ${conversationId}.`, error)
				localStorage.removeItem("conversationId");
				setConversationId(null);
				setAwaitingPersonality(true);
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
			const response = await fetch(`http://localhost:8000/conversation/${id}`);
			if(!response.ok){
				console.error(`Failed to load message history for ${conversationId}.`)
				localStorage.removeItem("conversationId");
				setConversationId(null);
				setAwaitingPersonality(true);
			}

			const response_data = await response.json();

			setMessages(response_data["messages"]);
			setPersonality(response_data["personality"]);
			setAwaitingPersonality(false);
		}catch(error){
			console.error("Failed to load messages for conversation <"+id+">.",error)
			awaitingPersonality(true);
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
			const response = await fetch("http://localhost:8000/newchat",{
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
		<>
		<div className="w-full h-full bg-gray-300">
			{/* Navbar */}
			<Navbar page={page} setPage={setPage} />

			{/*Chatbot Page*/}
			{page === "Chat" && (
			<>
			<div className="flex h-full">

				{/* Sidebar*/}
				<div className={`h-full mb-9 md:w-50 transition-width duration-300 bg-gray-200 rounded-md ${sidebarOpen?"w-64":"w-20"}`}>
					{/* New Chat Button */}
					<div className="flex justify-between items-center justify-center p-3">
						<h2 className={`m-auto text-xl font-bold md:block ${sidebarOpen?"block":"hidden"}`}>Conversations</h2>
						<button className="cursor-pointer block md:hidden flex justify-center" onClick={ ()=> setSideBarOpen(!sidebarOpen) }>
							{!sidebarOpen?<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M20 17.5a1.5 1.5 0 0 1 .144 2.993L20 20.5H4a1.5 1.5 0 0 1-.144-2.993L4 17.5zm0-7a1.5 1.5 0 0 1 0 3H4a1.5 1.5 0 0 1 0-3zm0-7a1.5 1.5 0 0 1 0 3H4a1.5 1.5 0 1 1 0-3z"/></g></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" fillRule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="m12 14.122l5.303 5.303a1.5 1.5 0 0 0 2.122-2.122L14.12 12l5.304-5.303a1.5 1.5 0 1 0-2.122-2.121L12 9.879L6.697 4.576a1.5 1.5 0 1 0-2.122 2.12L9.88 12l-5.304 5.304a1.5 1.5 0 1 0 2.122 2.12z"/></g></svg>}
						</button>
					</div>

					<div className="flex justify-between items-center justify-center">
						<button onClick={newChat} className="new_chat_btn mb-2 mt-3 w-7/9 mx-4 flex justify-center">
								<svg xmlns="http://www.w3.org/2000/svg" className={`block mx-2 ${sidebarOpen?"mx-2":"mx-0"}`} width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M20.7 7c-.3.4-.7.7-.7 1s.3.6.6 1c.5.5 1 .9.9 1.4c0 .5-.5 1-1 1.5L16.4 16L15 14.7l4.2-4.2l-1-1l-1.4 1.4L13 7.1l4-3.8c.4-.4 1-.4 1.4 0l2.3 2.3c.4.4.4 1.1 0 1.4M3 17.2l9.6-9.6l3.7 3.8L6.8 21H3zM7 2v3h3v2H7v3H5V7H2V5h3V2z"/></svg>
								<p className={`md:block ${sidebarOpen?"block":"hidden"}`}>
									New Chat
								</p>
						</button>
					</div>

					<hr className="mb-2"/>

					{/* Conversation History */}
					<div className="max-h-170 min-h-0 mt-4 flex flex-col overflow-y-auto no-scrollbar">
						<ul>
							{conversations.map((conv) =>(
								<li
									key={conv.id}
									className={`convo ${conv.id===conversationId?"bg-purp-700 hover:bg-purp-400 text-white":"bg-gray-200 hover:bg-purp-400"}`}
									onClick={() => handleSelectConversation(conv.id)}
								>
									<span className={`md:block`}>
										#{conv.id}
									</span>
									<span className={`whitespace-pre md:block ${sidebarOpen?"block":"hidden"}`}>
										{" - " + personalityNames[conv.personality].name}
									</span>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Messages */}
				{ !awaitingPersonality &&( 
					<>
					<div className="h-full flex flex-col w-3/4 bg-gray-200 rounded-lg mx-auto mt-4 mb-4 p-16 shadow-xl" >
						<h5 className="text-2xl font-medium mb-2"> Chatting with {personalityNames[personality]?.name || "Clanker"} </h5>
						<hr className="mb-8"/>
						
						<div className="flex flex-col gap-10px mb-10px py-5px overflow-y-auto no-scrollbar" ref={chatBoxRef}>
							<div className="h-110 flex flex-col">
								{messages?.map((msg,i) => (
									<div
										className={`text-white my-2 p-3 rounded-md max-w-70 lg:max-w-120 drop-shadow-lg ${msg.role==="user"?"self-end bg-purp-500":"self-start bg-gray-700"}`}
										key={i}
									>
										{msg.content}
									</div>
								))}
								<div ref={chatEndRef} />
							</div>
						</div>

						{/* Input */}
						<div className="w-full flex mt-20 fixed-bottom">
							<input
								className="w-full mr-4 bg-gray-500 placeholder:text-slate-100 text-slate-100 text-sm border border-slate-600 rounded-md pl-3 pr-16 py-2 transition duration-300 ease focus:outline-none focus:border-purp-500 hover:border-purp-400 shadow-md focus:shadow focus:bg-gray-700 border-2"
								value={input}
								onChange={(e) => setInput(e.target.value)}
								placeholder="Type a message..."
								onKeyDown={(e) => e.key === "Enter" && sendMessage()}
							/>
							<button className="send_btn rounded py-2 px-5 border border-transparent text-center text-sm text-white transition-all shadow-sm hover:shadow focus:bg-purp-700 focus:shadow-none active:bg-purp-700 hover:bg-purp-700" onClick={sendMessage}>
								Send
							</button>
						</div>


					
					</div>
					</>
				)}
				
				{/* Personality Selection*/}
				{awaitingPersonality &&(
				<div className="flex flex-col w-3/4 m-10 bg-gray-200 rounded-lg mx-auto my-4 p-16 shadow-xl" >

					{/* To do: pull list of personalities and loop through*/}
					<h1 className="text-2xl font-medium mb-5">Pick a clanker to chat to</h1>
					<hr className="mb-5"/>
					<div className="flex block">
						<button className="basic_btn m-auto hover:shadow-md" onClick={()=> selectPersonality("default")}>
							{personalityNames["default"].name}
						</button>

						<button className="basic_btn m-auto hover:shadow-md" onClick={()=> selectPersonality("sarcastic")}>
							{personalityNames["sarcastic"].name}
						</button>
					</div>
				</div>
				)}

			</div>
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
		</>
	);
}