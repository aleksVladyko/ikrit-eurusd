import cluster from "cluster";
import { fork } from "child_process";
import fs from "fs";
import path from "path";

// Проверяем, является ли текущий процесс главным
if (cluster.isPrimary) {
    try {
        // Чтение конфигурационного файла
        const configPath = path.resolve(
            new URL("./config.json", import.meta.url).pathname
        );
        const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));

        // Создание дочернего процесса для API
        const apiProcess = fork(
            path.resolve(new URL("../libs/api.js", import.meta.url).pathname),
            [],
            {
                env: { ...process.env, API_PORT: configData.apiPort },
            }
        );

        // Создание дочернего процесса для HTTP-сервера
        const httpProcess = fork(
            path.resolve(
                new URL("../libs/server.js", import.meta.url).pathname
            ),
            [],
            {
                env: { ...process.env, HTTP_PORT: configData.httpPort },
            }
        );

        console.log("Главный процесс создал два дочерних процесса.");

        // Обработка события завершения дочерних процессов
        cluster.on("exit", (worker, code, signal) => {
            console.log(
                `Дочерний процесс ${worker.process.pid} завершен с кодом ${code} и сигналом ${signal}.`
            );
        });
    } catch (error) {
        console.error("Ошибка:", error);
    }
}
