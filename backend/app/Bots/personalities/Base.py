from abc import ABC, abstractmethod

# Defines a template for how new personalities should be implemented
# Ensures some consistency when called from PersonalityCore which will call on chat to process a given state+message combination
class BasePersonality(ABC):

	# Expectation for children to define self.stateHandlers in init to map states to respective handling methods


	def chat(self, state, msg):
		new_state, response=self.stateHandlers.get(state, self.stateHandlers.get("default"))(state, msg)
		return new_state, response