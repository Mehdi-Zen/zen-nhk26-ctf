const { Pool } = require("pg");

const pgPool = new Pool({
  host:     process.env.PG_HOST     || "127.0.0.1",
  port:     parseInt(process.env.PG_PORT || "5432", 10),
  user:     process.env.PG_USER     || "nollet_api",
  password: process.env.PG_PASSWORD || "nollet_api_pass",
  database: process.env.PG_DATABASE || "nollet_api",
  max: 10,
});

module.exports = { pgPool };
