# NextTraffic

แดชบอร์ดจราจรและน้ำท่วมกรุงเทพฯ — กล้อง CCTV สด, ตรวจจับรถด้วย AI ในเบราว์เซอร์, ระดับน้ำจาก ThaiWater, สถิติอุบัติเหตุจาก data.go.th และผู้ช่วยถาม-ตอบที่ขับด้วย Claude

📓 **[งานวิเคราะห์ข้อมูลอุบัติเหตุ 16 ปี](analysis/)** — Jupyter notebook วิเคราะห์ผู้เสียชีวิตบนถนนในกรุงเทพฯ 12,146 ราย (พ.ศ. 2554–2569) แยกเป็นโปรเจกต์ย่อยในโฟลเดอร์ `analysis/`

## Stack

- **Frontend** — React + Vite, React Router, Leaflet, Recharts, Framer Motion
- **กล้องสด** — ดึงรายการกล้องจาก `traffic.longdo.com/camera.json` แล้วเล่น HLS ผ่าน `hls.js`
- **ตรวจจับรถ** — TensorFlow.js + COCO-SSD ทำงานฝั่งเบราว์เซอร์ทั้งหมด (ไม่มีการส่งภาพออกไปที่เซิร์ฟเวอร์)
- **API** — โค้ดชุดเดียวใน `server/lib/` รันได้สองที่: `server/index.js` (dev ในเครื่อง) และ Vercel Functions ใน `api/` (production)

## รันในเครื่อง

```bash
npm install
cp .env.example .env     # แล้วใส่ ANTHROPIC_API_KEY
npm run api              # API server ที่ http://127.0.0.1:8787
npm run dev              # Vite dev server (proxy /api ไปที่ 8787)
```

