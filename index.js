const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 8080;
const dbFilePath = "ylts.db"; // Adjust the file path as needed

// Use body-parser middleware
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Check if the database file already exists
const isDatabaseExist = fs.existsSync(dbFilePath);

// Initialize SQLite database
const db = new sqlite3.Database(dbFilePath);

// Create a table for churches if it doesn't exist
db.serialize(() => {
  //db.run('drop table if exists churches');

  db.run(`
    CREATE TABLE IF NOT EXISTS churches (
      id INTEGER PRIMARY KEY,
      name TEXT,
      zone TEXT,
      reg_code TEXT DEFAULT '',
      phone TEXT
    )
  `);

  // Insert initial data only if the database is newly created
  if (!isDatabaseExist) {
    const insert = db.prepare(
      "INSERT INTO churches (name, zone) VALUES (?, ?)",
    );
    insert.run("Sudipen", "Zone 1");
    insert.run("Bangar", "Zone 1");
    insert.run("Balaoan 1", "Zone 1");
    insert.run("Balaoan 2", "Zone 1");
    insert.run("Santol", "Zone 1");
    insert.run("San Juan", "Zone 1");
    insert.run("San Fernando", "Zone 1");
    insert.run("Bacnotan", "Zone 1");
    insert.run("Bauang", "Zone 1");
    insert.run("Naguilian", "Zone 1");
    insert.run("Caba", "Zone 1");
    insert.run("Aringay", "Zone 1");
    insert.run("Agoo East", "Zone 1");
    insert.run("Agoo West", "Zone 1");
    insert.run("Tubao 1", "Zone 1");
    insert.run("Tubao 2", "Zone 1");
    insert.run("Rosario", "Zone 1");
    insert.run("Sto. Tomas", "Zone 1");

    insert.run("Calvary Tabernacle", "Zone 2");
    insert.run("Kias", "Zone 2");
    insert.run("Km. 5, La Trinidad", "Zone 2");
    insert.run("Cruz, La Trinidad", "Zone 2");
    insert.run("Taba-o, Kapangan", "Zone 2");
    insert.run("Sagubo, Kapangan", "Zone 2");

    insert.run("Buguias", "Zone 3");
    insert.run("Lepanto, Mankayan", "Zone 3");
    insert.run("Suyoc, Mankayan", "Zone 3");
    insert.run("Masala", "Zone 3");
    insert.run("Bontoc", "Zone 3");
    insert.finalize();
  }
});

// Create a table for delegates
db.run(`
  CREATE TABLE IF NOT EXISTS delegates (
    id INTEGER PRIMARY KEY,
    name TEXT,
    age INTEGER,
    gender TEXT,
    baptized BOOLEAN,
    church_id INTEGER,
    date_registered DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (church_id) REFERENCES churches(id)
  )
`);

// Create a table for youth presidents
db.run(`
  CREATE TABLE IF NOT EXISTS yp (
    id INTEGER PRIMARY KEY,
    name TEXT,
    church_id INTEGER,
    FOREIGN KEY(church_id) REFERENCES churches(id)
  )
`);

// Create a table for groups
db.run(`
  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY,
    number INTEGER,
    delegate_id INTEGER REFERENCES delegates(id)
  )
`);

// Create a table for events
db.run(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    church_id INTEGER,
    name TEXT,
    FOREIGN KEY(church_id) REFERENCES churches(id)
  )
