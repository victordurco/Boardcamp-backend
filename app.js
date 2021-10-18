import express from "express";
import cors from "cors";
import pg from "pg";
import joi from "joi";

const { Pool } = pg;

const connection = new Pool({
  user: "bootcamp_role",
  password: "senha_super_hiper_ultra_secreta_do_role_do_bootcamp",
  host: "localhost",
  port: 5432,
  database: "boardcamp",
});

// VALIDATION FUNCTIONS
const inputIsEmpty = (input) => {
  if (!input || input === "") return true;
  return false;
};

const nameIsNotAvailable = async (name, table) => {
  const query = await connection.query(`SELECT * FROM ${table}`);
  return query.rows.some((elem) => elem.name === name);
};

const gameObjIsInvalid = async (game) => {
  let categoryIsValid = false;
  const category = parseInt(game.categoryId);
  const gameSchema = joi.object({
    name: joi.string().min(3).required(),
    image: joi.string().uri(),
    categoryId: joi.number().integer().min(0),
    stockTotal: joi.number().integer().min(0),
    pricePerDay: joi.number().integer().min(0),
  });
  const query = await connection.query("SELECT * FROM categories");
  query.rows.forEach((elem) => {
    if (elem.id === category) categoryIsValid = true;
  });
  const { error } = gameSchema.validate(game);
  if (error || !categoryIsValid) return true;
  else return false;
};

const customerObjIsInvalid = async (customer) => {
  const customerSchema = joi.object({
    name: joi.string().min(3).required(),
    phone: joi
      .string()
      .min(10)
      .max(11)
      .pattern(/[0-9]{10,11}/),
    cpf: joi
      .string()
      .min(11)
      .max(11)
      .pattern(/[0-9]{11}/),
    birthday: joi
      .string()
      .min(10)
      .max(10)
      .pattern(/[0-9]{4}-[0-9]{2}-[0-9]{2}/),
  });
  const { error } = customerSchema.validate(customer);
  return error;
};

const cpfIsNotAvailable = async (cpf) => {
  const query = await connection.query(`SELECT * FROM customers`);
  return query.rows.some((elem) => elem.cpf === cpf);
};
// //

//  CREATE SERVER
const app = express();
app.use(express.json());
app.use(cors());

// CATEGORIES CRUD
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
// //

// GAMES CRUD
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

app.post("/games", async (req, res) => {
  try {
    const game = req.body;
    if (await gameObjIsInvalid(game)) {
      res.sendStatus(400);
    } else if (await nameIsNotAvailable(game.name, "games")) {
      res.sendStatus(409);
    } else {
      const query = await connection.query(
        `INSERT INTO 
				    games (name, image, "stockTotal", "categoryId", "pricePerDay") 
			    VALUES 
				    ($1, $2, $3, $4, $5);`,
        [
          game.name,
          game.image,
          game.stockTotal,
          game.categoryId,
          game.pricePerDay,
        ]
      );
      res.sendStatus(201);
    }
  } catch (error) {
    res.sendStatus(500);
  }
});
// //

// CUSTOMERS CRUD
app.get("/customers", async (req, res) => {
  try {
    const cpf = req.query.cpf;
    if (cpf) {
      const query = await connection.query(
        `SELECT * FROM customers WHERE customers.cpf ~*$1`,
        [cpf]
      );
      res.send(query.rows);
    } else {
      const query = await connection.query(`SELECT * FROM customers`);
      res.send(query.rows);
    }
  } catch {
    res.sendStatus(500);
  }
});

app.get("/customers/:id", async (req, res) => {
  try {
    const customerId = req.params.id;
    const query = await connection.query(
      `SELECT * FROM customers WHERE id = $1`,
      [customerId]
    );
    if (query.rowCount === 0) res.sendStatus(404);
    else res.status(200).send(query.rows);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/customers", async (req, res) => {
  try {
    const customer = req.body;
    if (await customerObjIsInvalid(customer)) {
      res.sendStatus(400);
    } else if (await cpfIsNotAvailable(customer.cpf)) {
      res.sendStatus(409);
    } else {
      const query = await connection.query(
        `INSERT INTO 
				    customers (name, phone, cpf, birthday) 
			    VALUES 
				    ($1, $2, $3, $4);`,
        [customer.name, customer.phone, customer.cpf, customer.birthday]
      );
      res.sendStatus(201);
    }
  } catch (error) {
    res.sendStatus(500);
  }
});

// //

app.listen(4000); // start server
