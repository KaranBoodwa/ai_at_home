from app.Bots.personalities.Base import BasePersonality


class Ape(BasePersonality):
	def __init__(self):
		self.stateHandlers = {
			"default":self.mirror
		}

	def mirror(self, state, msg):
		return "default", msg