`);

// db.all('SELECT * FROM delegates', [], (err, rows) => {
//     console.log(rows);
// });

// db.all(`SELECT * FROM churches where reg_code IS NOT ''`, [], (err, rows) => {
//     console.log(rows);
// });

const sql = `
        SELECT delegates.*, churches.name AS church_name, churches.phone
        FROM delegates
        LEFT JOIN churches ON delegates.church_id = churches.id
        WHERE churches.reg_code = ?
    `;
// db.all(sql, ['skjo'], (err,rows) =>{
//   console.log(rows);
// });

// db.all('SELECT * FROM yp', [], (err, rows) => {
//     console.log(rows);
// });

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Define routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// API endpoint to get churches based on the selected zone
app.get("/api/churches/:zone", (req, res) => {
  const zone = req.params.zone;

  db.all(
    "SELECT id, name FROM churches WHERE zone = ? ORDER by name",
    [zone],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      res.json(rows);
    },
  );
});

// Endpoint for form submission
app.post("/register", (req, res) => {
  // Extract data from the request
  const { delegates, events, contactNumber, churchId, presidentName } =
    req.body;
  let regCode = generateCode(4);

  db.serialize(() => {
    // Insert data into the 'delegates' table
    const delegateInsertStmt = db.prepare(`
          INSERT INTO delegates (name, age, gender, baptized, church_id) 
          VALUES (?, ?, ?, ?, ?)
        `);

    delegates.forEach((delegate) => {
      delegateInsertStmt.run(
        uCFirst(delegate.name),
        delegate.age,
        uCFirst(delegate.gender),
        delegate.baptized,
        churchId,
      );
    });

    delegateInsertStmt.finalize();

    //insert YP
    db.run(
      "INSERT INTO yp(name, church_id) VALUES(?, ?)",
      [presidentName, churchId],
      function (err) {
        if (err) {
          console.log(err.message);
          return res
            .status(500)
            .json({ error: "Error saving youth president" });
        }
      },
    );
    //update church
    db.run(
      "UPDATE churches SET reg_code = ?, phone = ? WHERE id = ?",
      [regCode, contactNumber, churchId],
      function (err) {
        if (err) {
          console.log(err.message);
          return res.status(500).json({ error: "Error updating church info" });
        }
      },
    );
  });

  res.json({
    success: true,
    message: "Form submitted successfully",
    regCode: regCode,
  });
});

function generateCode(length) {
  let code = "";

  for (let i = 0; i < length; i++) {
    // Generate a random uppercase letter (ASCII codes for A to Z are 65 to 90)
    const randomCharCode = Math.floor(Math.random() * 26) + 65;
    const randomLetter = String.fromCharCode(randomCharCode);

    code += randomLetter;
  }

  return code;
}

function uCFirst(inputString) {
  // Split the string into an array of words
  const words = inputString.split(" ");

  // Capitalize the first letter of each word
  const capitalizedWords = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1),
  );

  // Join the words back into a string
  const resultString = capitalizedWords.join(" ");

  return resultString;
}

app.get("/registered", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "registered.html"));
});

const scriptPath = "exported_script.sql";

app.get("/dwnld", (req, res) => {
  const db = new sqlite3.Database(dbFilePath);

  db.serialize(() => {
    const outputStream = fs.createWriteStream(scriptPath);

    // Begin a transaction
    db.exec("BEGIN TRANSACTION;", () => {
      // Get schema and data for all tables
      db.each(
        "SELECT name FROM sqlite_master WHERE type='table';",
        (err, table) => {
          if (err) {
            console.error("Error fetching table names:", err.message);
            res.status(500).send("Internal Server Error");
            return;
          }

          const tableName = table.name;

          // Get table schema
          db.all(`PRAGMA table_info(${tableName});`, (err, columns) => {
            if (err) {
              console.error(
                `Error fetching schema for table ${tableName}:`,
                err.message,
              );
              res.status(500).send("Internal Server Error");
              return;
            }

            // Write table creation script
            outputStream.write(`\n-- Table: ${tableName}\n`);
            outputStream.write(`CREATE TABLE IF NOT EXISTS ${tableName} (\n`);
            columns.forEach((column, index) => {
              outputStream.write(
                `  ${column.name} ${column.type}${
                  index < columns.length - 1 ? "," : ""
                }\n`,
              );
            });
            outputStream.write(");\n");

            // Get table data
            db.each(`SELECT * FROM ${tableName};`, (err, row) => {
              if (err) {
                console.error(
                  `Error fetching data for table ${tableName}:`,
                  err.message,
                );
                res.status(500).send("Internal Server Error");
                return;
              }

              // Write INSERT statement for each row
              const columnNames = Object.keys(row).join(", ");
              const values = Object.values(row)
                .map((value) =>
                  typeof value === "string" ? `'${value}'` : value,
                )
                .join(", ");

              outputStream.write(
                `INSERT INTO ${tableName} (${columnNames}) VALUES (${values});\n`,
              );
            });
          });
        },
      );

      // Commit the transaction
      db.exec("COMMIT;", (err) => {
        if (err) {
          console.error("Error committing transaction:", err.message);
          res.status(500).send("Internal Server Error");
        }

        // End the response when all tables have been processed
        outputStream.end(() => {
          res.download(scriptPath, "ylts.sql", (err) => {
            if (err) {
              console.error("Error sending the file:", err.message);
              res.status(500).send("Internal Server Error");
            }

            // Close the database connection
            db.close();
          });
        });
      });
    });
  });
});

app.get("/search", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "search.html"));
});

// Route for searching delegates
app.post("/search-delegates", (req, res) => {
  const query = req.body.query.toUpperCase();

  // SQLite query with left join to fetch delegate and church information
  const sql = `
        SELECT delegates.*, churches.name AS church_name, churches.phone
        FROM delegates
        LEFT JOIN churches ON delegates.church_id = churches.id
        WHERE churches.reg_code = ?
    `;

  // Execute the query with the provided search query
  db.all(sql, [query], (err, rows) => {
    if (err) {
      console.error("Error fetching delegates:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    res.json(rows);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}/`);
});
