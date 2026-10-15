# Würfelmeister Online

Ein unkompliziertes Online-Würfelspiel im Kniffel-Stil. Private Räume mit Raumcode, 2–6 Spieler, Echtzeit-Synchronisierung per Socket.IO.

## Lokal starten

Benötigt Node.js 18 oder neuer.

```bash
npm install
npm start
```

Dann `http://localhost:3000` öffnen. Für einen Test mit mehreren Spielern können mehrere Browserfenster geöffnet werden.

## Einfach online veröffentlichen (Render)

1. Erstelle ein GitHub-Konto, falls du noch keines hast.
2. Lege ein neues Repository namens `wuerfelmeister-online` an.
3. Lade `package.json`, `server.js`, `README.md` und den Ordner `public` in das Repository hoch.
4. Melde dich bei [Render](https://render.com/) an und wähle **New + → Web Service**.
5. Verbinde dein GitHub-Repository.
6. Stelle ein:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free, falls für dein Konto verfügbar
7. Klicke auf **Deploy Web Service**. Render zeigt dir eine HTTPS-Adresse, z. B. `https://dein-spiel.onrender.com`.
8. Teile diese Adresse und den im Spiel angezeigten Raumcode mit deinen Freunden.

Die genauen Bezeichnungen und kostenlosen Angebote können sich bei Render ändern. Auf kostenlosen Instanzen kann der erste Aufruf nach einer Ruhephase länger dauern.

## Spielregeln

- 2–6 Spieler, ein gemeinsamer privater Raum.
- Der Gastgeber startet das Spiel, sobald mindestens zwei Personen verbunden sind.
- Jeder Spieler wertet 13 Kategorien genau einmal.
- Pro Zug bis zu drei Würfe; Würfel können zwischen Würfen behalten werden.
- Oberer Block: Bonus von 35 Punkten ab 63 Punkten.
- Der Server würfelt und berechnet die Punkte; der Client kann nicht einfach einen Punktwert an den Server senden.

## Wichtige Grenzen dieses einfachen Prototyps

- Spielräume und Punktestände liegen nur im Arbeitsspeicher des Servers. Bei Neustart/Schlafphase können sie verloren gehen.
- Es gibt keine Anmeldung, keine Wiederaufnahme nach Verbindungsabbruch und keinen dauerhaften Spielverlauf.
- Jeder Spieler sollte einen eigenen Tab/eine eigene Verbindung verwenden.
- Keine Echtgeld- oder Glücksspiel-Funktion.

## Technischer Aufbau

- `server.js`: Express-Webserver, Socket.IO-Echtzeitkommunikation, Raumverwaltung, Würfel und Wertungslogik.
- `public/index.html`: responsive Oberfläche ohne Build-Schritt oder zusätzliche Frontend-Tools.
- `package.json`: Server-Abhängigkeiten und Startskript.
