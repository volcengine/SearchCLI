<p align="center">
  <img src="docs/assets/searchcli-logo.svg" alt="SearchCLI logo" width="560" />
</p>

# SearchCLI

[English](README.md) | [简体中文](README.zh_CN.md) | [日本語](README.ja_JP.md) | [Deutsch](README.de_DE.md) | [한국어](README.ko_KR.md) | [Français](README.fr_FR.md) | [Русский](README.ru_RU.md) | [Italiano](README.it_IT.md) | [Español](README.es_ES.md) | Português | [Türkçe](README.tr_TR.md) | [ไทย](README.th_TH.md) | [Bahasa Indonesia](README.id_ID.md)

Conecte busca estável e ajustável, recomendações e retrieval conversacional ao seu sistema Agent ou sistema de negócios.

[Comunidade](#comunidade) · [Início rápido (desenvolvedores)](#início-rápido-desenvolvedores) · [Configuração de AI Agent](#início-rápido-ai-agents) · [Guia completo para Agent](docs/agent-quick-start.md) · [Contribuição](CONTRIBUTING.md) · [Segurança](SECURITY.md)

SearchCLI é a CLI aberta para AI Search on Volcengine.

Se o seu sistema Agent ou sistema de negócios precisa de serviços de distribuição de informações estáveis e ajustáveis, SearchCLI oferece um caminho prático para integrar busca, recomendações e retrieval conversacional de nível production em workflows reais.

Com SearchCLI e seus `Viking skills` instaláveis, Agents externos podem fazer onboarding de dados, criar e validar fluxos de busca e recomendação, executar retrieval conversacional, ajustar configurações de estratégia, investigar bad cases e iterar sobre a qualidade do retrieval de forma estável e verificável.

## Comunidade

<p align="center">
  <strong>Participe do grupo de usuários do SearchCLI no WeChat</strong><br />
  Escaneie o código QR abaixo com o WeChat para conversar com usuários e mantenedores.<br />
  <sub>O código QR é atualizado periodicamente. Se estiver expirado, volte para consultar a versão mais recente.</sub>
</p>

<p align="center">
  <a href="docs/assets/wechat-group-qr.jpg">
    <img src="docs/assets/wechat-group-qr.jpg" alt="Código QR do grupo de usuários do SearchCLI no WeChat" width="320" />
  </a>
</p>

## O que é SearchCLI

- A superfície de integração por linha de comando para AI Search on Volcengine.
- Um caminho estável para sistemas externos acessarem recursos de busca, recomendação e retrieval conversacional.
- Uma camada de workflow amigável para Agents, construída em torno de skills instaláveis e saída de comandos segura para automação.
- Um modelo de execução revisável com dry-runs, pontos de confirmação e verificação read-after-write.

## Para quem é

- Desenvolvedores que integram distribuição de informações baseada em AI a sistemas de negócios.
- Equipes que constroem sistemas Agent e precisam de workflows de busca, recomendação e retrieval estáveis e configuráveis.
- Equipes de operações, delivery e soluções que precisam de uma forma revisável de fazer onboarding de dados, configurar aplicações e verificar o comportamento runtime antes do uso em produção.

## O que ele permite

- Busca de items e catálogos sobre dados de negócios estruturados.
- Fluxos de recomendação conectados a cenas da aplicação e ao comportamento dos usuários.
- Experiências de retrieval conversacional fundamentadas na busca da aplicação.
- Workflows Agent que podem fazer onboarding de dados, configurar aplicações e validar o comportamento runtime com etapas explícitas de revisão.

## Recursos principais

- `vs app`, `vs dataset` e `vs data` para gerenciamento de aplicações e datasets.
- `vs search run`, `vs recommend run` e `vs chat run` para verificação runtime.
- `vs search tune query-generate | plan | run | report` para uma primeira versão de avaliação e ajuste automatizados de similaridade textual.
- `Viking skills` instaláveis para que Agents externos possam usar os mesmos workflows.

## Requisitos

- Node.js 20 ou posterior
- `git`
- Volcengine AK/SK com acesso a AI Search

## Início rápido (desenvolvedores)

### 1. Instalar

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. Autenticar

Se o shell atual já tiver `VIKING_AK` e `VIKING_SK`:

```bash
vs auth import-env
vs auth status --json
vs doctor --json
```

Caso contrário, execute o login interativo em um terminal real:

```bash
vs auth login
```

Se você for usar geração de consultas para search tuning ou avaliação de relevância por LLM, configure uma API LLM compatível com OpenAI sem colocar a API key em texto claro na configuração:

```bash
vs llm login
vs llm status --json
vs search tune llm-check --live --json
```

Se o shell atual já tiver `VIKING_LLM_BASE_URL`, `VIKING_LLM_API_KEY` e `VIKING_LLM_MODEL`, você pode usar `vs llm import-env` em vez disso. A API key é armazenada no armazenamento local seguro de credenciais; base URL e model são armazenados como configuração não secreta.

### 3. Executar o primeiro fluxo de onboarding

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

Se você precisar apenas de um dataset (sem app), pare após `vs data write`.

Para datasets de eventos de usuário, use `--type user_event` e omita `--theme`.

## Início rápido (AI Agents)

Se um Agent externo precisa operar AI Search por meio deste repositório:

### 1. Instalar SearchCLI

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. Instalar Viking skills

```bash
npx skills add "git@github.com:volcengine/SearchCLI.git" -y -g
```

O pacote público padrão de skills inclui:

- `vs-shared`
- `vs-item-onboarding`
- `vs-search`
- `vs-search-tuning`
- `vs-chat`
- `vs-recommend`

### 3. Autenticar

Se o shell atual já tiver `VIKING_AK` e `VIKING_SK`, prefira:

```bash
vs auth import-env
```

Caso contrário:

```bash
vs auth login
```

### 4. Verificar

```bash
vs --help
vs auth status --json
vs llm status --json
vs doctor --json
vs skill list
```

## Grupos de comandos públicos

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

## Documentação

- [Agent Quick Start](docs/agent-quick-start.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## Workflow de manutenção

Se você mantém o repositório open-source, o tooling local de skills é:

```bash
vs skill list
vs skill init viking-demo-skill
vs skill validate
vs skill install all
```

Compile e execute as verificações do repositório:

```bash
npm install
npm run validate:skills
npm run build
npm run test:acceptance:dist
```

## Contribuição

Consulte [Contributing](CONTRIBUTING.md) para mais detalhes.

Contribuidores externos devem concluir o Contributor License Agreement (CLA) antes que uma pull request possa ser aceita.

## Código de Conduta

Consulte [Code of Conduct](CODE_OF_CONDUCT.md) para mais detalhes.

## Segurança

Se você descobrir um possível problema de segurança neste projeto, ou achar que descobriu um problema de segurança, pedimos que notifique a Bytedance Security pelo nosso [security center](https://security.bytedance.com/src) ou pelo [vulnerability reporting email](mailto:sec@bytedance.com).

Não crie uma issue pública no GitHub.

## Licença

Este projeto é licenciado sob a [Apache-2.0 License](LICENSE).
