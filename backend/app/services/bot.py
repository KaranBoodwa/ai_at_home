import asyncio

async def stream_mirror(text):
	for char in text:
		# simulate a stream of text
		await asyncio.sleep(0.03)
		yield char