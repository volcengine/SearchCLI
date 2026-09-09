<p align="center">
  <img src="docs/assets/searchcli-logo.svg" alt="SearchCLI logo" width="560" />
</p>

# SearchCLI

[English](README.md) | [简体中文](README.zh_CN.md) | [日本語](README.ja_JP.md) | [Deutsch](README.de_DE.md) | [한국어](README.ko_KR.md) | [Français](README.fr_FR.md) | [Русский](README.ru_RU.md) | [Italiano](README.it_IT.md) | [Español](README.es_ES.md) | [Português](README.pt_BR.md) | [Türkçe](README.tr_TR.md) | ไทย | [Bahasa Indonesia](README.id_ID.md)

เชื่อมต่อการค้นหาที่เสถียรและปรับแต่งได้ คำแนะนำ และการค้นคืนแบบสนทนาเข้ากับระบบ Agent หรือระบบธุรกิจของคุณ

[ชุมชน](#ชุมชน) · [เริ่มต้นอย่างรวดเร็ว (นักพัฒนา)](#เริ่มต้นอย่างรวดเร็วนักพัฒนา) · [ตั้งค่า AI Agent](#เริ่มต้นอย่างรวดเร็ว-ai-agents) · [คู่มือ Agent ฉบับเต็ม](docs/agent-quick-start.md) · [การมีส่วนร่วม](CONTRIBUTING.md) · [ความปลอดภัย](SECURITY.md)

SearchCLI คือ CLI แบบเปิดสำหรับ AI Search on Volcengine

หากระบบ Agent หรือระบบธุรกิจของคุณต้องการบริการกระจายข้อมูลที่เสถียรและปรับแต่งได้ SearchCLI มอบเส้นทางที่ใช้งานได้จริงในการผสานความสามารถด้านการค้นหา คำแนะนำ และการค้นคืนแบบสนทนาระดับ production เข้ากับ workflow จริง

เมื่อใช้ SearchCLI ร่วมกับ `Viking skills` ที่ติดตั้งได้ Agents ภายนอกสามารถ onboarding ข้อมูล สร้างและตรวจสอบ flow การค้นหาและคำแนะนำ เรียกใช้การค้นคืนแบบสนทนา ปรับแต่งการตั้งค่ากลยุทธ์ ตรวจสอบ bad cases และปรับปรุงคุณภาพ retrieval ได้อย่างเสถียรและตรวจสอบได้

## ชุมชน

<p align="center">
  <strong>เข้าร่วมกลุ่มผู้ใช้ SearchCLI บน WeChat</strong><br />
  สแกน QR code ด้านล่างด้วย WeChat เพื่อพูดคุยกับผู้ใช้และผู้ดูแลโครงการ<br />
  <sub>QR code จะได้รับการอัปเดตเป็นระยะ หากหมดอายุแล้ว โปรดกลับมาตรวจสอบเวอร์ชันล่าสุด</sub>
</p>

<p align="center">
  <a href="docs/assets/wechat-group-qr.jpg">
    <img src="docs/assets/wechat-group-qr.jpg" alt="QR code กลุ่มผู้ใช้ SearchCLI บน WeChat" width="320" />
  </a>
</p>

## SearchCLI คืออะไร

- พื้นผิวการผสานผ่าน command line สำหรับ AI Search on Volcengine
- เส้นทางที่เสถียรสำหรับระบบภายนอกในการเข้าถึงความสามารถด้านการค้นหา คำแนะนำ และการค้นคืนแบบสนทนา
- ชั้น workflow ที่เป็นมิตรกับ Agent สร้างขึ้นจาก skills ที่ติดตั้งได้และ output ของคำสั่งที่ปลอดภัยต่อ automation
- โมเดลการทำงานที่ตรวจสอบได้ พร้อม dry-run จุดยืนยัน และการตรวจสอบแบบ read-after-write

## เหมาะสำหรับใคร

- นักพัฒนาที่ผสานการกระจายข้อมูลที่ขับเคลื่อนด้วย AI เข้ากับระบบธุรกิจ
- ทีมที่สร้างระบบ Agent และต้องการ workflow สำหรับการค้นหา คำแนะนำ และ retrieval ที่เสถียรและกำหนดค่าได้
- ทีม operations, delivery และ solution ที่ต้องการวิธีที่ตรวจสอบได้สำหรับ onboarding ข้อมูล กำหนดค่าแอปพลิเคชัน และตรวจสอบพฤติกรรม runtime ก่อนใช้งานจริง

## สิ่งที่ทำได้

- ค้นหา item และ catalog บนข้อมูลธุรกิจแบบมีโครงสร้าง
- flow คำแนะนำที่เชื่อมต่อกับ scene ของแอปพลิเคชันและพฤติกรรมผู้ใช้
- ประสบการณ์การค้นคืนแบบสนทนาที่อ้างอิงจากการค้นหาของแอปพลิเคชัน
- workflow สำหรับ Agent ที่สามารถ onboarding ข้อมูล กำหนดค่าแอปพลิเคชัน และตรวจสอบพฤติกรรม runtime ด้วยขั้นตอน review ที่ชัดเจน

## ความสามารถหลัก

- `vs app`, `vs dataset` และ `vs data` สำหรับจัดการแอปพลิเคชันและ dataset
- `vs search run`, `vs recommend run` และ `vs chat run` สำหรับตรวจสอบ runtime
- `vs search tune query-generate | plan | run | report` สำหรับการประเมินและปรับแต่ง text similarity อัตโนมัติในเวอร์ชันแรก
- `Viking skills` ที่ติดตั้งได้ เพื่อให้ Agents ภายนอกใช้ workflow เดียวกัน

## ข้อกำหนด

- Node.js 20 หรือใหม่กว่า
- `git`
- Volcengine AK/SK ที่มีสิทธิ์เข้าถึง AI Search

## เริ่มต้นอย่างรวดเร็ว (นักพัฒนา)

### 1. ติดตั้ง

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. ยืนยันตัวตน

หาก shell ปัจจุบันมี `VIKING_AK` และ `VIKING_SK` อยู่แล้ว:

```bash
vs auth import-env
vs auth status --json
vs doctor --json
```

มิฉะนั้น ให้รัน interactive login ใน terminal จริง:

```bash
vs auth login
```

หากคุณจะใช้การสร้าง query สำหรับ search tuning หรือการตัดสิน relevance ด้วย LLM ให้กำหนดค่า OpenAI-compatible LLM API โดยไม่ใส่ API key เป็น plain text ใน config:

```bash
vs llm login
vs llm status --json
vs search tune llm-check --live --json
```

หาก shell ปัจจุบันมี `VIKING_LLM_BASE_URL`, `VIKING_LLM_API_KEY` และ `VIKING_LLM_MODEL` อยู่แล้ว ให้ใช้ `vs llm import-env` แทนได้ API key จะถูกเก็บใน local secure credential store ส่วน base URL และ model จะถูกเก็บเป็น config ที่ไม่ใช่ความลับ

### 3. รัน onboarding flow แรก

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

หากคุณต้องการเพียง dataset (ไม่ต้อง app) ให้หยุดหลังจาก `vs data write`

สำหรับ dataset เหตุการณ์ของผู้ใช้ ให้ใช้ `--type user_event` และละ `--theme`

## เริ่มต้นอย่างรวดเร็ว (AI Agents)

หาก Agent ภายนอกต้องใช้งาน AI Search ผ่าน repository นี้:

### 1. ติดตั้ง SearchCLI

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. ติดตั้ง Viking skills

```bash
npx skills add "git@github.com:volcengine/SearchCLI.git" -y -g
```

public skill bundle เริ่มต้นประกอบด้วย:

- `vs-shared`
- `vs-item-onboarding`
- `vs-search`
- `vs-search-tuning`
- `vs-chat`
- `vs-recommend`

### 3. ยืนยันตัวตน

หาก shell ปัจจุบันมี `VIKING_AK` และ `VIKING_SK` อยู่แล้ว แนะนำให้ใช้:

```bash
vs auth import-env
```

มิฉะนั้น:

```bash
vs auth login
```

### 4. ตรวจสอบ

```bash
vs --help
vs auth status --json
vs llm status --json
vs doctor --json
vs skill list
```

## กลุ่มคำสั่งสาธารณะ

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

## เอกสาร

- [Agent Quick Start](docs/agent-quick-start.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## Workflow สำหรับ maintainer

หากคุณดูแล open-source repository นี้เอง local skill tooling คือ:

```bash
vs skill list
vs skill init viking-demo-skill
vs skill validate
vs skill install all
```

Build และรัน repository checks:

```bash
npm install
npm run validate:skills
npm run build
npm run test:acceptance:dist
```

## การมีส่วนร่วม

ดูรายละเอียดเพิ่มเติมได้ที่ [Contributing](CONTRIBUTING.md)

ผู้มีส่วนร่วมภายนอกต้องทำ Contributor License Agreement (CLA) ให้เสร็จก่อน pull request จะได้รับการยอมรับ

## จรรยาบรรณ

ดูรายละเอียดเพิ่มเติมได้ที่ [Code of Conduct](CODE_OF_CONDUCT.md)

## ความปลอดภัย

หากคุณพบปัญหาด้านความปลอดภัยที่อาจเกิดขึ้นในโปรเจกต์นี้ หรือคิดว่าอาจพบปัญหาด้านความปลอดภัย โปรดแจ้ง Bytedance Security ผ่าน [security center](https://security.bytedance.com/src) หรือ [vulnerability reporting email](mailto:sec@bytedance.com)

โปรดอย่าสร้าง public GitHub issue

## License

โปรเจกต์นี้อยู่ภายใต้ [Apache-2.0 License](LICENSE)
