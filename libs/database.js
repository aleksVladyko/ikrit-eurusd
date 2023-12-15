import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER, // установите ваши значения
    host: process.env.DB_HOST, // установите ваши значения
    database: process.env.DB_DATABASE, // установите ваши значения
    password: process.env.DB_PASSWORD, // установите ваши значения
    port: process.env.DB_PORT, // установите ваши значения
});

const createTable = async () => {
    try {
        const client = await pool.connect();
        try {
            await client.query(`
        CREATE TABLE IF NOT EXISTS usd_rub (
          id SERIAL PRIMARY KEY,
          value NUMERIC(10, 2) NOT NULL,
          timestamp TIMESTAMPTZ DEFAULT NOW()
        )
      `);
            console.log("Таблица usd_rub готова к записи данных");
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Ошибка при создании таблицы:", error);
    }
};
const createEurUsdTable = async () => {
    try {
        const client = await pool.connect();
        try {
            await client.query(`
          CREATE TABLE IF NOT EXISTS eur_usd (
            id SERIAL PRIMARY KEY,
            value NUMERIC(10, 5) NOT NULL,
            timestamp TIMESTAMPTZ DEFAULT NOW()
          )
        `);
            console.log("Таблица eur_usd готова к записи данных");
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Ошибка при создании таблицы eur_usd:", error);
    }
};

export { pool, createTable, createEurUsdTable };
