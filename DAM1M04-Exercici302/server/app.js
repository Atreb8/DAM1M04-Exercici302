

const express = require('express');
const hbs = require('hbs');
const path = require('path');
const pool = require('./db'); // IMPORTANTE: conecta con MySQL

const app = express();
const port = 3000;

// Test de conexión
async function testDB() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS resultado');
    console.log('Conexión MySQL OK:', rows[0].resultado);
  } catch (err) {
    console.error('Error al conectar a MySQL:', err);
  }
}

testDB();

// Configuración básica de Express y Handlebars
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Helper para separar los actores por coma y mostrarlos en lista
hbs.registerHelper('split', (text, separator) => {
  if (!text) return [];
  return text.split(separator);
});

app.use(express.static(path.join(__dirname, '../public')));



app.get('/', async (req, res) => {
  try {
    const [moviesRows] = await pool.query(`
      SELECT 
        f.film_id,
        f.title,
        f.release_year,
        GROUP_CONCAT(CONCAT(a.first_name, ' ', a.last_name) SEPARATOR ', ') AS actors
      FROM film f
      LEFT JOIN film_actor fa ON f.film_id = fa.film_id
      LEFT JOIN actor a ON fa.actor_id = a.actor_id
      GROUP BY f.film_id, f.title, f.release_year
      LIMIT 5;
    `);

    const [categoriesRows] = await pool.query(`
      SELECT category_id, name
      FROM category
      LIMIT 5;
    `);

    res.render('index', {
      movies: moviesRows,
      categories: categoriesRows
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error cargando index');
  }
});


app.get('/movies', async (req, res) => {
  try {
    console.log("Entrando en /movies");

    const [moviesRows] = await pool.query(`
      SELECT 
        f.film_id,
        f.title,
        f.release_year,
        GROUP_CONCAT(CONCAT(a.first_name, ' ', a.last_name) SEPARATOR ', ') AS actors
      FROM film f
      LEFT JOIN film_actor fa ON f.film_id = fa.film_id
      LEFT JOIN actor a ON fa.actor_id = a.actor_id
      GROUP BY f.film_id, f.title, f.release_year
      LIMIT 15;
    `);

    console.log("Películas:", moviesRows.length);
    console.log(moviesRows[0]); // 👈 MUY útil

    res.render('movies', {
      movies: moviesRows
    });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).send("Error movies");
  }
});


app.get('/customers', async (req, res) => {
  try {
    // Obtener los primeros 25 clientes
    const [customersRows] = await pool.query(`
      SELECT customer_id, first_name, last_name, email
      FROM customer
      ORDER BY customer_id
      LIMIT 25
    `);

    // Para cada cliente, traer sus primeros 5 alquileres
    const customersWithRentals = await Promise.all(
      customersRows.map(async (customer) => {
        const [rentalsRows] = await pool.query(`
          SELECT f.title, r.rental_date
          FROM rental r
          JOIN inventory i ON r.inventory_id = i.inventory_id
          JOIN film f ON i.film_id = f.film_id
          WHERE r.customer_id = ?
          ORDER BY r.rental_date
          LIMIT 5
        `, [customer.customer_id]);

        return {
          ...customer,
          rentals: rentalsRows
        };
      })
    );

    res.render('customers', { customers: customersWithRentals });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error cargando clientes');
  }
});





app.listen(port, () => {
  console.log(`Servidor en http://localhost:${port}`);
});
