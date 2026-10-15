# Würfelmeister Online – Android-App-Projekt

Dieses Projekt ist eine Android-WebView-App, die die Online-Spielseite in einer Android-App öffnet. Die Spielräume und Echtzeitkommunikation laufen weiterhin über den Webserver (Express + Socket.IO).

## Wichtig: APK noch nicht fertig kompiliert
In dieser Umgebung ist kein Android SDK/Gradle-Buildsystem verfügbar, daher kann hier keine installierbare APK zuverlässig gebaut werden. Dieses ZIP enthält das vollständige Android-Studio-Projekt zum Erzeugen der APK.

## APK erstellen

1. Veröffentliche zuerst den Webserver aus dem separaten Projekt `wuerfelmeister-online.zip` (Anleitung dort).
2. Kopiere die HTTPS-Adresse des veröffentlichten Spiels, zum Beispiel `https://dein-spiel.onrender.com`.
3. Öffne `app/src/main/java/de/wuerfelmeister/online/MainActivity.java`.
4. Ersetze `https://DEINE-SPIEL-URL-HIER` in `GAME_URL` durch deine echte HTTPS-Adresse.
5. Öffne diesen Projektordner in Android Studio.
6. Warte, bis Gradle synchronisiert ist, und wähle **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
7. Android Studio legt die APK üblicherweise unter `app/build/outputs/apk/debug/app-debug.apk` ab.

## Testen
- Die APK benötigt Internetzugriff.
- Für Online-Partien muss die Spielserver-Adresse öffentlich erreichbar sein und HTTPS verwenden.
- Die APK ist ein WebView-Wrapper, keine vollständig offlinefähige Version.
- Vor einer Veröffentlichung im Play Store sollten App-Icon, Datenschutzangaben, Versionssignierung und Tests ergänzt werden.