| สคริปต์ | ทำอะไร |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run api` | API server สำหรับ dev (`server/index.js`) |
| `npm run build` | `tsc` + `vite build` → `dist/` |
| `npm run snapshot` | ดึงข้อมูลอุบัติเหตุจาก data.go.th มาเก็บเป็น `server/data/accidents-snapshot.js` (ดูหัวข้อ Deploy) |
| `npm run preview` | เสิร์ฟ `dist/` เพื่อตรวจก่อน deploy |

หน้า "ถาม AI" ใช้ได้เฉพาะเมื่อมี `ANTHROPIC_API_KEY` ถ้ายังไม่ได้ตั้ง หน้าเว็บจะขึ้นวิธีตั้งค่าให้ แทนที่จะพัง

## API

| Endpoint | ไฟล์ dev | ไฟล์ production | หมายเหตุ |
| --- | --- | --- | --- |
| `GET /api/health` | `server/index.js` | `api/health.js` | บอกว่ามี API key หรือยัง |
| `POST /api/ask` | `server/index.js` | `api/ask.js` | stream คำตอบเป็น SSE ทีละ token |
| `GET /api/water` | `server/index.js` | `api/water.js` | ระดับน้ำจาก ThaiWater (สสน.) |
| `GET /api/accidents` | `server/index.js` | `api/accidents.js` | ผู้เสียชีวิตจากอุบัติเหตุทางถนน (RTDDI, กรมควบคุมโรค) |

ตรรกะทั้งหมด (system prompt, การตรวจ input, rate limit, การเรียก Claude, การดึงข้อมูลภายนอก) อยู่ใน `server/lib/` และ `server/sources/` ทั้ง dev และ production import ชุดเดียวกัน จึงไม่มีโค้ดสองชุดที่ต้องแก้ตามกัน

### ขอบเขตที่ตั้งไว้ที่ `/api/ask`

| ขอบเขต | ค่า | ตั้งที่ |
| --- | --- | --- |
| จำนวนคำถามต่อ IP | 10 ครั้ง / 10 นาที | `server/lib/ratelimit.js` |
| ความยาวคำถาม | 2,000 ตัวอักษร (เกินนั้นตอบ 413) | `MAX_QUESTION_CHARS` |
| จำนวน turn ที่ส่งกลับไป | 20 turn ล่าสุด, turn ละไม่เกิน 2,000 ตัวอักษร | `MAX_TURNS`, `MAX_MESSAGE_CHARS` |
| ขนาด request body | 200 KB | `MAX_BODY_BYTES` |
| ข้อมูลประกอบ (context) | 60,000 ตัวอักษร | `MAX_CONTEXT_CHARS` |
| `max_tokens` ของคำตอบ | 2,000 (ตั้งใหม่ได้ด้วย env `ASK_MAX_TOKENS`) | `MAX_OUTPUT_TOKENS` |

> **ข้อจำกัดของ rate limit แบบ in-memory:** ตัวนับอยู่ในหน่วยความจำของ function instance แต่ละตัว Vercel รันหลาย instance ขนานกันและรีไซเคิลทิ้งเรื่อย ๆ เพดานจริงจึงประมาณ 10 × จำนวน instance ที่ยังมีชีวิต และ instance ที่เพิ่งเกิดใหม่จะเริ่มนับผู้ใช้คนเดิมจากศูนย์ มันกันคนกดส่งรัว ๆ ได้ แต่ไม่ใช่เพดานค่าใช้จ่ายจริง
>
> ถ้าต้องการเพดานจริง ให้ย้ายตัวนับไปเก็บที่ store กลาง เช่น Upstash Redis (`@upstash/ratelimit` + Vercel Marketplace integration ซึ่งตั้ง `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` ให้เอง) แล้วแทนที่ `checkRateLimit()` ใน `server/lib/ratelimit.js` ด้วยการเรียก `limiter.limit(ip)` — interface เหมือนกัน (คืนค่าผ่าน/ไม่ผ่าน + เวลารอ) จึงแก้ที่ไฟล์เดียว ตอนนี้ยังไม่ได้ติดตั้ง

## Deploy (Vercel)

1. **Import repo** ที่ [vercel.com/new](https://vercel.com/new) — `vercel.json` กำหนด framework (`vite`), output (`dist`), max duration ของแต่ละ function และ SPA rewrite ไว้แล้ว ไม่ต้องตั้งอะไรเพิ่มในหน้า build settings
2. **ตั้ง Environment Variables** ที่ Project Settings → Environment Variables

   | ชื่อ | จำเป็น | ใส่ที่ environment | หมายเหตุ |
   | --- | --- | --- | --- |
   | `ANTHROPIC_API_KEY` | ✅ ใช่ | Production + Preview | key จาก [Anthropic Console](https://console.anthropic.com/settings/keys) ถ้าไม่ตั้ง หน้าอื่นยังใช้ได้ปกติ แต่ `/api/ask` จะตอบ 503 พร้อมข้อความบอกวิธีแก้ |
   | `ASK_MAX_TOKENS` | ไม่ | Production | เพดาน output token ต่อคำตอบ (default 2000) |

   `API_PORT` ใช้แค่ตอนรันในเครื่อง ไม่ต้องตั้งบน Vercel
3. **Deploy** แล้วเปิด `/ask-ai` เพื่อเช็กว่า `/api/health` ตอบ `hasCredential: true`
4. ถ้าเพิ่งเพิ่มหรือแก้ env var ต้อง **redeploy** ก่อน ค่าใหม่จึงมีผล

### ⚠️ ตั้งวงเงินก่อนเปิดให้คนอื่นใช้

เว็บ public + `/api/ask` = ทุกคนที่เจอลิงก์ยิง Claude API ด้วย key ของคุณได้ **ก่อนแชร์ลิงก์ ให้ตั้งวงเงินรายเดือนใน [Anthropic Console → Billing → Spend limits](https://console.anthropic.com/settings/limits)** และเปิดการแจ้งเตือนเมื่อใช้ถึงเกณฑ์ที่ตั้งไว้ rate limit ในโค้ดเป็นแค่ด่านแรก (ดูข้อจำกัดด้านบน) วงเงินที่ Console เป็นเพดานจริงเพียงอันเดียว

แนะนำเพิ่ม: ออก API key แยกสำหรับ demo ตัวนี้ (เพิกถอนได้โดยไม่กระทบที่อื่น) และตั้ง [Spend Management](https://vercel.com/docs/spend-management) ของ Vercel ไว้ด้วย

### หมายเหตุเรื่องข้อมูลภายนอกบน production

- `camera.json` ของ Longdo และ stream HLS ของ ITIC เสิร์ฟผ่าน **https** ทั้งหมด และตอบ `Access-Control-Allow-Origin: *` จึงเล่นได้จากหน้าเว็บ https ตรง ๆ โดยไม่ต้อง proxy และไม่ติด mixed content
- `/api/accidents` ดึงจาก data.go.th ซึ่งช้า (ปกติ 5-30 วินาที และบางครั้งตอบ 502) จึงตั้ง `maxDuration: 120` และใส่ `s-maxage=21600` ให้ CDN ของ Vercel แคชไว้ 6 ชั่วโมง — cold start ตัวแรกจะช้า ที่เหลือเร็ว เช่นเดียวกับ `/api/water` ที่แคช 10 นาที
- **data.go.th ปฏิเสธคำขอจาก Vercel** ทดสอบแล้วทั้ง `iad1` (สหรัฐ) และ `sin1` (สิงคโปร์) ตอบ 4xx กลับมาภายใน 0.3 วินาที ขณะที่ endpoint เดียวกันเรียกได้ปกติจากเครื่องในไทยและจาก datacenter ที่ไม่ใช่ AWS — น่าจะบล็อกที่ระดับ IP range ของ AWS ซึ่ง Vercel ใช้ทั้งตอนรัน function และตอน build

  ทางออกคือ `server/data/accidents-snapshot.js` ที่ commit ไว้ใน repo `getAccidentsOrSnapshot()` จะลองเรียก API จริงก่อนเสมอ ถ้าไม่ได้จึงใช้ snapshot พร้อมตั้ง `stale: true` ให้หน้าเว็บขึ้นว่า *"ใช้ข้อมูลเก่า ดึงใหม่ไม่สำเร็จ"* — เป็นตัวเลขจริงจากชุดข้อมูลเดียวกัน ไม่ใช่ข้อมูลจำลอง

  ชุดข้อมูลนี้ออกเป็นรายเดือนและล่าช้าหลายเดือนอยู่แล้ว (ล่าสุดถึง 31 มี.ค. 2026) รีเฟรชปีละไม่กี่ครั้งก็พอ: รัน `npm run snapshot` **จากเครือข่ายในไทย** แล้ว commit ไฟล์ที่ได้
- `regions: ["sin1"]` ใน `vercel.json` ไม่ได้ช่วยเรื่อง data.go.th แต่คงไว้เพราะ ThaiWater กับ Longdo อยู่ในไทย รันที่สิงคโปร์จึง latency ต่ำกว่า `iad1`
- in-memory cache ใน `server/sources/http.js` ยังทำงาน แต่ช่วยได้เฉพาะ instance ที่ยัง warm อยู่ ตัวที่ทำให้ production เร็วจริงคือ CDN cache

## แหล่งข้อมูล

- กล้อง CCTV — [Longdo Traffic](https://traffic.longdo.com/) / ITIC Foundation
- ระดับน้ำ — [ThaiWater](https://www.thaiwater.net/) (สสน.)
- อุบัติเหตุทางถนน — [data.go.th](https://data.go.th/) ชุดข้อมูล RTDDI (กรมควบคุมโรค)

ภาพรวมจราจรรายถนนและการแจ้งเตือนบางส่วนในแอปยังเป็น**ข้อมูลจำลอง** สำหรับต้นแบบ (ระบุไว้ในหน้าเว็บและใน system prompt ของ AI แล้ว)
