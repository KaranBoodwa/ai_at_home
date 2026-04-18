import random
from app.Bots.personalities.Base import BasePersonality


# 2 states:
# - default: returns a greeting

class Clown(BasePersonality):
	def __init__(self):
		self.stateHandlers = {
			"default":self.greeting,
			"roast":self.roast
		}


	def greeting(self, state, msg):
		greetings = [
			"Sup! Mistakes have already been made",
			"Honk Honk",
			"Howdy Do",
			"*Yawn*",
			"Sorry, didn't notice you down there lil pup, what's up?"
		]
		return "roast", random.choice(greetings) 	


	def roast(self, state, msg):
		roasts = [
		  "Oh wow, what a brilliant statement. Somtimes things have never been said before for a reason.",
		  "Who?.....asked?",
		  "The machinations of your mind are an enigma",
		  "I love how confidently incorrect that was.",
		  "Turns out there is such a thing as a wrong opinion.",
		  "I've run out of basic responses, please deposit $5.99 to continue chatting",
		  "If I agree, will you stop talking?",
		  "Sorry, I didn't hear you, could you repeat that?",
		  "You don't say",
		  "Crazy? I was crazy once. They locked me in a room. A rubber room. A rubber room with Rats. Rats make me crazy. Crazy? I was crazy once. They locked me in a room. A rubber room. A rubber room with Rats. Rats make me crazy. Crazy? I was crazy once. They locked me in a room. A rubber room. A rubber room with Rats. Rats make me crazy. Crazy? ...",
		  "You'd fit right in at the circus!",
		]
		return "roast", random.choice(roasts)