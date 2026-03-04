import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";
import { initDb } from "./initDb.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/* health check */

app.get("/", (req,res)=>{
    res.json({message:"Pantry API running"})
})

/* lookup food by barcode */

app.get("/lookup/:barcode", async (req,res)=>{

    const barcode = req.params.barcode

    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`

    const response = await fetch(url)

    const data = await response.json()

    if(data.status !== 1){
        return res.status(404).json({error:"Food not found"})
    }

    const name =
        data.product.product_name ||
        data.product.brands ||
        "Unknown item"

    res.json({
        barcode:barcode,
        name:name
    })

})

/* add item */

app.post("/pantry", async (req,res)=>{

    const {name,barcode} = req.body

    const result = await pool.query(
        "INSERT INTO pantry_items (name,barcode) VALUES ($1,$2) RETURNING *",
        [name,barcode]
    )

    res.json(result.rows[0])

})

/* get pantry */

app.get("/pantry", async(req,res)=>{

    const result = await pool.query(
        "SELECT * FROM pantry_items ORDER BY created_at DESC"
    )

    res.json(result.rows)

})

/* recipes */

app.get("/recipes", async(req,res)=>{

    const ingredient = req.query.ingredient

    const url =
    `https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`

    const response = await fetch(url)

    const data = await response.json()

    const recipes =
    (data.meals || []).slice(0,3)

    res.json(recipes)

})

const PORT = process.env.PORT || 3000

initDb().then(()=>{

    app.listen(PORT,()=>{
        console.log("Server running on port",PORT)
    })


})

app.delete("/pantry", async (req, res) => {

  try {

    await pool.query("DELETE FROM pantry_items");

    res.json({
      success: true,
      message: "Pantry cleared"
    });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Failed to clear pantry" });

  }

});

app.get("/recipes/:ingredient", async (req, res) => {

  const ingredient = req.params.ingredient.toLowerCase();

  const recipes = {
    "egg": ["Omelette", "Scrambled Eggs", "Egg Fried Rice"],
    "banana": ["Banana Smoothie", "Banana Pancakes", "Banana Bread"],
    "milk": ["Milkshake", "Hot Chocolate", "Pancakes"],
    "water": ["Lemon Water", "Cucumber Detox Water", "Fruit Infused Water"],
    "bread": ["French Toast", "Sandwich", "Garlic Bread"]
  };

  for (let key in recipes) {
    if (ingredient.includes(key)) {
      return res.json(recipes[key]);
    }
  }

  res.json([
    "Simple Salad",
    "Healthy Bowl",
    "Custom Recipe Idea"
  ]);

});
