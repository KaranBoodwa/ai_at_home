from app.Bots.personalities.Ape import Ape
from app.Bots.personalities.Clown import Clown



class PersonalityCore():

	def __init__(self):
		
		# Personality instances
		self.ape = Ape()
		self.clown = Clown()

		# Personality registry
		self.personality_cfg = {
			"default":{
				"name":"Ape",
				"handler":self.ape,
				"icon":None
			},
			
			"sarcastic":{
				"name":"Clown",
				"handler":self.clown,
				"icon":None
			}
		}

	# Input: personality, state, message
	# Output: new state, response
	# Gets instance of personality and generates response
	def respond(self, personality, state, message):
		new_state, response = self.personality_cfg.get(personality,"default").get("handler").chat(state, message)
		return new_state, response






if __name__ == "__main__":
	print("Testing Personality Core")


	print("Testing Ape")
	apeHandler = Ape()
	state = "default"
	msg = "Hello,World!"
	new_state, response = apeHandler.chat(state,msg)
	print(f"[{state},{msg}]=>[{new_state},{response}]")

	clownWrangler = Clown()
	state = "default"
	msg = "Hello"
	new_state, response = clownWrangler.chat(state, msg)
	print(f"[{state},{msg}]=>[{new_state},{response}]")
	new_state, response = clownWrangler.chat(new_state, "wtf did you say to me")
	print(f"[{state},{msg}]=>[{new_state},{response}]")
