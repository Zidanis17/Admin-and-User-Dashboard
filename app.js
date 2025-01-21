const sql = require("mssql");
const sqlConfig = {
  user: 'sa',
  password: 'yourStrong(!)Password',
  server: '127.0.0.1',
  database: 'Milestone2DB_24',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

(async () => {
  console.log("Connecting to MSSQL Database");
  pool = await sql.connect(sqlConfig);
  console.log("Connection to MSSQL Database successfully established");
})()

// const poolPromise = new sql.ConnectionPool(sqlConfig)
//   .connect()
//   .then(pool => {
//     console.log('Connection pool successfully established!');
//     return pool;
//   })
//   .catch(err => {
//     console.error('Connection pool failed!', err);
//     process.exit(1);
//   });

const express = require("express");
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

const adminA = require("./routes/admin-a");
const adminB = require("./routes/admin-b");
const customerA = require("./routes/customer-a");
const customerB = require("./routes/customer-b");
const customerC = require("./routes/customer-c");

app.use(
  session({
    secret: 'ayhaga', 
    resave: false,             
    saveUninitialized: true,   
    cookie: { secure: false }, 
    cookie: { 
      maxAge: 30 * 60 * 1000, 
    }
  })
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");

app.get("/", async function (req, res, next) {
  res.redirect("/loginCust");
});

app.use("/", adminA);
app.use("/", adminB);
app.use("/", customerA);
app.use("/", customerB);
app.use("/", customerC);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
