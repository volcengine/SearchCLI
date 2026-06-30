<p align="center">
  <img src="docs/assets/searchcli-logo.svg" alt="SearchCLI logo" width="560" />
</p>

# SearchCLI

[English](README.md) | [简体中文](README.zh_CN.md) | [日本語](README.ja_JP.md) | [Deutsch](README.de_DE.md) | [한국어](README.ko_KR.md) | [Français](README.fr_FR.md) | [Русский](README.ru_RU.md) | Italiano | [Español](README.es_ES.md) | [Português](README.pt_BR.md) | [Türkçe](README.tr_TR.md) | [ไทย](README.th_TH.md) | [Bahasa Indonesia](README.id_ID.md)

Collega ricerca stabile e regolabile, raccomandazioni e retrieval conversazionale al tuo sistema Agent o al tuo sistema business.

[Avvio rapido (sviluppatori)](#avvio-rapido-sviluppatori) · [Configurazione AI Agent](#avvio-rapido-ai-agents) · [Guida Agent completa](docs/agent-quick-start.md) · [Contribuire](CONTRIBUTING.md) · [Sicurezza](SECURITY.md)

SearchCLI è la CLI aperta per AI Search on Volcengine.

Se il tuo sistema Agent o sistema business richiede servizi di distribuzione delle informazioni stabili e regolabili, SearchCLI offre un percorso pratico per integrare ricerca, raccomandazioni e retrieval conversazionale di livello production nei workflow reali.

Con SearchCLI e i suoi `Viking skills` installabili, gli Agent esterni possono eseguire l'onboarding dei dati, costruire e validare flussi di ricerca e raccomandazione, eseguire retrieval conversazionale, regolare la configurazione delle strategie, analizzare bad cases e iterare sulla qualità del retrieval in modo stabile e verificabile.

## Che cos'è SearchCLI

- La superficie di integrazione da riga di comando per AI Search on Volcengine.
- Un percorso stabile per consentire ai sistemi esterni di accedere a funzionalità di ricerca, raccomandazione e retrieval conversazionale.
- Un livello di workflow adatto agli Agent, costruito attorno a skills installabili e output dei comandi sicuri per l'automazione.
- Un modello di esecuzione verificabile con dry-run, gate di conferma e verifica read-after-write.

## A chi è rivolto

- Sviluppatori che integrano distribuzione delle informazioni basata su AI nei sistemi business.
- Team che costruiscono sistemi Agent e hanno bisogno di workflow di ricerca, raccomandazione e retrieval stabili e configurabili.
- Team operations, delivery e solution che necessitano di un modo verificabile per eseguire onboarding dei dati, configurare applicazioni e verificare il comportamento runtime prima dell'uso in produzione.

## Cosa abilita

- Ricerca di item e cataloghi su dati business strutturati.
- Flussi di raccomandazione collegati a scene applicative e comportamento degli utenti.
- Esperienze di retrieval conversazionale basate sulla ricerca applicativa.
- Workflow Agent che possono eseguire onboarding dei dati, configurare applicazioni e validare il comportamento runtime con passaggi di revisione espliciti.

## Funzionalità principali

- `vs item profile | plan | apply` per l'onboarding di item strutturati.
- `vs app`, `vs dataset` e `vs data` per la gestione di applicazioni e dataset.
- `vs search run`, `vs recommend run` e `vs chat run` per la verifica runtime.
- `vs search tune query-generate | plan | run | report` per una prima versione di valutazione e tuning automatizzati della similarità testuale.
- `Viking skills` installabili, così gli Agent esterni possono utilizzare gli stessi workflow.

## Requisiti

- Node.js 20 o versione successiva
- `git`
- Volcengine AK/SK con accesso ad AI Search

## Avvio rapido (sviluppatori)

### 1. Installazione

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. Autenticazione

Se la shell corrente ha già `VIKING_AK` e `VIKING_SK`:

```bash
vs auth import-env
vs auth status --json
vs doctor --json
```

Altrimenti, esegui il login interattivo in un terminale reale:

```bash
vs auth login
```

Se utilizzerai la generazione di query per il tuning della ricerca o la valutazione di rilevanza tramite LLM, configura una API LLM compatibile con OpenAI senza inserire la API key in chiaro nella configurazione:

```bash
vs llm login
vs llm status --json
vs search tune llm-check --live --json
```

Se la shell corrente ha già `VIKING_LLM_BASE_URL`, `VIKING_LLM_API_KEY` e `VIKING_LLM_MODEL`, puoi usare invece `vs llm import-env`. La API key viene salvata nello store locale sicuro delle credenziali; base URL e model vengono salvati come configurazione non segreta.

### 3. Eseguire il primo flusso di onboarding

Se l'utente vuole una nuova app con revisione della configurazione al momento del bind e verifica runtime, usa il percorso `dataset+app`:

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search"
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review --wait-ready --run-trials
```

Se hai bisogno solo del provisioning del dataset, usa il percorso `dataset-only`, genera un piano dataset-only con `--skip-app` e fermati dopo dataset create + ingest:

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search" --skip-app
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

Preferisci `dataset-create.json` quando il piano lo genera, così la creazione del dataset mantiene insieme `Schema` e `DataFieldConfig`. La forma `--name <dataset-name> --type item --schema @schema.json` resta il fallback manuale schema-only quando un payload di creazione completo non è disponibile o non è adatto.

`--skip-app` è accettato anche da `vs item provision` e `vs item apply` come guard rail di esecuzione quando devi imporre il limite dataset-only da un piano esistente.

Se hai bisogno di un dataset video, non fare affidamento sul tipo predefinito. Passa sempre esplicitamente `--type video`:

Per `dataset+app`:

```bash
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search"
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review --wait-ready --run-trials
```

Per `dataset-only`:

```bash
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search" --skip-app
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

Per il provisioning dataset-only di dataset video, preferisci `dataset-create.json` così la richiesta include `DataFieldConfig`; usare solo `--schema @schema.json` può fallire con `MissingParameter.DefaultFieldStrategy`.

## Avvio rapido (AI Agents)

Se un Agent esterno deve usare AI Search tramite questo repository:

### 1. Installare SearchCLI

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. Installare i Viking skills

```bash
npx skills add "git@github.com:volcengine/SearchCLI.git" -y -g
```

Il bundle pubblico predefinito di skills include:

- `vs-shared`
- `vs-item-onboarding`
- `vs-search`
- `vs-search-tuning`
- `vs-chat`
- `vs-recommend`

### 3. Autenticazione

Se la shell corrente ha già `VIKING_AK` e `VIKING_SK`, preferisci:

```bash
vs auth import-env
```

Altrimenti:

```bash
vs auth login
```

### 4. Verifica

```bash
vs --help
vs auth status --json
vs llm status --json
vs doctor --json
vs skill list
```

## Gruppi di comandi pubblici

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

## Documentazione

- [Agent Quick Start](docs/agent-quick-start.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## Workflow per maintainer

Se mantieni il repository open source, il tooling locale per le skill è:

```bash
vs skill list
vs skill init viking-demo-skill
vs skill validate
vs skill install all
```

Compila ed esegui i controlli del repository:

```bash
npm install
npm run validate:skills
npm run build
npm run test:acceptance:dist
```

## Contribuire

Consulta [Contributing](CONTRIBUTING.md) per maggiori dettagli.

I contributori esterni devono completare il Contributor License Agreement (CLA) prima che una pull request possa essere accettata.

## Codice di condotta

Consulta [Code of Conduct](CODE_OF_CONDUCT.md) per maggiori dettagli.

## Sicurezza

Se scopri una potenziale vulnerabilità in questo progetto, o pensi di averne scoperta una, ti chiediamo di informare Bytedance Security tramite il nostro [security center](https://security.bytedance.com/src) o la [vulnerability reporting email](mailto:sec@bytedance.com).

Non creare una issue GitHub pubblica.

## Licenza

Questo progetto è concesso in licenza secondo la [Apache-2.0 License](LICENSE).
