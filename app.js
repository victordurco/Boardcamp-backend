import express from "express";
import cors from "cors";

const app = express(); // create server
app.use(express.json());
app.use(cors());

app.listen(4000); // start server
