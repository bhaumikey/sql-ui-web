import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let connection = null;

app.post('/connect', async (req, res) => {
  try {
    // const { host, user, password, database } = req.body;
    
    // Close existing connection if any
    if (connection) {
      await connection.end();
    }

    // Create a new connection
    const db = mysql.createConnection({
      host: 'sql3.freesqldatabase.com',
      user: 'sql3772356',
      password: 'dCH5ySIgYS', // replace with actual password once it's available
      database: 'sql3772356'
    });

    await connection.connect();
    res.json({ message: 'Connected successfully' });
  } catch (error) {
    console.error('Connection error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/disconnect', async (req, res) => {
  try {
    if (connection) {
      await connection.end();
      connection = null;
    }
    res.json({ message: 'Disconnected successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/tables', async (req, res) => {
  try {
    if (!connection) {
      return res.status(400).json({ error: 'Not connected to database' });
    }

    // Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    const tableData = await Promise.all(
      tables.map(async (table) => {
        const tableName = table[`Tables_in_${connection.config.database}`];
        // Get table schema
        const [columns] = await connection.query(`DESCRIBE ${tableName}`);
        return {
          name: tableName,
          schema: columns.map(col => ({
            column: col.Field,
            type: col.Type,
            nullable: col.Null === 'YES',
            key: col.Key
          }))
        };
      })
    );

    res.json(tableData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send(`Bhaumikey suuueee!`);
});


app.post('/execute', async (req, res) => {
  try {
    if (!connection) {
      return res.status(400).json({ error: 'Not connected to database' });
    }

    const { queries } = req.body;
    const results = await Promise.all(
      queries.map(async (query) => {
        try {
          const [rows, fields] = await connection.query(query);
          return {
            query,
            columns: fields ? fields.map(field => field.name) : [],
            rows: rows
          };
        } catch (error) {
          return {
            query,
            error: error.message
          };
        }
      })
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;