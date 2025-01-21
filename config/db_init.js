const fs = require('fs').promises;
const sql = require("mssql");

/** @type {sql.ConnectionPool} */
var pool;

const sqlConfig = {
    user: 'sa',
    password: 'yourStrong(!)Password',
    server: 'localhost',
    database: 'Milestone2DB_24',
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

(async () => {
    try {
        console.log("Connecting to MSSQL Database");
        pool = await sql.connect(sqlConfig);
        console.log("Connection to MSSQL Database successfully established");

        const fileContent = await fs.readFile('./schema/db.sql', 'utf8');
        const queryBatches = fileContent.split(/^\s*go\s*$/im);

        for (const queryBatch of queryBatches) {
            const trimmedQuery = queryBatch.trim();
            if (trimmedQuery) {
                try {
                    console.log("Executing Query Batch:");
                    console.log(trimmedQuery);
                    const result = await pool.request().query(trimmedQuery);
                    console.log("Query Result:", result);
                } catch (err) {
                    console.error("Error executing query batch:", err);
                }
            }
        }
    } catch (err) {
        console.error("Error connecting to the database or processing queries:", err);
    } finally {
        sql.close(); // Ensure the connection is closed
    }
})();

module.exports = pool