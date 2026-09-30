# Task Tracker backend, Kodutöö #3: Node Fundamentals

Node.js + Express backend Task Trackerile. Hõlmab kõiki 15 teemat. Iga teema selgitus,
levinud viga ja seos projektiga on failis **[TEEMAD.md](TEEMAD.md)**.

## Nõuded
- Node.js **20.12+** (kontrolli: `node -v`, `npm -v`)

## Paigaldamine ja käivitamine
```bash
git clone <see-repo>
cd task-tracker-backend
npm ci                 # paigaldab täpselt package-lock.json versioonid
cp .env.example .env   # valikuline
npm start              # http://localhost:3000
```

| Käsk | Mida teeb |
|---|---|
| `npm start` | käivitab serveri (`src/server.js`) |
| `npm run dev` | käivitab serveri ja taaskäivitab failimuutuse korral |
| `npm run hello` | teema 1: `node index.js`, prindib tervituse ja ülesanded |
| `npm test` | käivitab kõik testid (Vitest + Supertest), serverit ei pea käivitama |

## Seaded (keskkonnamuutujad)
| Muutuja | Vaikimisi | Tähendus |
|---|---|---|
| `PORT` | `3000` | port, millel server kuulab |
| `TASKS_FILE` | `./data/tasks.json` | JSON-fail, kuhu ülesanded salvestatakse ja kust need laetakse |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | React (Vite) frontendi aadress, mis on CORS-iga lubatud |

Näide: `PORT=4000 TASKS_FILE=./data/other.json npm start`.
Väärtused võib panna ka `.env` faili (näide failis `.env.example`). `.env` on `.gitignore`-s, nii et saladused Giti ei lähe.

## API
| Meetod | URL | Edu | Vead |
|---|---|---|---|
| GET | `/api/health` | 200 `{ "status": "ok" }` | |
| GET | `/api/tasks` | 200 massiiv | |
| GET | `/api/tasks?completed=true\|false` | 200 filtreeritud massiiv | 400 vale väärtus |
| GET | `/api/tasks/:id` | 200 task | 400 vigane id, 404 |
| POST | `/api/tasks` `{ "title": "..." }` | 201 loodud task | 400 |
| PATCH | `/api/tasks/:id` `{ "title"?, "completed"? }` | 200 uuendatud task | 400, 404 |
| DELETE | `/api/tasks/:id` | 204 (tühi keha) | 400, 404 |

Vead on alati kujul `{ "error": "Task not found" }`. Tundmatu route annab 404 JSON-i ja ootamatu viga 500 `{ "error": "Internal server error" }` ilma stack trace'ita. Rikutud andmefaili korral server ei käivitu ja näitab selget veateadet, faili üle ei kirjutata.

Proovimine terminalist:
```bash
curl -i http://localhost:3000/api/tasks/2
curl -i -X POST http://localhost:3000/api/tasks -H "Content-Type: application/json" -d '{"title":"Learn Express"}'
curl -i -X PATCH http://localhost:3000/api/tasks/1 -H "Content-Type: application/json" -d '{"completed":true}'
curl -i -X DELETE http://localhost:3000/api/tasks/1
```

## Struktuur
```
index.js                 teema 1: JS terminalis
src/data.js              näidisandmed
src/tasks.js             teema 3: puhtad funktsioonid (named exports)
src/app.js               teemad 5-9: Express app (eksporditud, ilma listen'ita)
src/server.js            käivitus: loadTasks + app.listen
src/config.js            teema 13: PORT, TASKS_FILE
src/storage.js           teemad 12, 14: loadTasks / saveTasks
src/errors.js            HttpError (400/404 vs 500)
tests/                   teemad 3, 11, 14, 15
frontend/src/services/taskApi.js   teema 10: kõik fetch-päringud
frontend/src/App.jsx               teema 10: React näide
```

## Frontendi ühendamine (teema 10)
1. Kopeeri `frontend/src/services/taskApi.js` oma Vite/Reacti projekti.
2. Lisa frontendi `.env` faili `VITE_API_URL=http://localhost:3000`.
3. Asenda lokaalse JSON-i laadimine `getTasks()` kutsega ja uue ülesande lisamine `createTask(title)` kutsega (vt `frontend/src/App.jsx`).
4. Käivita backend (`npm start`) ja frontend (`npm run dev`) **kahes eraldi terminalis**.
