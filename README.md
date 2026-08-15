# Modulane

Modulane verbindet Projekte, Features, beteiligte Personen, Anforderungen und Fortschrittsupdates in einer fokussierten Produktoberfläche.

## Lokaler Start

```bash
npm install
npm run dev
```

## Produktionsbuild

```bash
npm run build
```

## Aktueller Umfang

1. Übersicht mit aktiven Features, Risiken und Updates
2. Projekte mit Typ, Plattformen und Mitgliedern
3. Feature Seiten mit Status, Priorität und Zeitplanung
4. Anforderungen mit automatisch berechnetem Fortschritt
5. Beteiligte Personen mit Feature Rollen
6. Fortschrittsupdates und Aktivitätsverlauf
7. Globale Suche und Benachrichtigungen
8. Helles und dunkles Design
9. Responsive Navigation für kleine Bildschirme
10. Lokale Speicherung der Beispieldaten

## Architektur

Die Oberfläche verwendet React, TypeScript und Vite. Der Workspace Zustand greift über eine Repository Schnittstelle auf die lokale Speicherung zu. Eine spätere Datenbank kann diese Implementierung ersetzen, ohne die Produktoberfläche neu aufzubauen.

Die Code Ansicht eines Features ist bereits als eigener Bereich angelegt. Eine spätere GitHub Integration kann Repositories, Branches, Commits, Pull Requests und Issues über einen separaten Integrationsdienst bereitstellen.
