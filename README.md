# тестовое задание

## запуск проекта

установить postgresql если не установлена
| npm start |

## установите переменные окружения

в файле .env

### DB_USER=

### DB_HOST=

### DB_DATABASE=

### DB_PASSWORD=

### DB_PORT=

|добавьте значения в таблицы usd_rub, eur_usd|
Приложение доступно по адресу http://localhost:${port}/rates
Установка значений eur_usd http://localhost:${port}/eurusd
для записи данных в таблицу usd_rub воспользуйтесь postman и отправьте POST запрос на http://<ваш host>/setusdrub в формате JSON { "value": <number>}
или используйте curl -X POST -H "Content-Type: application/json" -d
'{"value":"1000"}' http://<ваш host>/setusdrub
получить последнюю запись http://<ваш host>/getusdrub
