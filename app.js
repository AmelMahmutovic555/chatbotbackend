import express, { response } from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import { CurrentDate } from "./public/date-feature/date.js";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

const db = new pg.Client({
  connectionString:
    "postgresql://neondb_owner:npg_obqifSDg7Uz2@ep-delicate-dawn-agged4nf-pooler.c-2.eu-central-1.aws.neon.tech/chatai?sslmode=require&channel_binding=require",
  ssl: {
    rejectUnauthorized: false,
  },
});

db.connect();

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

app.get("/get-info", async (req, res) => {
  try {
    const result = await db.query("select * from chatbot");
    if (result.rows.length > 0) {
      res.status(200).json({ result: result.rows });
    }
  } catch (error) {
    console.error(error);
  }
});

app.post("/find-complexity", async (req, res) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: req.body.message }],
    });

    if (req.body.message) {
      await db.query(
        "insert into chatbot (message, role, date) values ($1, $2, $3) returning id, message, role, date",
        [req.body.message, "user", CurrentDate()]
      );
    }

    if (response.choices[0].message.content) {
      await db.query(
        "insert into chatbot (message, role, date) values ($1, $2, $3) returning id, message, role, date",
        [response.choices[0].message.content, "ai", CurrentDate()]
      );
    }

    return res.status(200).json({
      message: response.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Error communicating with OpenAi API",
    });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
