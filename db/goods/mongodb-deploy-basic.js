connection = new Mongo();
db = connection.getDB("linkurator-db");

db.createCollection("users");

db.createCollection("contentmarks");
db.contentmarks.insertOne({_id: ObjectId("000000000000000000000000"), name: "Uncategorized", subscriptions: []});

db.createCollection("subscriptions");

db.createCollection("feeds");
