<p align="center">
  <img src="docs/assets/searchcli-logo.svg" alt="SearchCLI logo" width="560" />
</p>

# SearchCLI

[English](README.md) | [简体中文](README.zh_CN.md) | [日本語](README.ja_JP.md) | [Deutsch](README.de_DE.md) | [한국어](README.ko_KR.md) | [Français](README.fr_FR.md) | [Русский](README.ru_RU.md) | [Italiano](README.it_IT.md) | [Español](README.es_ES.md) | [Português](README.pt_BR.md) | Türkçe | [ไทย](README.th_TH.md) | [Bahasa Indonesia](README.id_ID.md)

Kararlı ve ayarlanabilir arama, öneri ve konuşmalı retrieval özelliklerini Agent sisteminize veya iş sisteminize bağlayın.

[Topluluk](#topluluk) · [Hızlı Başlangıç (geliştiriciler)](#hızlı-başlangıç-geliştiriciler) · [AI Agent kurulumu](#hızlı-başlangıç-ai-agents) · [Tam Agent kılavuzu](docs/agent-quick-start.md) · [Katkıda bulunma](CONTRIBUTING.md) · [Güvenlik](SECURITY.md)

SearchCLI, AI Search on Volcengine için açık CLI'dır.

Agent sisteminiz veya iş sisteminiz kararlı ve ayarlanabilir bilgi dağıtım servislerine ihtiyaç duyuyorsa, SearchCLI production düzeyinde arama, öneri ve konuşmalı retrieval özelliklerini gerçek workflow'lara entegre etmek için pratik bir yol sunar.

SearchCLI ve kurulabilir `Viking skills` ile harici Agents veri onboarding yapabilir, arama ve öneri akışları oluşturup doğrulayabilir, konuşmalı retrieval çalıştırabilir, strateji yapılandırmasını ayarlayabilir, bad cases inceleyebilir ve retrieval kalitesini kararlı, incelenebilir bir şekilde yineleyerek iyileştirebilir.

## Topluluk

<p align="center">
  <strong>SearchCLI WeChat kullanıcı grubuna katılın</strong><br />
  Kullanıcılar ve proje yöneticileriyle iletişim kurmak için aşağıdaki QR kodunu WeChat ile tarayın.<br />
  <sub>QR kodu düzenli olarak yenilenir. Süresi dolmuşsa en güncel sürüm için daha sonra tekrar kontrol edin.</sub>
</p>

<p align="center">
  <a href="docs/assets/wechat-group-qr.jpg">
    <img src="docs/assets/wechat-group-qr.jpg" alt="SearchCLI WeChat kullanıcı grubu QR kodu" width="320" />
  </a>
</p>

## SearchCLI nedir

- AI Search on Volcengine için komut satırı entegrasyon yüzeyidir.
- Harici sistemlerin arama, öneri ve konuşmalı retrieval özelliklerine erişmesi için kararlı bir yoldur.
- Kurulabilir skills ve otomasyona güvenli komut çıktısı etrafında oluşturulmuş Agent dostu bir workflow katmanıdır.
- Dry-run, onay kapıları ve write sonrası read doğrulaması içeren incelenebilir bir yürütme modelidir.

## Kimler için

- AI destekli bilgi dağıtımını iş sistemlerine entegre eden geliştiriciler.
- Kararlı ve yapılandırılabilir arama, öneri ve retrieval workflow'larına ihtiyaç duyan Agent sistemleri geliştiren ekipler.
- Production kullanımı öncesinde veri onboarding, uygulama yapılandırması ve runtime davranışını incelenebilir şekilde doğrulamak isteyen operasyon, delivery ve çözüm ekipleri.

## Neler sağlar

- Yapılandırılmış iş verileri üzerinde item ve catalog araması.
- Uygulama sahneleri ve kullanıcı davranışıyla bağlantılı öneri akışları.
- Uygulama aramasına dayalı konuşmalı retrieval deneyimleri.
- Verileri onboard eden, uygulamaları yapılandıran ve runtime davranışını açık inceleme adımlarıyla doğrulayan Agent workflow'ları.

## Temel özellikler

- Uygulama ve dataset yönetimi için `vs app`, `vs dataset` ve `vs data`.
- Runtime doğrulama için `vs search run`, `vs recommend run` ve `vs chat run`.
- Metin benzerliği için ilk sürüm otomatik değerlendirme ve ayarlama amacıyla `vs search tune query-generate | plan | run | report`.
- Harici Agents'ın aynı workflow'ları kullanabilmesi için kurulabilir `Viking skills`.

## Gereksinimler

- Node.js 20 veya daha yeni
- `git`
- AI Search erişimi olan Volcengine AK/SK

## Hızlı Başlangıç (geliştiriciler)

### 1. Kurulum

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. Kimlik doğrulama

Geçerli shell'de `VIKING_AK` ve `VIKING_SK` zaten ayarlıysa:

```bash
vs auth import-env
vs auth status --json
vs doctor --json
```

Aksi halde gerçek bir terminalde etkileşimli login çalıştırın:

```bash
vs auth login
```

Search tuning sorgu üretimi veya LLM ile ilgililik değerlendirmesi kullanacaksanız, API key'i düz metin yapılandırmaya koymadan OpenAI-compatible LLM API yapılandırın:

```bash
vs llm login
vs llm status --json
vs search tune llm-check --live --json
```

Geçerli shell'de `VIKING_LLM_BASE_URL`, `VIKING_LLM_API_KEY` ve `VIKING_LLM_MODEL` zaten ayarlıysa bunun yerine `vs llm import-env` kullanabilirsiniz. API key yerel güvenli kimlik bilgisi deposunda saklanır; base URL ve model gizli olmayan yapılandırma olarak saklanır.

### 3. İlk onboarding flow'u çalıştırma

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

Yalnızca bir dataset'e ihtiyacınız varsa (app olmadan), `vs data write` işleminden sonra durun.

Kullanıcı olayları dataset'leri için `--type user_event` kullanın ve `--theme` parametresini atlayın.

## Hızlı Başlangıç (AI Agents)

Harici bir Agent bu repository üzerinden AI Search çalıştıracaksa:

### 1. SearchCLI kurulumu

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. Viking skills kurulumu

```bash
npx skills add "git@github.com:volcengine/SearchCLI.git" -y -g
```

Varsayılan public skill bundle şunları içerir:

- `vs-shared`
- `vs-item-onboarding`
- `vs-search`
- `vs-search-tuning`
- `vs-chat`
- `vs-recommend`

### 3. Kimlik doğrulama

Geçerli shell'de `VIKING_AK` ve `VIKING_SK` zaten ayarlıysa şunu tercih edin:

```bash
vs auth import-env
```

Aksi halde:

```bash
vs auth login
```

### 4. Doğrulama

```bash
vs --help
vs auth status --json
vs llm status --json
vs doctor --json
vs skill list
```

## Public komut grupları

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

## Dokümantasyon

- [Agent Quick Start](docs/agent-quick-start.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## Maintainer workflow

Open-source repository'nin kendisini maintain ediyorsanız, yerel skill tooling şudur:

```bash
vs skill list
vs skill init viking-demo-skill
vs skill validate
vs skill install all
```

Repository kontrollerini build edip çalıştırın:

```bash
npm install
npm run validate:skills
npm run build
npm run test:acceptance:dist
```

## Katkıda bulunma

Daha fazla ayrıntı için [Contributing](CONTRIBUTING.md) sayfasını inceleyin.

Harici contributors, bir pull request kabul edilmeden önce Contributor License Agreement (CLA) tamamlamalıdır.

## Davranış Kuralları

Daha fazla ayrıntı için [Code of Conduct](CODE_OF_CONDUCT.md) sayfasını inceleyin.

## Güvenlik

Bu projede olası bir güvenlik sorunu keşfederseniz veya keşfetmiş olabileceğinizi düşünüyorsanız, Bytedance Security'yi [security center](https://security.bytedance.com/src) veya [vulnerability reporting email](mailto:sec@bytedance.com) üzerinden bilgilendirmenizi rica ederiz.

Lütfen public GitHub issue oluşturmayın.

## Lisans

Bu proje [Apache-2.0 License](LICENSE) altında lisanslanmıştır.
