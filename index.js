const express = require("express");
const multer = require("multer");
const { ObjectId } = require("mongodb");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
app.use(cors());
const upload = multer({ dest: "uploads/" });

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("task");
    const taskCollection = db.collection("tasks");

    app.get("/task", async (req, res) => {
      const result = await taskCollection.find().toArray();
      res.send(result);
    });
    app.get("/task/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await taskCollection
          .find({ _id: new ObjectId(id) })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Invalid ID format" });
      }
    });

    // app.post("/api/upload", upload.array("files"), (req, res) => {
    //   console.log(req.files);
    //   res.json({ message: "Files uploaded successfully!" });
    // });

    app.patch("/api/upload/:id", upload.array("files"), async (req, res) => {
      try {
        const id = req.params.id;

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ message: "No files uploaded" });
        }

        const attachments = req.files.map((file) => ({
          filename: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
        }));

        const result = await taskCollection.updateOne(
          { _id: new ObjectId(id) },
          { $push: { attachments: { $each: attachments } } }
        );

        if (result.modifiedCount > 0) {
          res.json({
            message: "Files uploaded and attachments updated successfully!",
          });
        } else {
          res.status(404).json({ message: "Task not found, update failed." });
        }
      } catch (error) {
        console.error("Error updating attachments:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // Start the server
    app.listen("5000", () => {
      console.log(`Server is running on http://localhost:5000`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
