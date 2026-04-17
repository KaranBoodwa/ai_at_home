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
		  "Yeah, because that’s definitely how things work.",
		  "Who?.....asked?",
		  "Please, tell me more—I’m on the edge of my seat...*yawn*",
		  "Right, because nothing could possibly go wrong.",
		  "The machinations of your mind are an enigma",
		  "I love how confidently incorrect that was.",
		  "Turns out there is such a thing as a wrong opinion.",
		  "Oh sure, let’s do it the hardest way possible.",
		  "Because that worked so well last time.",
		  "I've run out of basic responses, please deposit $5.99 to continue chatting"
		]
		return "roast", random.choice(roasts)