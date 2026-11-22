# Datenvertrag 0.1.0 · Entwurf

| Datei | Zweck |
|---|---|
| `record.schema.json` | Neun Klassen kanonischer Autoren-Metadatensätze, einschließlich Zeit, Quellen und Modellmetadaten |
| `dataset.schema.json` | Einstieg in einen Recherchebestand |
| `config.schema.json` | Pro Atlas-Instanz festgelegte Content-Quelle |
| `catalog.schema.json` | Transporthülle eines kompilierten Content-Releases |
| `vocabulary.json` | Entitätspfade, Prädikate, Ereignisrollen und Fähigkeiten |

`record.schema.json` enthält ausschließlich interne `$ref`-Verweise. Die `$schema`-URI bezeichnet den Standard und ist keine Anweisung, beim normalen Prüfen das Internet abzurufen.

Für Katalogdateien gilt zusätzlich: eindeutige Pfade, Übereinstimmung von Bytezahl/Hash und tatsächlichen Dateien, vollständige Endpunkte, Referenzauflösung und zulässige Ladebasis. Der Katalog enthält keine Prüfsumme seiner eigenen Bytes; dessen SHA-256 wird außerhalb in der Deploymentkonfiguration fixiert.

Die Formate der kompilierten Index-Payloads werden beim Content-Compiler in M0 festgelegt. `indexVersion: 1` ist die vorgesehene erste Version, noch kein veröffentlichter Browserindex. Die Quelle JSON Schema selbst prüft keine Datei-Querreferenzen und keine Geometrietopologie.

Zusätzliche semantische Regeln stehen in den Abschnitten 4–10 und 16 der Gesamtspezifikation. Dazu gehören insbesondere:

- tatsächliche Kalendertage, Reihenfolge und Präzisionsgrenzen;
- Endpunkttypen jeder Beziehung, symmetrische Speicherung und ereignisspezifische Rollen;
- Paketbesitz, geschlossene Abhängigkeiten und Referenzen;
- Dateipfade, Geometrietyp, Ringtopologie und Dateline;
- Reviewstatus, Quellenrollen, Fundstellen und lokale Ressourcenrechte;
- zulässige Runtime-Origins, Katalogrevision, Dateien und Ressourcenbudgets.
