const mysql = require("mysql2/promise");
const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: parseInt(process.env.MYSQL_PORT || "3306", 10),
  user: process.env.MYSQL_USER || "nollet",
  password: process.env.MYSQL_PASSWORD || "nolletpass",
  database: process.env.MYSQL_DATABASE || "nollet",
  connectionLimit: 10,
  charset: "utf8mb4",
});
module.exports = { mysqlPool };
