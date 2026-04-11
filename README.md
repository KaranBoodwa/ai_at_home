# AI At Home


## Description
Forget the ChatGPTs, Claude's, Gemini's, etc. , we have AI at home.
What if we took out all of the helpful parts of ai assistants and replaced them with :sparkle: personality :sparkle: ?
Welcome to AI at home, the minimally helpful, maximally efficient, and entertaining alternative to wasting water



## Disclaimer:
	This is intended as satire. Any actual assistance is completely unintended. Enjoy!



## Technology Stack:
	Vite + React
	Python
		FastAPI
		uvicorn
		ORM: SQLAlchemy
	Postgres

	To Be Added:
		Retrieval Augmented Generation system for better bot context + responses
			faiss vector store
			sentence-transformers for embeddings
			optional: fast llm model for chat variance and more sensible chat flow
				currently 50/50 on whether or not I include this as it somewhat goes against the initial concept / design
				but if it can be made fast and light enough then maybe

		Various Bot personalities with differing levels of complexity
			-The professor - takes your initial prompt and looks up fitting passages in classic literature in an attempt to help you think critically / answer your questions for yourself
				Need to source a large number of works of classic lit to make this work
			-The gaslighter / 'arsonist' - takes your questions/prompts and looks up semantically adjacent trivia questions/frequently asked questions to which it knows the answer, then alters your chat to ensure that it answers exactly what was asked. Gaslighting isn't real :)
				Need to source a good amount of trivia for this (maybe a db of jeopardy questions or trivial pursuit, something along those lines)
			-Mom - tends to ignore your questions and instead focuses on things like making sure you've done your chores and homework. Once responsibilities have been taken care of, might attempt to answer question
			-Dad - just tells you to ask your mother and then adds mom to chat
			-AI - Actually Indian - simulates indian IT support
			-Plagiarist - looks up wikipedia articles related to queries and pastes the first sections
			-Memer - responds with relevant gifs and memes

		Docker support for production

To Do:
	-Properly templatize react components
	-Add a frontend framework to make things look prettier
	-Clean up code and documentation
	-Add build instructions to README
	-Make a better README :joy:
