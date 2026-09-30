# Teemad 1-15: selgitus, levinud viga ja seos projektiga

Iga teema juures on lihtne selgitus, kood (viide failile), käivitamine, üks levinud viga koos parandusega ja seos Task Trackeri backendiga.

---

## 1. Mis on Node.js, JavaScript väljaspool brauserit
**Selgitus.** Node.js on JavaScripti *runtime*: V8 mootor ja lisa-API-d (failid, võrk, protsess), mis lasevad JS-i käivitada terminalis. Brauser annab JS-ile `document`, `window` ja DOM-i, sest seal on leht. Node'is lehte pole, seega pole ka `document`i, aga on näiteks `process` ja `fs`. Faili käivitamine (`node index.js`) lihtsalt täidab koodi ja lõpetab. Veebiserver tekib alles siis, kui kood ise porti kuulama hakkab (`app.listen`).
**Kood:** `index.js`. **Käivita:** `node -v`, `npm -v`, `node index.js`.
**Viga:** `document.getElementById(...)` Node'is annab `ReferenceError: document is not defined`. **Parandus:** väljund käib `console.log`-iga, DOM on ainult frontendis.
**Seos:** backend jookseb Node'is ilma brauserita.

## 2. npm, package.json ja skriptid
**Selgitus.** `npm init -y` loob `package.json`i (nimi, skriptid, sõltuvused). `dependencies` on vajalikud rakenduse jooksmiseks (express, cors), `devDependencies` ainult arenduseks (vitest, supertest). `package-lock.json` lukustab täpsed versioonid, `node_modules` sisaldab paigaldatud pakette. `npm install` paigaldab ja võib lockfile'i uuendada. `npm ci` paigaldab täpselt lockfile'i järgi, alustab puhtalt ja on mõeldud CI-le ning teistele arendajatele. Skriptid (`"start": "node src/server.js"`) käivitatakse käsuga `npm start` / `npm run <nimi>`.
**Viga:** `node_modules` lükatakse Giti (tuhanded failid). **Parandus:** see peab olema `.gitignore`-s, teine arendaja teeb `npm ci`.
**Seos:** `npm start` / `npm test`, README juhised.

## 3. Moodulid ja taaskasutatavad funktsioonid
**Selgitus.** `"type": "module"` lülitab sisse ES moodulid (`import`/`export`). Named export: `export function getTaskById…`, import: `import { getTaskById } from "./tasks.js"`. Suhtelises teekonnas peab Node'is olema **`.js` laiend**. Andmed (`data.js`), loogika (`tasks.js`) ja käivitus (`server.js`) on lahus. Funktsioonid **tagastavad** väärtuse, mitte ei logi seda, nii et neid saab testida ja route'ides kasutada. Need ei muuda sisendit (tagastavad koopiad).
**Kood:** `src/tasks.js`, testid `tests/tasks.test.js`.
**Viga:** `import { getAllTasks } from "./tasks"` (laiend puudu) annab `ERR_MODULE_NOT_FOUND`. **Parandus:** `"./tasks.js"`.
**Seos:** route'id kasutavad neid funktsioone (`app.js`).

## 4. HTTP, API-d ja JSON
**Selgitus.** Klient (brauser/React) saadab **päringu**, server saadab **vastuse**. Päringul on meetod, URL (path + query string, nt `?completed=true`), päised (nt `Content-Type`) ja vajadusel keha. Meetodid: GET loeb, POST loob, PATCH muudab osaliselt, DELETE kustutab. Staatused: 200 OK, 201 Created, 204 No Content, 400 vigane päring, 404 ei leitud, 500 serveri viga. JS objekt on mälus olev väärtus, JSON on **tekst**, mis liigub võrgus (`JSON.stringify` ja `JSON.parse`).

Näide: `curl -i http://localhost:3000/api/tasks/2`
- **meetod:** `GET`
- **URL:** `http://localhost:3000/api/tasks/2` (path `/api/tasks/2`, `2` on id)
- **staatus:** `200 OK`, `Content-Type: application/json`
- **keha:** `{ "id": 2, "title": "Practise React state", "completed": false }`

**Viga:** vastust kasutatakse otse objektina, kuigi see on string. **Parandus:** `await res.json()` / `JSON.parse`.
**Seos:** kogu API on üles ehitatud nende reeglite järgi.

## 5. Express ja esimene route
**Selgitus.** Puhas Node'i `http` moodul on madala tasemega. Express lisab route'imise (`app.get("/path", …)`), middleware'id ja mugavad abifunktsioonid (`res.json()`, `res.status()`). `req` on sissetulev päring, `res` vastus. `app.listen(port)` hakkab kuulama porti ja `localhost` tähendab sinu enda arvutit. `app` eksporditakse failist `src/app.js` ja `listen` on eraldi failis `src/server.js`, et testid saaksid app'i kasutada serverit käivitamata.
**Kood:** `GET /api/health` → `{ "status": "ok" }`. **Paigaldamine:** `npm install express`. **Käivita:** `npm start`, siis `curl localhost:3000/api/health`.
**Viga:** `EADDRINUSE`, sest port on juba kasutusel (vana server jookseb). **Parandus:** peata vana protsess või kasuta teist `PORT`-i.
**Seos:** health route näitab, et backend töötab.

## 6. GET route'id, route- ja query-parameetrid
**Selgitus.** `req.params` tuleb path'ist (`/api/tasks/:id` → `req.params.id`), `req.query` query stringist (`?completed=true` → `req.query.completed`). Mõlemad on **stringid**. `"false"` on mittetühi string, seega **truthy**: `if (req.query.completed)` oleks tõene ka `"false"` korral. Seetõttu võrreldakse täpselt `=== "true"` / `=== "false"` ja muu väärtus annab 400. Id teisendatakse `Number(...)`-iga. Kehtiv, aga olematu id annab 404.
**Viga:** `tasks.find(t => t.id === req.params.id)` ei leia kunagi midagi (`2 !== "2"`). **Parandus:** `Number(req.params.id)`.
**Seos:** frontend loeb nimekirja ja filtreerib.

## 7. POST, päringu keha ja valideerimine
**Selgitus.** POST loob uue ressursi. `app.use(express.json())` parsib JSON-keha `req.body`-ks, aga ainult siis, kui päises on `Content-Type: application/json`. Backend peab valideerima alati, sest päringu võib saata ka curl või Postman, mööda Reacti valideerimisest. Id genereerib server (`nextId++`), klient seda ei vali. Pealkiri trimmitakse ning puuduv, mitte-string või tühikutest koosnev pealkiri annab 400. Uus ülesanne saab `completed: false` ja vastus on 201.
**Viga:** `express.json()` puudub, seega `req.body` on `undefined` ja tekib crash. **Parandus:** lisa middleware enne route'e.
**Seos:** uue ülesande lisamine frontendist.

## 8. PATCH ja DELETE
**Selgitus.** PATCH muudab ainult saadetud välju (`title` ja/või `completed`). Iga saadetud väli valideeritakse: `completed` peab olema päris boolean ja tühi keha annab 400. Kõigepealt otsitakse id järgi ja kui seda pole, tuleb 404. DELETE eemaldab ülesande ja vastab 204-ga. **204 = No Content**, seega vastusel pole keha (`res.status(204).end()`).
**Viga:** `{ "completed": "true" }` (string) aktsepteeritakse. **Parandus:** `typeof body.completed !== "boolean"` annab 400.
**Seos:** ülesande märkimine tehtuks ja kustutamine.

## 9. Middleware ja ühtne veahaldus
**Selgitus.** Middleware on funktsioon `(req, res, next)`, mis jookseb enne route'i. `next()` annab järje edasi. **Järjekord on oluline:** logija ja `express.json()` on esimesed, 404-käsitleja tuleb pärast kõiki route'e ja veahaldur (4 argumenti: `err, req, res, next`) päris lõpus. Valideerimisvead (`HttpError` 400/404) on oodatud. Ootamatu viga annab 500 üldise sõnumiga ning stack trace läheb ainult serveri logisse, mitte kliendile. Vastus on alati `{ "error": "..." }`.
**Kood:** `src/app.js` (logija, 404, veahaldur), `src/errors.js`. Logi näide: `GET /api/tasks/999 -> 404 (1 ms)`.
**Viga:** 404-middleware on route'ide **ees**, nii et kõik päringud saavad 404. **Parandus:** pane see pärast route'e.
**Seos:** frontend saab alati sama kujuga vea ja näitab `error` sõnumit.

## 10. Reacti ühendamine Node'iga
**Selgitus.** Frontend (Vite, port 5173) ja backend (Express, port 3000) on **eraldi protsessid** ja erinevad *origin*'id (erinev port on juba erinev origin). Seetõttu blokeerib brauser päringud, kui backend ei luba päritolu CORS-iga: `app.use(cors({ origin: FRONTEND_ORIGIN }))`. Backendi URL tuleb Vite muutujast `VITE_API_URL` (`import.meta.env`). Deploy'tud frontend jookseb kasutaja brauseris, kus `localhost` on **kasutaja** arvuti, mitte sinu oma, seega on vaja päris backendi URL-i. Vite paneb `VITE_*` väärtused koodi **build'i ajal**, nii et muutuja muutmine nõuab uut build'i. Kõik `fetch`-päringud on failis `src/services/taskApi.js`.
**Kood:** `frontend/src/services/taskApi.js`, `frontend/src/App.jsx`.
**Viga:** `fetch` POST ilma `Content-Type: application/json` päiseta, mistõttu backendis on `req.body` tühi ja tuleb 400. **Parandus:** päis ja `JSON.stringify(body)`, nagu `taskApi.js`-is.
**Seos:** React kasutab serveri tagastatud ülesannet koos serveri antud id-ga ja näitab vigu kasutajale.

