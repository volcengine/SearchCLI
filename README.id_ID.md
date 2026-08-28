<p align="center">
  <img src="docs/assets/searchcli-logo.svg" alt="SearchCLI logo" width="560" />
</p>

# SearchCLI

[English](README.md) | [简体中文](README.zh_CN.md) | [日本語](README.ja_JP.md) | [Deutsch](README.de_DE.md) | [한국어](README.ko_KR.md) | [Français](README.fr_FR.md) | [Русский](README.ru_RU.md) | [Italiano](README.it_IT.md) | [Español](README.es_ES.md) | [Português](README.pt_BR.md) | [Türkçe](README.tr_TR.md) | [ไทย](README.th_TH.md) | Bahasa Indonesia

Hubungkan pencarian yang stabil dan dapat disesuaikan, rekomendasi, serta retrieval percakapan ke sistem Agent atau sistem bisnis Anda.

[Komunitas](#komunitas) · [Mulai cepat (pengguna manusia)](#mulai-cepat-pengguna-manusia) · [Penyiapan AI Agent](#mulai-cepat-ai-agents) · [Panduan Agent lengkap](docs/agent-quick-start.md) · [Berkontribusi](CONTRIBUTING.md) · [Keamanan](SECURITY.md)

SearchCLI adalah CLI terbuka untuk AI Search on Volcengine.

Jika sistem Agent atau sistem bisnis Anda membutuhkan layanan distribusi informasi yang stabil dan dapat disesuaikan, SearchCLI memberi jalur praktis untuk mengintegrasikan pencarian, rekomendasi, dan retrieval percakapan tingkat production ke workflow nyata.

Dengan SearchCLI dan `Viking skills` yang dapat diinstal, Agents eksternal dapat melakukan onboarding data, membangun dan memvalidasi alur pencarian dan rekomendasi, menjalankan retrieval percakapan, menyesuaikan konfigurasi strategi, memeriksa bad cases, dan mengiterasi kualitas retrieval dengan cara yang stabil dan dapat ditinjau.

## Komunitas

<p align="center">
  <strong>Bergabunglah dengan grup pengguna SearchCLI di WeChat</strong><br />
  Pindai kode QR di bawah dengan WeChat untuk terhubung dengan pengguna dan pengelola proyek.<br />
  <sub>Kode QR diperbarui secara berkala. Jika sudah kedaluwarsa, periksa kembali untuk mendapatkan versi terbaru.</sub>
</p>

<p align="center">
  <a href="docs/assets/wechat-group-qr.jpg">
    <img src="docs/assets/wechat-group-qr.jpg" alt="Kode QR grup pengguna SearchCLI di WeChat" width="320" />
  </a>
</p>

## Apa itu SearchCLI

- Permukaan integrasi command-line untuk AI Search on Volcengine.
- Jalur stabil bagi sistem eksternal untuk mengakses kemampuan pencarian, rekomendasi, dan retrieval percakapan.
- Lapisan workflow yang ramah Agent, dibangun di sekitar skills yang dapat diinstal dan output perintah yang aman untuk otomatisasi.
- Model eksekusi yang dapat ditinjau dengan dry-run, gerbang konfirmasi, dan verifikasi read-after-write.

## Untuk siapa

- Developer yang mengintegrasikan distribusi informasi berbasis AI ke sistem bisnis.
- Tim yang membangun sistem Agent dan membutuhkan workflow pencarian, rekomendasi, dan retrieval yang stabil serta dapat dikonfigurasi.
- Tim operasi, delivery, dan solusi yang membutuhkan cara yang dapat ditinjau untuk onboarding data, mengonfigurasi aplikasi, dan memverifikasi perilaku runtime sebelum penggunaan production.

## Apa yang diaktifkan

- Pencarian item dan catalog di atas data bisnis terstruktur.
- Alur rekomendasi yang terhubung ke scene aplikasi dan perilaku pengguna.
- Pengalaman retrieval percakapan yang berlandaskan pencarian aplikasi.
- Workflow Agent yang dapat melakukan onboarding data, mengonfigurasi aplikasi, dan memvalidasi perilaku runtime dengan langkah review yang eksplisit.

## Kemampuan inti

- `vs app`, `vs dataset`, dan `vs data` untuk manajemen aplikasi dan dataset.
- `vs search run`, `vs recommend run`, dan `vs chat run` untuk verifikasi runtime.
- `vs search tune query-generate | plan | run | report` untuk versi awal evaluasi dan tuning kemiripan teks otomatis.
- `Viking skills` yang dapat diinstal agar Agents eksternal dapat menggunakan workflow yang sama.

## Persyaratan

- Node.js 20 atau lebih baru
- `git`
- Volcengine AK/SK dengan akses ke AI Search

## Mulai cepat (pengguna manusia)

### 1. Instal

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. Autentikasi

Jika shell saat ini sudah memiliki `VIKING_AK` dan `VIKING_SK`:

```bash
vs auth import-env
vs auth status --json
vs doctor --json
```

Jika belum, jalankan login interaktif di terminal nyata:

```bash
vs auth login
```

Jika Anda akan menggunakan pembuatan kueri untuk search tuning atau penilaian relevansi dengan LLM, konfigurasikan OpenAI-compatible LLM API tanpa menaruh API key dalam konfigurasi plain text:

```bash
vs llm login
vs llm status --json
vs search tune llm-check --live --json
```

Jika shell saat ini sudah memiliki `VIKING_LLM_BASE_URL`, `VIKING_LLM_API_KEY`, dan `VIKING_LLM_MODEL`, gunakan `vs llm import-env` sebagai gantinya. API key disimpan di local secure credential store; base URL dan model disimpan sebagai konfigurasi non-rahasia.

### 3. Jalankan onboarding flow pertama

```bash
vs dataset import-url --file-name items.jsonl
curl -X PUT --data-binary "@./items.jsonl" "<FileUrl from previous step>"
vs dataset infer-schema --tos-key <FileKey> --type multi_modal --theme e_commerce --language zh --name <dataset-name>
vs dataset infer-result --task-id <TaskID> --render-schema
vs dataset create --data @dataset-create.json
vs data write --dataset-id <DatasetId> --fields @items.jsonl
vs app create --name <app-name> --industry e_commerce --language zh
vs app attach-dataset --data @attach.json
```

Jika Anda hanya membutuhkan dataset (tanpa app), berhenti setelah `vs data write`.

Untuk dataset peristiwa pengguna, gunakan `--type user_event` dan hilangkan `--theme`.

## Mulai cepat (AI Agents)

Jika Agent eksternal perlu mengoperasikan AI Search melalui repository ini:

### 1. Instal SearchCLI

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. Instal Viking skills

```bash
npx skills add "git@github.com:volcengine/SearchCLI.git" -y -g
```

Bundle skill publik default adalah:

- `vs-shared`
- `vs-item-onboarding`
- `vs-search`
- `vs-search-tuning`
- `vs-chat`
- `vs-recommend`

### 3. Autentikasi

Jika shell saat ini sudah memiliki `VIKING_AK` dan `VIKING_SK`, utamakan:

```bash
vs auth import-env
```

Jika belum:

```bash
vs auth login
```

### 4. Verifikasi

```bash
vs --help
vs auth status --json
vs llm status --json
vs doctor --json
vs skill list
```

## Grup perintah publik

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

## Dokumentasi

- [Agent Quick Start](docs/agent-quick-start.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## Workflow maintainer

Jika Anda memelihara repository open-source ini, tooling skill lokalnya adalah:

```bash
vs skill list
vs skill init viking-demo-skill
vs skill validate
vs skill install all
```

Build dan jalankan pemeriksaan repository:

```bash
npm install
npm run validate:skills
npm run build
npm run test:acceptance:dist
```

## Kontribusi

Silakan lihat [Contributing](CONTRIBUTING.md) untuk detail selengkapnya.

Kontributor eksternal harus menyelesaikan Contributor License Agreement (CLA) sebelum pull request dapat diterima.

## Kode Etik

Silakan lihat [Code of Conduct](CODE_OF_CONDUCT.md) untuk detail selengkapnya.

## Keamanan dan privasi

Proyek ini menangani keamanan dengan serius.
Untuk pelaporan kerentanan dan versi yang didukung, lihat [SECURITY.md](SECURITY.md).

## Lisensi

Proyek ini dilisensikan di bawah [Apache-2.0 License](LICENSE).
