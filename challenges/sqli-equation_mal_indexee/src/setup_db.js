const { MongoClient } = require('mongodb');

const MONGO_URL = "mongodb://127.0.0.1:27017";
const DB_NAME = "ramanujan";

async function init() {
  try {
    const client = await MongoClient.connect(MONGO_URL);
    const db = client.db(DB_NAME);

    await db.collection("users").deleteMany({});

    await db.collection("users").insertMany([
      {
        username: "user",
        password: "passwordfhudsqiofhq!123",
        role: "user"
      },
      {
        username: "guest",
        password: "passwordfhudsqiofhq!123",
        role: "user"
      },
      {
        username: "ramanujan_admin",
        password: "supersecrethjfuidsohfuqsidoh!123",
        role: "elite"
      }
    ]);

    console.log("Users inserted successfully");
    await client.close();
  } catch (err) {
    console.error("Setup failed:", err);
  }
}

init();