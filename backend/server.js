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
  "No food recipes found",
  "You can create your own custom recipe"
]);

});

app.delete("/pantry/:id", async (req,res)=>{

  const id = req.params.id;

  try {

    const item = await pool.query(
      "SELECT name FROM pantry_items WHERE id=$1",
      [id]
    );

    const name = item.rows[0].name;

    await pool.query(
      "DELETE FROM pantry_items WHERE id=$1",
      [id]
    );

    await pool.query(
      "DELETE FROM custom_recipes WHERE item=$1",
      [name]
    );

    res.json({ success:true });

  } catch(err){

    console.error(err);
    res.status(500).json({ error:"Delete failed" });

  }

});
app.post("/recipes/custom", async (req, res) => {

  const { item, recipe } = req.body;

  try {

    await pool.query(
      "INSERT INTO custom_recipes(item, recipe) VALUES($1,$2)",
      [item, recipe]
    );

    res.json({ success:true });

  } catch(err) {

    console.error(err);
    res.status(500).json({ error:"Failed to save recipe" });

  }

});

app.get("/recipes/custom/:item", async (req, res) => {

  const item = req.params.item;

  try {

    const result = await pool.query(
      "SELECT recipe FROM custom_recipes WHERE item=$1",
      [item]
    );

    const recipes = result.rows.map(r => r.recipe);

    res.json(recipes);

  } catch(err) {

    console.error(err);
    res.status(500).json({ error:"Failed to load recipes" });

  }

});

app.delete("/recipes/custom/:item/:recipe", async (req, res) => {

  const item = req.params.item;
  const recipe = req.params.recipe;

  try {

    await pool.query(
      "DELETE FROM custom_recipes WHERE item=$1 AND recipe=$2",
      [item, recipe]
    );

    res.json({ success:true });

  } catch(err){

    console.error(err);
    res.status(500).json({ error:"Failed to delete recipe" });

  }

});

app.get("/recipes/pantry", async (req,res)=>{

  try{

    const items = await pool.query(
      "SELECT name FROM pantry_items"
    );

    const names = items.rows.map(r=>r.name.toLowerCase());

    let suggestions=[];

    if(names.includes("egg"))
      suggestions.push("Omelette");

    if(names.includes("egg") && names.includes("bread"))
      suggestions.push("Egg sandwich");

    if(names.includes("tomato") && names.includes("onion"))
      suggestions.push("Fresh salsa");

    if(names.includes("chicken"))
      suggestions.push("Grilled chicken bowl");

    if(names.includes("rice") && names.includes("egg"))
      suggestions.push("Egg fried rice");

    if(suggestions.length===0)
      suggestions.push("Simple healthy bowl");

    res.json(suggestions);

  }catch(err){

    console.error(err);
    res.status(500).json({error:"Failed to generate recipes"});

  }

});

