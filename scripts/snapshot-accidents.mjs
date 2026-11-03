// Writes server/data/accidents-snapshot.js from the live data.go.th API.
//
// Run this from a network data.go.th actually answers (in Thailand it responds
// in a few seconds). Vercel's functions and its build step both run on AWS,
// whose address ranges data.go.th refuses within a fraction of a second, so
// production serves this committed file instead of calling the API itself.
//
//   npm run snapshot
//
// The dataset is published monthly, so refreshing it a few times a year is
// enough; commit the regenerated file like any other change.
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getAccidents } from '../server/sources/accidents.js'

const here = dirname(fileURLToPath(import.meta.url))
const outFile = join(here, '..', 'server', 'data', 'accidents-snapshot.js')

console.log('กำลังดึงข้อมูลจาก data.go.th (อาจใช้เวลา 5-30 วินาที)…')
const started = Date.now()

let data
try {
  data = await getAccidents()
} catch (err) {
  console.error('\nดึงข้อมูลไม่สำเร็จ:', err?.message)
  console.error('ถ้าอยู่นอกประเทศไทยหรืออยู่บน VPN/คลาวด์ data.go.th อาจปฏิเสธคำขอ ลองใหม่จากเครือข่ายปกติ')
  process.exit(1)
}

const payload = { ...data, stale: undefined }
const body = `// GENERATED FILE — สร้างด้วย \`npm run snapshot\` อย่าแก้ด้วยมือ
// ข้อมูลผู้เสียชีวิตจากอุบัติเหตุทางถนน (RTDDI) ของกรมควบคุมโรค ผ่าน data.go.th
// ดึงเมื่อ: ${payload.fetchedAt}
// ข้อมูลถึง: ${payload.dataThrough}
export default ${JSON.stringify(payload, null, 2)}
`

await mkdir(dirname(outFile), { recursive: true })
await writeFile(outFile, body, 'utf8')

console.log(`\nเขียนไฟล์แล้ว: server/data/accidents-snapshot.js (${(body.length / 1024).toFixed(0)} KB, ใช้เวลา ${((Date.now() - started) / 1000).toFixed(1)} วินาที)`)
console.log(`  ปี ${payload.year} · ${payload.total} ราย · ข้อมูลถึง ${payload.dataThrough}`)
console.log('\nอย่าลืม commit ไฟล์นี้ แล้ว push เพื่อให้ production ใช้ข้อมูลชุดใหม่')
