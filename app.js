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

const inputIsEmpty = (input) => {
  if (!input || input === "") return true;
  return false;
};

const nameIsNotAvailable = async (name, table) => {
  const categories = await connection.query(`SELECT * FROM ${table}`);
  return categories.rows.some((elem) => elem.name === name);
};

const app = express(); // create server
app.use(express.json());
app.use(cors());

app.get("/categories", async (req, res) => {
  try {
    const query = await connection.query("SELECT * FROM categories");
    res.send(query.rows);
  } catch {
    res.sendStatus(500);
  }
});

app.post("/categories", async (req, res) => {
  try {
    const { name } = req.body;

    if (inputIsEmpty(name)) {
      res.sendStatus(400);
    } else if (await nameIsNotAvailable(name, "categories")) {
      res.sendStatus(409);
    } else {
      const query = await connection.query(
        `INSERT INTO categories (name) VALUES ($1);`,
        [name]
      );
      res.sendStatus(201);
    }
  } catch (error) {
    res.sendStatus(500);
  }
});

app.get("/games", async (req, res) => {
  try {
    const name = req.query.name;
    if (name) {
      const query = await connection.query(
        `
    	SELECT 
    		games.*,
        	categories.name AS "categoryName" 
      	FROM games
        	JOIN categories
          	ON games."categoryId" = categories.id
		WHERE games.name ~*$1
    	`,
        [name]
      );
      res.send(query.rows);
    } else {
      const query = await connection.query(`
      	SELECT 
        	games.*,
        	categories.name AS "categoryName" 
      	FROM games
        	JOIN categories
          	ON games."categoryId" = categories.id
    	`);
      res.send(query.rows);
    }
  } catch {
    res.sendStatus(500);
  }
});

app.listen(4000); // start server
