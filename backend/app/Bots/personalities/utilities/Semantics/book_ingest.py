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
from nltk.tokenize import PunktTokenizer

# Only used for testing 
import random
import transformers

# Config vars
BOOK_DIR = ".\\Books"
INDEX_DIR = ".\\Index"
EXTENSIONS = {".txt", ".pdf", ".docx"}
MODEL = ".\\Models\\all-mpnet-base-v2" # Quality > speed
MODEL_DIM = 768 # Here for reference and checks, unused
BATCH_SIZE = 32 # Embedding batch size
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

	# Fetch list of books already read
	reading_log = {}
	reading_log_path = os.path.join(INDEX_DIR,META_FILE)
	if os.path.isfile(reading_log_path):
		with open(reading_log_path, 'r', encoding='utf-8') as log:
			reading_log = json.load(log)

	books = []
	# For each file in the given directory, add it to list of books if extension is acceptable and not already read
	for file in os.listdir(folder):
		file_path = os.path.join(folder, file)
		if os.path.isfile(file_path) and file not in reading_log:
			extension = "." + file.split(".")[-1]
			if extension in EXTENSIONS:
				books.append(file_path)

	print(books)
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


# Turns contents 5 sentence chunks with 1 sentence overlaps
# Goal is to generate chunks that stand alone as decent sized quotations of a text
def chunkate(contents, quote_length=5, overlap=1):
	# Splits contents into separate sentences by utilizing nltk
	sent_tokenizer = PunktTokenizer()
	sentences = sent_tokenizer.tokenize(contents.strip())
	chunks = []

	i = 0
	while i < len(sentences):
		chunks.append(" ".join(sentences[i:i+quote_length]))
		i += quote_length - overlap

	
	return chunks


# Manual chunking mode, chunks a given text into chunks separated by a given separator
def manual_chunk(contents, separator):
	# Don't include any empty chunks
	chunks = [c for c in re.split(rf'{separator}',contents) if c.strip()]
	return chunks


def embed(chunks,progress_bar=True, batch_size=BATCH_SIZE):
	model=SentenceTransformer(MODEL)
	vectors = model.encode(chunks, batch_size=batch_size, show_progress_bar=progress_bar)
	return np.array(vectors).astype("float32")

def embed_query(question):
	model=SentenceTransformer(MODEL)
	vector = model.encode_query(question, show_progress_bar=False)
	return np.array(vector).astype("float32")

def create_index(vectors):
	dim = vectors.shape[1]
	idx = faiss.IndexFlatL2(dim)
	idx.add(vectors)
	return idx

# Go study
# Ingestion pipleline as described at top of file
def study(folder):
	if not os.path.isdir(folder):
		raise OSError(f"Given directory: [{folder}] not found.")

	# Gather list of books to chunk and embed
	books = checkout(folder)

	# End pipeline early if nothing new to add
	if not books:
		print("No new files found")
		return

	# If index already exists, load it
	# For other vars, they will be used to append to existing records if they exist in retain()
	idx = load_index()
	chunks = []
	meta = {}

	for book in books:
		book_title = book.split("\\")[-1]
		print(f"reading book: {book_title}")
		contents = read_book(book)

		print(f"chunking book: {book_title}")
		book_chunks = chunkate(contents)
		# book_chunks = manual_chunk(contents,"##")

		print(f"{book_title} split into {len(book_chunks)} chunks")

		# Embed the book chunks and add to vector store
		book_vectors = embed(book_chunks)
		if idx is None:
			idx = create_index(book_vectors)
		else:
			idx.add(book_vectors)

		# Generate info for chunks and meta
		meta[book_title] = {
			"title":"",
			"author":"",
			"number_of_chunks":len(book_chunks)
		}
		for book_chunk in book_chunks:
			chunks.append({"file_name":book_title,"text":book_chunk})


	retain(idx,chunks,meta)



# Retain all the information consumed so it can be remembered later
# AKA write index, chunks, and metadata to files to be loaded
def retain(idx, chunks, meta):
	index_path = os.path.join(INDEX_DIR,INDEX_FILE)
	chunks_path = os.path.join(INDEX_DIR,CHUNK_FILE)
	meta_path = os.path.join(INDEX_DIR,META_FILE)

	# Ensure index dir exists before writing to it
	if not os.path.isdir(INDEX_DIR):
		os.mkdir(INDEX_DIR)

	# Dump index to faiss.index
	print("dumping index...")
	faiss.write_index(idx, index_path)

	# Dump chunks to chunks.jsonl
	# Loads existing chunks to avoid any empty lines & ensure lineup for embedding vectors
	print("dumping chunks...")
	chunk_log = load_chunks()
	if not chunk_log:
		chunk_log = chunks
	else:
		chunk_log = chunk_log + chunks
	with open(chunks_path,'w') as file:
		for chunk in chunk_log:
			file.write(json.dumps(chunk)+'\n')

	# Dump metadata to meta.json
	print("dumping meta...")
	meta_log = load_meta()
	if meta_log:
		meta.update(meta_log)
	with open(meta_path, 'w') as file:
		file.write(json.dumps(meta,indent=4))


def load_index():
	idx_path = os.path.join(INDEX_DIR,INDEX_FILE)
	if not os.path.isfile(idx_path):
		return None
	idx = faiss.read_index(idx_path)
	return idx

def load_chunks():
	chunks_path = os.path.join(INDEX_DIR,CHUNK_FILE)
	if not os.path.isfile(chunks_path):
		return None
	chunks = []
	with open(chunks_path, 'r') as file:
		for line in file:
			chunks.append(json.loads(line))
	return chunks

def load_meta():
	meta_path = os.path.join(INDEX_DIR,META_FILE)
	if not os.path.isfile(meta_path):
		return None
	meta = None
	with open(meta_path, 'r') as file:
		meta = json.load(file)
	return meta


# Sample query method to test embeddings
def query(index, chunks, q, k=5):
	q_vec = embed_query([q])

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

	study(BOOK_DIR)


	# =========Testing=========
	idx = load_index()
	chunks = load_chunks()

	while(True):
		question = input("Ask Away:")
		if question == "q":
			break
		results = query(idx, chunks, question)
		print("Results:")
		result = random.choice(results)
		print(f"File:{result['file_name']}\nExcerpt: {result["text"].strip()}")

