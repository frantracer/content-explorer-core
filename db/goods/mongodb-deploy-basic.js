connection = new Mongo();
db = connection.getDB("linkurator-db");

db.createCollection("users");
