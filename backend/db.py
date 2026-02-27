from pymongo import MongoClient

MONGO_URL = "mongodb://localhost:27017"
client = MongoClient(MONGO_URL)

db = client["workflow_engine"]
users_collection = db["users"]
workflows_collection = db["workflows"]
