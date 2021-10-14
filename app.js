import express from "express";
import cors from "cors";
import pg from "pg";

const { Pool } = pg;

const connection = new Pool({
  user: "bootcamp_role",
  password: "senha_super_hiper_ultra_secreta_do_role_do_bootcamp",
  host: "localhost",
  port: 5432,
  database: "boardcamp",
});

const app = express(); // create server
app.use(express.json());
app.use(cors());

app.get("/categories", (req, res) => {
  const query = connection.query("SELECT * FROM categories").then((result) => {
    res.send(result.rows);
  });
});

app.listen(4000); // start server
