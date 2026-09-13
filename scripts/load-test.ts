// Concurrency/load test: fires 1000+ concurrent requests across multiple endpoints
// to verify the platform handles the load without errors.
// Usage: bun run scripts/load-test.ts
const TOTAL_REQUESTS = 1200
const CONCURRENCY = 200  // simultaneous in-flight requests
const BASE = "http://localhost:3000"

const ENDPOINTS = [
  { url: "/api/config", method: "GET" },
  { url: "/api/ads?status=active&limit=50", method: "GET" },
  { url: "/api/stats", method: "GET" },
  { url: "/api/price", method: "GET" },
  { url: "/api/ads/top-rated?limit=6", method: "GET" },
  { url: "/api/side-ads?position=left", method: "GET" },
  { url: "/api/audit?limit=50", method: "GET" },
  { url: "/api/ads?status=all&limit=200", method: "GET" },
]

type Result = { ok: boolean; status: number; ms: number; endpoint: string; error?: string }

async function fireOne(i: number): Promise<Result> {
  const ep = ENDPOINTS[i % ENDPOINTS.length]
  const t0 = Date.now()
  try {
    const res = await fetch(BASE + ep.url, { cache: "no-store", signal: AbortSignal.timeout(15000) })
    const ms = Date.now() - t0
    return { ok: res.ok, status: res.status, ms, endpoint: ep.url }
  } catch (e: any) {
    return { ok: false, status: 0, ms: Date.now() - t0, endpoint: ep.url, error: e?.message ?? "error" }
  }
}

async function run() {
  console.log(`\n🚀 Load test: ${TOTAL_REQUESTS} requests, ${CONCURRENCY} concurrent, across ${ENDPOINTS.length} endpoints`)
  console.log(`   Target: ${BASE}\n`)

  // Warmup (1 request to compile routes)
  await fetch(BASE + "/", { cache: "no-store" }).catch(() => undefined)
  await new Promise((r) => setTimeout(r, 1000))

  const results: Result[] = []
  const t0 = Date.now()

  // Run in batches of CONCURRENCY
  for (let batch = 0; batch < Math.ceil(TOTAL_REQUESTS / CONCURRENCY); batch++) {
    const start = batch * CONCURRENCY
    const end = Math.min(start + CONCURRENCY, TOTAL_REQUESTS)
    const batchResults = await Promise.all(
      Array.from({ length: end - start }, (_, i) => fireOne(start + i))
    )
    results.push(...batchResults)
    process.stdout.write(`\r   batch ${batch + 1}/${Math.ceil(TOTAL_REQUESTS / CONCURRENCY)} — ${results.length}/${TOTAL_REQUESTS} done`)
  }
  console.log("")

  const totalMs = Date.now() - t0
  const ok = results.filter((r) => r.ok)
  const fail = results.filter((r) => !r.ok)
  const byEndpoint: Record<string, { total: number; ok: number; fail: number; avgMs: number; maxMs: number; minMs: number }> = {}
  for (const r of results) {
    const e = byEndpoint[r.endpoint] ??= { total: 0, ok: 0, fail: 0, avgMs: 0, maxMs: 0, minMs: Infinity }
    e.total++
    if (r.ok) e.ok++; else e.fail++
    e.avgMs += r.ms
    e.maxMs = Math.max(e.maxMs, r.ms)
    e.minMs = Math.min(e.minMs, r.ms)
  }
  for (const e of Object.values(byEndpoint)) e.avgMs = e.avgMs / e.total

  console.log(`\n════════════════════════════════════════════════════════════`)
  console.log(`  RESULTADO DEL TEST DE CONCURRENCIA`)
  console.log(`════════════════════════════════════════════════════════════`)
  console.log(`  Total requests:    ${results.length}`)
  console.log(`  Exitosos (2xx):    ${ok.length}  (${(ok.length / results.length * 100).toFixed(1)}%)`)
  console.log(`  Fallidos:          ${fail.length}  (${(fail.length / results.length * 100).toFixed(1)}%)`)
  console.log(`  Tiempo total:      ${totalMs} ms`)
  console.log(`  Throughput:        ${(results.length / (totalMs / 1000)).toFixed(1)} req/s`)
  console.log(`  Latencia media:    ${(ok.reduce((s, r) => s + r.ms, 0) / ok.length).toFixed(0)} ms`)
  console.log(`  Latencia máxima:   ${Math.max(...results.map((r) => r.ms))} ms`)
  console.log(`  Latencia mínima:   ${Math.min(...results.map((r) => r.ms))} ms`)
  console.log(`  Concurrencia:      ${CONCURRENCY} simultáneas`)

  console.log(`\n  Por endpoint:`)
  console.log(`  ${"Endpoint".padEnd(38)} ${"Total".padStart(6)} ${"OK".padStart(6)} ${"Fail".padStart(6)} ${"Avg".padStart(8)} ${"Max".padStart(8)} ${"Min".padStart(8)}`)
  console.log(`  ${"─".repeat(90)}`)
  for (const [url, e] of Object.entries(byEndpoint)) {
    console.log(`  ${url.padEnd(38)} ${String(e.total).padStart(6)} ${String(e.ok).padStart(6)} ${String(e.fail).padStart(6)} ${e.avgMs.toFixed(0).padStart(6)}ms ${e.maxMs.toString().padStart(6)}ms ${e.minMs.toString().padStart(6)}ms`)
  }

  if (fail.length > 0) {
    console.log(`\n  ❌ Errores encontrados:`)
    const byError: Record<string, number> = {}
    for (const f of fail) {
      const key = `${f.status} ${f.endpoint} ${f.error ?? ""}`
      byError[key] = (byError[key] ?? 0) + 1
    }
    for (const [k, v] of Object.entries(byError)) {
      console.log(`     ${v}× ${k}`)
    }
  }

  const passRate = ok.length / results.length
  if (passRate >= 0.99) {
    console.log(`\n  ✅ TEST SUPERADO: ${ok.length}/${results.length} exitosos (${(passRate * 100).toFixed(1)}%). La plataforma aguanta ${CONCURRENCY} concurrentes.`)
  } else if (passRate >= 0.95) {
    console.log(`\n  ⚠️ TEST ACEPTABLE: ${ok.length}/${results.length} exitosos (${(passRate * 100).toFixed(1)}%). Algunos fallos bajo carga alta.`)
  } else {
    console.log(`\n  ❌ TEST FALLIDO: ${ok.length}/${results.length} exitosos (${(passRate * 100).toFixed(1)}%). La plataforma no aguanta ${CONCURRENCY} concurrentes.`)
  }
  console.log(`════════════════════════════════════════════════════════════\n`)

  // Memory check
  const mem = process.memoryUsage()
  console.log(`  Node memory: RSS=${(mem.rss / 1024 / 1024).toFixed(0)}MB heap=${(mem.heapUsed / 1024 / 1024).toFixed(0)}MB/${(mem.heapTotal / 1024 / 1024).toFixed(0)}MB`)
}

run().catch((e) => { console.error(e); process.exit(1) })
