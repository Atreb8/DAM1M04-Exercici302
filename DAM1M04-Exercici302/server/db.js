const mysql = require('mysql2/promise');

// Crear la conexión con la base de datos
const pool = mysql.createPool({
  host: 'localhost',     // el servidor MySQL (en tu caso es tu Mac)
  user: 'nodeuser',      // el usuario que creaste
  password: 'node123',   // la contraseña que pusiste
  database: 'sakila',    // la base de datos que cargaste
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
