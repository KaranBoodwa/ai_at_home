# Book ingester - processes all pdfs / txts / docs in specified books path, chunks, embeds, and indexes them
# Ingestion Pipeline (study):
# 	checkout(dir) 	=> gathers all paths of books in given directory 
#	read_book(path) => processes single book and gathers all text
# 	chunkate(book) 	=> chunks books into ~4 sentence chunks (thinking this is a good amt for quotes)
# 	embed(chunks)	=> generates embeddings and stores in a faiss index

from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
from docx import Document
import numpy as np
import faiss
import re
import json
import os
import sys


# Config vars
BOOK_DIR = ".\\Books"
INDEX_DIR = ".\\Index"
EXTENSIONS = {".txt", ".pdf", ".docx"}
QUOTE_LENGTH = 250 # Refers to size in chars of a good book quote roughly
MODEL = ".\\Models\\all-mpnet-base-v2" # Quality > speed
MODEL_DIM = 768
INDEX_FILE = "faiss.index"
CHUNK_FILE = "chunks.jsonl"
META_FILE  = "meta.json" # I'm So Meta Even This Acronym


# Checks out books from the library
# In other words, iterates through the files in a given directory and compiles a list of docs 
# of all acceptable doc types (governed by the EXTENSIONS set above)
# Exclude books already read (present in meta.json)
def checkout(folder):
	if not os.path.isdir(folder):
		raise OSError(f"Given directory: [{folder}] not found.")

	books = []

	# For each file in the given directory, add it to list of books if extension is acceptable
	for file in os.listdir(folder):
		file_path = os.path.join(folder, file)
		if os.path.isfile(file_path):
			extension = "." + file.split(".")[-1]
			if extension in EXTENSIONS:
				books.append(file_path)

	return books


# Quickly reads a book and retains all the information contained within, how smart
def read_book(book_path):
	extension = "." + book_path.split(".")[-1]
	contents = ""

	# Different parsing based on extension
	if extension == ".txt":
		with open(book_path, 'r', encoding='utf-8', errors='ignore') as book:
			contents = book.read()

	elif extension == ".pdf":
		reader = PdfReader(book_path)
		for page in reader.pages:
			contents = contents + ((page.extract_text() + "\n") or "")
	elif extension == ".docx":
		doc = Document(book_path)
		for p in doc.paragraphs:
			contents = contents + p.text + "\n"

	return contents


# Turns contents into ~250 character chunks, aiming for ~4 sentences roughly
# Goal is to generate chunks that stand alone as decent sized quotations of a text
def chunkate(contents):
	# Splits contents into separate sentences by looking for clause ending punctuation
	sentences = [(re.sub(r'[\s+]',' ',x)) for x in (re.split(r'[.!?;]+',contents))]
	chunks = []

	i = 0
	while i < len(sentences):
		chunk_sentences = ""
		num_sentences = 0
		while len(chunk_sentences) < QUOTE_LENGTH and i+num_sentences < len(sentences):
			chunk_sentences = chunk_sentences + sentences[i+num_sentences].strip()
			num_sentences += 1

		chunks.append(chunk_sentences)

		i = i + num_sentences
		# Allow overlaps of 1 sentence if current chunk is larger than just 1 sentence
		if num_sentences > 1:
			i -=1

	return chunks


# Manual chunking mode, chunks a given text into chunks separated by a given separator
def manual_chunk(book_path, separator):
	contents = ""
	with open(book_path, 'r', encoding='utf-8') as book:
		contents = book.read()
	
	chunks = re.split(rf'{separator}',contents)

	for chunk in chunks[:5]:
		print(f"{chunk}")

	return chunks


def embed(chunks):
	model = SentenceTransformer(MODEL)
	vectors = model.encode(chunks, show_progress_bar=True)
	return np.array(vectors).astype("float32")


def add_index(vectors):
	index_path = os.path.join(INDEX_DIR,INDEX_FILE)
	dim = vectors.shape[1]
	print(dim)
	index = faiss.IndexFlatL2(dim)

	index.add(vectors)
	faiss.write_index(index, index_path)


# Go study
# Main entrypoint for the ingestion pipeline
def study(folder):
	try:
		books = checkout(folder)
		chunks = []
		chunks_plus_meta = []
		chunk_counter = 0 # Used to generate chunk id metadata

		print(books)
		for book in books:
			book_title = book.split("\\")[-1]
			print(f"reading book: {book_title}")
			contents = read_book(book)

			print(f"chunking book: {book_title}")
			# book_chunks = chunkate(contents)

			# Manual chunk mode for specially prepared files
			book_chunks = manual_chunk(contents,"##")

			# Currently I double store chunks into 2 lists, one with metadata, and one designed to be piped to embed()
			# Need a better solution to avoid double storage
			for chunk in book_chunks:
				chunk_json = {"file_name":book_title, "chunk_id": chunk_counter, "text":chunk}
				chunk_counter += 1
				chunks_plus_meta.append(chunk_json)
				chunks.append(chunk)

			print(f"{book_title} split into {len(book_chunks)} chunks")

			
		vectors = embed(chunks)
		add_index(vectors)

		# Persistence --------------------------------------
		# Ensure index dir exists before writing to it
		if not os.path.isdir(INDEX_DIR):
			os.mkdir(INDEX_DIR)

		# Dump chunks to chunks.jsonl
		print("dumping chunks...")
		with open(os.path.join(INDEX_DIR,CHUNK_FILE),'w') as file:
			for chunk in total_chunks:
				file.write(json.dumps(chunk)+'\n')

		print("dumping meta...")
		# Dump metadata to meta.json
		with open(os.path.join(INDEX_DIR,META_FILE), 'w') as file:
			books_json = {}
			for book in books:
				book_title = book.split("\\")[-1]
				books_json[book_title]={"title":"","author":""}
			file.write(json.dumps(books_json,indent=4))

	except OSError as e:
		print(e)


def load_index():
	index_path = os.path.join(INDEX_DIR,INDEX_FILE)
	chunks_path = os.path.join(INDEX_DIR,CHUNK_FILE)
	index = faiss.read_index(index_path)
	chunks = []
	with open(chunks_path, 'r') as file:
		for line in file:
			chunks.append(json.loads(line))

	return index, chunks

# Sample query method to test embeddings
def query(index, chunks, q, k=5):
	q_vec = embed([q])
	dist, idx = index.search(q_vec, k)
	results = []
	for i in idx[0]:
		results.append(chunks[i])

	return results

# To do: add optional argument to just regenerate embeddings, without re-chunking
# Also: skip files with file names in meta.json
if __name__=="__main__":	
	# Optional argument specifying directory to ingest
	if len(sys.argv) > 1:
		BOOK_DIR = sys.argv[1]

	# books = checkout(BOOK_DIR)
	# print(books)
	# study(BOOK_DIR)


	# Sample test
	# index, chunks = load_index()

	# results = query(index,chunks, "What is love?")
	# print("What is love? Shakespeare says: \n")
	# for result in results:
	# 	print(result)


	# manual_chunk(".\\Books\\shakespeare_sonnets.txt","##")