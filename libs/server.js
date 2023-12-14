import express, { json } from "express";
import { pool, createEurUsdTable } from "./database.js";

const port = process.env.HTTP_PORT;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("views", "./views");
app.set("view engine", "ejs");

createEurUsdTable().catch((error) => {
    console.error("Ошибка при создании таблицы eur_usd:", error);
});
app.get("/rates", async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const resultUsdRub = await client.query(
                "SELECT value FROM usd_rub ORDER BY timestamp DESC LIMIT 1"
            );
            const resultEurUsd = await client.query(
                "SELECT value FROM eur_usd ORDER BY timestamp DESC LIMIT 1"
            );
            // приходит строка преобразуем в число
            const eurUsdRate = Number(resultEurUsd.rows[0]?.value) || null;
            const usdRubRate = Number(resultUsdRub.rows[0]?.value) || null;
            // нужно уточнить округлять значение или просто обрезать до 2 знаков после запятой
            // можно использовать toFixed slice
            const eurRubRate = Math.floor(usdRubRate * eurUsdRate * 100) / 100;
            // отрисовка страницы
            res.render("rates", { usdRubRate, eurRubRate });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Ошибка при получении значения из базы данных:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/eurusd", (req, res) => {
    res.render("eurusd");
});

// задаем курс eurusd
app.post("/seteurusd", async (req, res) => {
    const { eurusd } = req.body;

    try {
        const client = await pool.connect();
        try {
            await client.query("INSERT INTO eur_usd (value) VALUES ($1)", [
                eurusd,
            ]);
            console.log(
                `Значение курса EUR/USD (${eurusd}) успешно записано в таблицу eur_usd`
            );
            res.redirect("/rates"); // Перенаправляем на страницу со значениями курсов
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(
            "Ошибка при записи значения курса EUR/USD в базу данных:",
            error
        );
        res.status(500).send("Internal Server Error");
    }
});

app.use((err, req, res, next) => {
    if (err) {
        res.status(500).send(`Ошибка ${err.message}`);
    } else {
        next(err);
    }
});
const httpServer = app.listen(port, () => {
    console.log(`HTTP сервер запущен на порту: ${httpServer.address().port}`);
});
