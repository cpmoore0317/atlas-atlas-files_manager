import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}/${database}`;

    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.db = null;

    // Connect to MongoDB and set the `db` property
    this.client.connect()
      .then(() => {
        console.log('Connected to MongoDB');
        this.db = this.client.db(database);
      })
      .catch((err) => {
        console.error(`MongoDB connection error: ${err}`);
      });
  }

  // Use the `topology` property to check connection state
  isAlive() {
    return this.client.topology?.isConnected();
  }

  // Fetch the number of documents in the 'users' collection
  async nbUsers() {
    if (!this.db) throw new Error('Not connected to MongoDB');
    const usersCollection = this.db.collection('users');
    return usersCollection.countDocuments();
  }

  // Fetch the number of documents in the 'files' collection
  async nbFiles() {
    if (!this.db) throw new Error('Not connected to MongoDB');
    const filesCollection = this.db.collection('files');
    return filesCollection.countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;