## 11. Automaatsed API testid
**Selgitus.** Integratsioonitest saadab app'ile päris HTTP-päringu ja kontrollib staatust ning keha. Vitest on testiraamistik, Supertest teeb päringuid otse eksporditud `app`-ile ilma `listen`ita. Selleks ongi `app` ja `listen` lahus. `beforeEach` loob **iga testi jaoks uue app'i värskete andmetega**, nii et testid ei sõltu järjekorrast.
**Kood:** `tests/api.test.js`. **Käivita:** `npm test`.
**Viga:** kõik testid jagavad sama andmemassiivi, DELETE test kustutab midagi ja järgmine GET test kukub. **Parandus:** värsked andmed `beforeEach`-is.
**Seos:** muudatusi saab teha julgelt, sest testid näitavad kohe, kui midagi katki läheb.

## 12. Salvestamine JSON-faili
**Selgitus.** Muutujas olevad andmed kaovad serveri taaskäivitusel. `node:fs/promises` (`readFile`, `writeFile`) ning `JSON.stringify` / `JSON.parse` võimaldavad need faili salvestada. Samaaegsed kirjutused võivad üksteist üle kirjutada või jätta poole faili. Seetõttu on kirjutused järjekorras ja kirjutatakse ajutisse faili, mis seejärel ümber nimetatakse (`rename`). Suure rakenduse jaoks on andmebaas parem, sest see tagab tehingud, samaaegsuse ja päringud.
**Kood:** `src/storage.js`, `src/server.js`. **Demo:** `npm start`, POST ülesanne, peata server, `npm start` uuesti, `GET /api/tasks` ja ülesanne on alles.
**Viga:** `writeFile(file, tasks)` ilma `JSON.stringify`-ta kirjutab faili `[object Object]`. **Parandus:** `JSON.stringify(tasks, null, 2)`.
**Seos:** ülesanded säilivad restardil. Testid kasutavad ajutist faili.

## 13. Keskkonnamuutujad ja konfiguratsioon
**Selgitus.** Keskkonnamuutuja on protsessile väljastpoolt antud väärtus, mida Node loeb `process.env`-ist. Väärtused on **alati stringid**, seega teisendatakse `PORT` `Number(...)`-iga. Seadistus on koodist lahus, nii et sama kood jookseb arenduses, testides ja serveris erinevate seadetega. `.env.example` näitab, mis muutujad on olemas (ilma saladusteta, läheb Giti). Päris `.env` on `.gitignore`-s. `.env` laaditakse Node'i sisseehitatud `process.loadEnvFile()`-iga.
**Kood:** `src/config.js`, `.env.example`. **Demo:** `PORT=4000 npm start` ja `TASKS_FILE=./data/test.json npm start`.
**Viga:** `process.env.PORT + 1` annab `"30001"` (stringi liitmine). **Parandus:** `Number(process.env.PORT)`.
**Seos:** sama backend jookseb erinevate seadetega ilma route'e muutmata.

## 14. Puuduvad ja rikutud andmefailid
**Selgitus.** `async/await` + `try/catch` püüab asünkroonsed vead kinni. **Puuduv fail** (`err.code === "ENOENT"`) on normaalne olukord esimesel käivitusel, seega tagastatakse `[]`. **Vigane JSON** on hoopis andmete rikkumine, seega tuleb selge viga. Muud vead (õigused, kaust faili asemel) visatakse edasi, sest vaikne `[]` peidaks probleemi. Rikutud faili **ei tohi automaatselt üle kirjutada**, sest järgmine salvestus kustutaks kasutaja andmed jäädavalt. `loadTasks` ainult loeb ja ei loo ega muuda kunagi faili.
**Kood:** `loadTasks` failis `src/storage.js`, testid `tests/storage.test.js`. **Demo:** kehtiv fail, puuduv fail (annab `[]`) ja `echo '{bad' > bad.json; TASKS_FILE=bad.json npm start`, mis annab selge veateate.
**Viga:** `catch { return []; }` kõigi vigade peale, mistõttu rikutud fail tundub tühjana ja järgmine POST kirjutab kõik üle. **Parandus:** `[]` ainult `ENOENT` korral, muul juhul `throw`.
**Seos:** backend ei kaota andmeid vaikselt.

## 15. Salvestuse testimine ajutise failiga
**Selgitus.** Testid ei tohi puutuda päris `data/tasks.json` faili, sest see rikuks kasutaja andmed ja testid sõltuksid faili sisust. `mkdtemp(os.tmpdir()/...)` loob iga testi jaoks **unikaalse ajutise kausta**. Koristus (`rm(dir, { recursive: true, force: true })`) on `afterEach`-is, mis jookseb **ka siis, kui assertion kukub**. Nii ei jää prügi maha ja test läbib korduvalt.
**Kood:** `tests/storage.test.js`, esimene test (salvestab 2 ülesannet, laeb need, võrdleb ja koristab).
**Viga:** `rm` on testi lõpus pärast `expect`-i, nii et kukkunud test jätab faili maha. **Parandus:** koristus `afterEach`-is (või `try/finally`).
**Seos:** püsivust saab automaatselt kontrollida ilma päris andmeid ohustamata.
