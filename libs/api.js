import { createServer } from "http";
import { parse } from "url";
import "dotenv/config";
import { promisify } from "util";
import { createTable, pool } from "./database.js";

const apiPort = process.env.API_PORT || 3000;

// добавляем запись
const setUsdRubHandler = async (req, res) => {
    try {
        const data = await new Promise((resolve, reject) => {
            const chunks = [];
            req.on("data", (chunk) => chunks.push(chunk));
            req.on("end", () => resolve(Buffer.concat(chunks).toString()));
            req.on("error", reject);
        });

        const usdrub = JSON.parse(data);

        const client = await pool.connect();
        try {
            const response = await client.query(
                "INSERT INTO usd_rub (value) VALUES ($1) RETURNING *",
                [usdrub.value]
            );
            console.log(
                `Значение курса USD/RUB (${usdrub.value}) успешно записано в таблицу usd_rub`
            );
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(response.rows[0]));
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Ошибка при записи в базу данных:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Ошибка при записи в базу данных" }));
    }
};
// получаем последние данные
const getUsdRubHandler = async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const response = await client.query(
                "SELECT value FROM usd_rub ORDER BY timestamp DESC LIMIT 1"
            );

            if (response.rows.length > 0) {
                const latestRate = response.rows[0];
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(latestRate));
            } else {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(
                    JSON.stringify({ error: "Нет данных о курсе USD/RUB" })
                );
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Ошибка при чтении из базы данных:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Ошибка при чтении из базы данных" }));
    }
};

const apiServer = createServer(async (req, res) => {
    const { pathname, query } = parse(req.url, true);

    if (req.method === "POST" && pathname === "/setusdrub") {
        await setUsdRubHandler(req, res);
    } else if (req.method === "GET" && pathname === "/getusdrub") {
        await getUsdRubHandler(req, res);
    } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Страница не найдена" }));
    }
});

const startApiServer = () => {
    return new Promise((resolve, reject) => {
        apiServer.listen(apiPort, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
};
Promise.all([
    startApiServer()
        .then(() => {
            console.log(`API сервер запущен на порту: ${apiServer.address().port}`);
        })
        .catch((error) => {
            console.error("Ошибка при запуске сервера:", error);
        }),
    createTable()
        .catch((error) => {
            console.error("Ошибка при создании таблицы:", error);
        }),
])
    .catch((error) => {
        console.error("Ошибка при выполнении операций:", error);
    });
// для  записи данных воспользуйтесь postman и отправьте POST запрос на
// http://<ваш host>/setusdrub в формате JSON { "value": <number>}
// или используйте curl -X POST -H "Content-Type: application/json" -d
// '{"value":"1000"}' http://<ваш host>/setusdrub
// или любым другим способом ))
// получить данные например так )) curl -X GET http://localhost:{apiPort}/getusdrub
