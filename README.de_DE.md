<p align="center">
  <img src="docs/assets/searchcli-logo.svg" alt="SearchCLI logo" width="560" />
</p>

# SearchCLI

[English](README.md) | [简体中文](README.zh_CN.md) | [日本語](README.ja_JP.md) | Deutsch | [한국어](README.ko_KR.md) | [Français](README.fr_FR.md) | [Русский](README.ru_RU.md) | [Italiano](README.it_IT.md) | [Español](README.es_ES.md) | [Português](README.pt_BR.md) | [Türkçe](README.tr_TR.md) | [ไทย](README.th_TH.md) | [Bahasa Indonesia](README.id_ID.md)

Verbinde stabile, abstimmbare Suche, Empfehlungen und konversationelle Suche mit deinem Agent-System oder Business-System.

[Schnellstart (Entwickler)](#schnellstart-entwickler) · [AI-Agent-Setup](#schnellstart-ai-agents) · [Vollständiger Agent Guide](docs/agent-quick-start.md) · [Beitragen](CONTRIBUTING.md) · [Sicherheit](SECURITY.md)

SearchCLI ist die offene CLI für AI Search on Volcengine.

Wenn dein Agent-System oder Business-System stabile, abstimmbare Dienste zur Informationsverteilung benötigt, bietet SearchCLI einen praktischen Weg, produktionsreife Such-, Empfehlungs- und konversationelle Retrieval-Funktionen in reale Workflows zu integrieren.

Mit SearchCLI und den installierbaren `Viking skills` können externe Agents Daten onboarden, Such- und Empfehlungsflüsse aufbauen und validieren, konversationelle Suche ausführen, Strategiekonfigurationen abstimmen, bad cases untersuchen und die Retrieval-Qualität in einem stabilen, überprüfbaren Prozess kontinuierlich verbessern.

## Was SearchCLI ist

- Die Kommandozeilen-Integrationsschicht für AI Search on Volcengine.
- Ein stabiler Weg für externe Systeme, auf Suche, Empfehlungen und konversationelle Retrieval-Funktionen zuzugreifen.
- Eine agentenfreundliche Workflow-Schicht mit installierbaren skills und automationssicherer Kommandoausgabe.
- Ein überprüfbares Ausführungsmodell mit dry-runs, Bestätigungspunkten und read-after-write-Verifikation.

## Für wen es gedacht ist

- Entwickler, die KI-gestützte Informationsverteilung in Business-Systeme integrieren.
- Teams, die Agent-Systeme bauen und stabile, konfigurierbare Such-, Empfehlungs- und Retrieval-Workflows benötigen.
- Betriebs-, Delivery- und Solution-Teams, die Daten-Onboarding, Anwendungskonfiguration und Laufzeitverhalten vor dem Produktiveinsatz explizit überprüfen möchten.

## Was es ermöglicht

- Item- und Katalogsuche auf strukturierten Geschäftsdaten.
- Empfehlungsflüsse, die mit Anwendungsszenen und Nutzerverhalten verbunden sind.
- Konversationelle Retrieval-Erlebnisse auf Basis der Anwendungssuche.
- Agent-Workflows, die Daten onboarden, Anwendungen konfigurieren und Laufzeitverhalten mit expliziten Prüfschritten validieren.

## Kernfunktionen

- `vs item profile | plan | apply` für strukturiertes Item-Onboarding.
- `vs app`, `vs dataset` und `vs data` für die Verwaltung von Anwendungen und Datensätzen.
- `vs search run`, `vs recommend run` und `vs chat run` für Laufzeitverifikation.
- `vs search tune query-generate | plan | run | report` für eine erste automatisierte Bewertung und Abstimmung von Textähnlichkeit.
- Installierbare `Viking skills`, damit externe Agents dieselben Workflows nutzen können.

## Anforderungen

- Node.js 20 oder neuer
- `git`
- Volcengine AK/SK mit Zugriff auf AI Search

## Schnellstart (Entwickler)

### 1. Installieren

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. Authentifizieren

Wenn die aktuelle Shell bereits `VIKING_AK` und `VIKING_SK` gesetzt hat:

```bash
vs auth import-env
vs auth status --json
vs doctor --json
```

Andernfalls führe den interaktiven Login in einem echten Terminal aus:

```bash
vs auth login
```

Wenn du für Suchabstimmung die Query-Generierung oder LLM-basierte Relevanzbewertung verwendest, konfiguriere eine OpenAI-kompatible LLM API, ohne den API key im Klartext in die Konfiguration zu schreiben:

```bash
vs llm login
vs llm status --json
vs search tune llm-check --live --json
```

Wenn die aktuelle Shell bereits `VIKING_LLM_BASE_URL`, `VIKING_LLM_API_KEY` und `VIKING_LLM_MODEL` gesetzt hat, kannst du stattdessen `vs llm import-env` verwenden. Der API key wird im lokalen sicheren Credential Store gespeichert; base URL und model werden als nicht geheime Konfiguration gespeichert.

### 3. Den ersten Onboarding-Flow ausführen

Wenn ein neuer App-Setup inklusive bind-time-Konfigurationsprüfung und Laufzeitverifikation benötigt wird, nutze den `dataset+app`-Pfad:

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search"
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review --wait-ready --run-trials
```

Wenn nur Datensatzbereitstellung nötig ist, nutze den `dataset-only`-Pfad, erzeuge einen dataset-only-Plan mit `--skip-app` und beende den Ablauf nach dataset create + ingest:

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search" --skip-app
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

Bevorzuge `dataset-create.json`, wenn der Plan diese Datei erzeugt hat, damit `Schema` und `DataFieldConfig` gemeinsam an die Datensatzerstellung übergeben werden. Die Form `--name <dataset-name> --type item --schema @schema.json` bleibt der manuelle schema-only-Fallback, wenn kein vollständiger create payload verfügbar oder geeignet ist.

`--skip-app` wird auch von `vs item provision` und `vs item apply` als Ausführungsschutz akzeptiert, wenn du die dataset-only-Grenze aus einem bestehenden Plan heraus erzwingen musst.

Wenn du einen Video-Datensatz benötigst, verlasse dich nicht auf den Standardtyp. Übergib immer explizit `--type video`:

Für `dataset+app`:

```bash
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search"
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review --wait-ready --run-trials
```

Für `dataset-only`:

```bash
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search" --skip-app
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

Für dataset-only-Bereitstellung von Video-Datensätzen solltest du `dataset-create.json` bevorzugen, damit die Anfrage `DataFieldConfig` enthält; allein `--schema @schema.json` kann mit `MissingParameter.DefaultFieldStrategy` fehlschlagen.

## Schnellstart (AI Agents)

Wenn ein externer Agent AI Search über dieses Repository bedienen soll:

### 1. SearchCLI installieren

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. Viking skills installieren

```bash
npx skills add "git@github.com:volcengine/SearchCLI.git" -y -g
```

Das standardmäßige öffentliche skill bundle enthält:

- `vs-shared`
- `vs-item-onboarding`
- `vs-search`
- `vs-search-tuning`
- `vs-chat`
- `vs-recommend`

### 3. Authentifizieren

Wenn die aktuelle Shell bereits `VIKING_AK` und `VIKING_SK` gesetzt hat, wird empfohlen:

```bash
vs auth import-env
```

Andernfalls:

```bash
vs auth login
```

### 4. Verifizieren

```bash
vs --help
vs auth status --json
vs llm status --json
vs doctor --json
vs skill list
```

## Öffentliche Befehlsgruppen

- `vs auth`
- `vs llm`
- `vs doctor`
- `vs skill`
- `vs item`
- `vs app`
- `vs dataset`
- `vs data`
- `vs search`
- `vs chat`
- `vs recommend`

## Dokumentation

- [Agent Quick Start](docs/agent-quick-start.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## Maintainer-Workflow

Wenn du das Open-Source-Repository selbst wartest, ist das lokale skill tooling:

```bash
vs skill list
vs skill init viking-demo-skill
vs skill validate
vs skill install all
```

Repository-Prüfungen bauen und ausführen:

```bash
npm install
npm run validate:skills
npm run build
npm run test:acceptance:dist
```

## Contribution

Weitere Details findest du unter [Contributing](CONTRIBUTING.md).

Externe Beitragende müssen das Contributor License Agreement (CLA) abschließen, bevor ein pull request akzeptiert werden kann.

## Code of Conduct

Weitere Details findest du unter [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Wenn du ein potenzielles Sicherheitsproblem entdeckst oder glaubst, eines entdeckt zu haben, informiere Bytedance Security bitte privat über unser [security center](https://security.bytedance.com/src) oder per [vulnerability reporting email](mailto:sec@bytedance.com).

Bitte erstelle **kein** öffentliches GitHub issue.

## License

Dieses Projekt ist unter der [Apache-2.0 License](LICENSE) lizenziert.
