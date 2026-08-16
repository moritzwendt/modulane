# Modulane

Modulane verbindet Projekte, Komponenten, Aufgaben, beteiligte Personen, Anforderungen und Fortschrittsupdates in einer fokussierten Arbeitsoberfläche.

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

1. Übersicht mit aktiven Aufgaben, Risiken und Updates
2. Projekte mit Typ, Plattformen und Mitgliedern
3. Aufgabenseiten mit Status, Priorität und Zeitplanung
4. Anforderungen mit automatisch berechnetem Fortschritt
5. Beteiligte Personen mit Aufgabenrollen
6. Fortschrittsupdates und Aktivitätsverlauf
7. Globale Suche und Benachrichtigungen
8. Helles und dunkles Design
9. Responsive Navigation für kleine Bildschirme
10. Lokale Speicherung der Beispieldaten

## Architektur

Die Oberfläche verwendet React, TypeScript und Vite. Der Organisationszustand greift über eine Repository Schnittstelle auf die lokale Speicherung zu. Eine spätere Datenbank kann diese Implementierung ersetzen, ohne die Arbeitsoberfläche neu aufzubauen.

Die Code Ansicht einer Aufgabe ist bereits als eigener Bereich angelegt. Eine spätere GitHub Integration kann Repositories, Branches, Commits, Pull Requests und Issues über einen separaten Integrationsdienst bereitstellen.
