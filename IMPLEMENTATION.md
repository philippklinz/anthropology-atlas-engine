# Erster Implementierungsauftrag

Die ausführliche Grundlage steht in `docs/SPECIFICATION.md`. Dieses Dokument benennt die ersten abarbeitbaren Ergebnisse. Der Stand 0.1.0-dev.1 ist in `docs/STATUS.md` dokumentiert; offene Teilabnahmen bleiben hier unmarkiert.

## M0 · Inhalte eindeutig verarbeiten

- [x] TypeScript-Projekt mit `domain`, `catalog`, `query` und `state` aufsetzen; noch keine fachlichen Sonderfälle im UI.
- [x] JSON Schema Draft 2020-12 lokal laden, ohne Netzauflösung von `$ref`.
- [x] Datei- und ID-Registry implementieren, mit kanonischer Pfadzuordnung und Dublettenprüfung.
- [x] Kalenderprüfung, astronomische Jahreszählung, Präzision und halboffene `epochDay`-Intervalle implementieren.
- [ ] Prädikate und Ereignisrollen prüfen; Quellen mit Fundstellen und optionalen Feldbezügen auflösen.
- [ ] Paketmitgliedschaft, Abhängigkeiten, Manifestvollständigkeit und transitive Referenzauflösung implementieren.
- [x] Geometrieimport mit belastbarer Topologieprüfung ergänzen; Originale unverändert halten.
- [x] Prüfprofile `draft`, `fixture` und `release` trennen.
- [ ] `AtlasDataProvider` und Content-Katalog-Vertrag einfrieren; normalisierte Record-, Relations-, Zeit- und Suchindexformate definieren und versionieren.
- [ ] URL-Routen, Zustandsserializer und Parser sowie Commit-Grenzen für die Browser-Historie definieren; URL-Roundtrip ohne Sitzungsspeicher prüfen.
- [ ] Autorenwerkzeug als unabhängig verwendbares lokales Paket erzeugen, mit Version, Schemas und Prüfsummen.

M0 ist fertig, wenn ein Content-Beitrag unabhängig von der UI geprüft werden kann und alle fachlichen Fehlerklassen aus der Spezifikation verständlich gemeldet werden. Die gelieferten Schemas ersetzen diese Arbeit nicht.

## M1 · Integration statt Annahmen

- [x] Bibliotheksversionen gemeinsam auswählen, vollständig vendorizieren und inventarisieren.
- [ ] Lokale physische Grundkarte auf dem MapLibre-Globus zeigen.
- [ ] vis-timeline an historische Zeit anbinden: 44 BCE, 1 BCE, 1 CE, 99 CE sowie Schaltjahre und unscharfe Jahresangaben.
- [ ] Dieselbe Auswahl in Karte, fokussiertem vis-network und Detail synchronisieren.
- [ ] Eigenständigen GLB-Viewer und kleines Kartenmodell prüfen, inklusive Horizont, Rückseite und Projektion.
- [ ] Einen real erzeugten Katalog über alle drei Quellenprofile laden. Zwei Origins tatsächlich testen, nicht nur durch relative Pfade simulieren.
- [ ] Raw-Hosting für JSON, GeoJSON, Modell, Bild und Font prüfen; keinen GitHub-Token in die App einbauen.
- [ ] Unterpfad-Deployment, frisches Browserprofil und Origin-Allowlist prüfen.
- [ ] Direktaufruf, Neuladen, echte Links und Browser-Zurück/-Vorwärts früh implementieren; die Fälle in `tests/browser/navigation-cases.json` anschließend mit den vollständigen Ansichten abnehmen.

## M2/M3 · Nutzbarer Atlas und erster historischer Inhalt

Nach erfolgreichem M1 App-Schale gemäß Designreferenz, URL-Zustand, Suche, Quellenansicht, Zugänglichkeit und die Referenzkapitel fertigstellen. Erst dann den fiktiven Bestand durch tatsächlich recherchierte, geprüfte Inhalte ergänzen. Die Fixtures bleiben dauerhaft eigenständige Tests.

MariaDB-Importer und API sind für einen Folgeauftrag vorgesehen. Ihre Existenz darf weder die statischen Provider noch das Quellen- und Zeitmodell verändern.
