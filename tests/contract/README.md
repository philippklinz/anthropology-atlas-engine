# Prüfskript für das Spezifikationspaket

`check-fixture.py` reproduziert die strukturellen und ausgewählten semantischen Prüfungen dieses Reviews. Es ist ein eng auf den beigefügten Vertragsbestand begrenztes Prüfskript, kein fertiger Produktionsvalidator und kein vollständiger CLI-Vertrag.

Geprüfte Umgebung: Python 3.12.14, jsonschema 4.26.0 und Node.js 24.22.3. Diese Werkzeuge sind für dieses Spezifikationspaket nicht vendoriziert; die spätere Engine muss ihr eigenes vorbereitetes Toolchainprofil und alle Projektabhängigkeiten wie spezifiziert bereitstellen. Das Skript führt selbst keine Downloads aus.

Mit bereits installierten Werkzeugen:

```bash
python3 tests/contract/check-fixture.py
```

Das Ergebnis wird unter `tests/contract/spec-check-results.json` geschrieben. Die Prüfung erfasst vier Schemas, den fiktiven Bestand, Referenzen, Paketabhängigkeiten, einige Geometriegrundregeln, Negativfälle und Kalenderwerte im Vergleich zu einem UTC-JavaScript-Adapter.

Nicht abgedeckt sind insbesondere vollständige Polygon-Topologie, alle künftigen semantischen Regeln, Browserdarstellung, echter Content-Compiler, GitHub-Raw-Hosting, produktiver Offline-Build und historische Recherche. Ein grüner Lauf ist deshalb keine Freigabe einer historischen Veröffentlichung.
