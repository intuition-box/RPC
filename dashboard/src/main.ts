import './style.css'

const POLL_INTERVAL = 2000
const LERP_INTERVAL = 50
const PHASES = ['downloading', 'extracting', 'starting', 'scanning', 'syncing', 'synced'] as const

type Phase = typeof PHASES[number] | 'installing' | 'error'

interface Status {
  phase: Phase
  progress?: number
  downloadedBytes?: number
  totalBytes?: number
  localBlock?: number
  officialBlock?: number
  blockDiff?: number
  blocksPerMinute?: number
  currentBatch?: number
  totalBatches?: number
  knownBatches?: number
  scanProgress?: number
  scanStep?: 'assertions' | 'batches' | 'starting'
  assertionNode?: number
  totalAssertions?: number
  assertionProgress?: number
  message?: string
  updatedAt?: string
}

let status: Status = { phase: 'installing' }
let lastPhase: Phase | null = null

// Download animation state
let displayBytes = 0
let targetBytes = 0
let totalBytesVal = 0
let lerpHandle = 0
let prevBytes = 0
let prevTime = 0
let bytesPerSec = 0

const OFFICIAL_HTTP = 'https://rpc.intuition.systems/http'
const OFFICIAL_WS = 'wss://rpc.intuition.systems/ws'

function getReplicaHTTP(): string {
  return `${location.origin}/http`
}

function getReplicaWS(): string {
  return `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`
}

async function fetchStatus(): Promise<Status> {
  const res = await fetch('/api/status')
  return res.json()
}

function fmt(n: number | undefined): string {
  if (n === undefined || n === null) return '\u2014'
  return n.toLocaleString('en-US')
}

function hex(n: number | undefined): string {
  if (n === undefined || n === null) return ''
  return '0x' + n.toString(16)
}

function copyToClipboard(text: string, btnId: string) {
  navigator.clipboard.writeText(text)
  const btn = document.getElementById(btnId)
  if (btn) {
    btn.textContent = 'copied'
    btn.classList.add('copied')
    setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('copied') }, 1500)
  }
}

function fmtDuration(secs: number): string {
  if (secs < 60) return `${secs}s`
  const m = Math.floor(secs / 60)
  const s = secs % 60
  if (m < 60) return `${m}min ${s.toString().padStart(2, '0')}s`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return `${h}h ${rm.toString().padStart(2, '0')}min`
}

// --- Live view (synced/syncing) ---

function liveHTML(s: Status): string {
  const isSynced = s.phase === 'synced'
  const dotClass = isSynced ? 'live' : 'syncing'
  const label = isSynced ? 'Live' : 'Syncing'
  const diffClass = (s.blockDiff ?? 0) === 0 ? 'zero' : ''

  return `
    <div class="status-line">
      <div class="status-dot ${dotClass}"></div>
      ${label}
    </div>

    <div class="section-label">Replica</div>
    <div class="endpoints">
      <div class="endpoint-row">
        <span class="ep-label">RPC (HTTP)</span>
        <span class="ep-url" id="replica-http">${getReplicaHTTP()}</span>
        <button class="ep-copy" id="copy-replica-http">copy</button>
      </div>
      <div class="endpoint-row">
        <span class="ep-label">RPC (WS)</span>
        <span class="ep-url" id="replica-ws">${getReplicaWS()}</span>
        <button class="ep-copy" id="copy-replica-ws">copy</button>
      </div>
    </div>

    <div class="section-label">Official</div>
    <div class="endpoints">
      <div class="endpoint-row">
        <span class="ep-label">RPC (HTTP)</span>
        <span class="ep-url">${OFFICIAL_HTTP}</span>
        <button class="ep-copy" id="copy-official-http">copy</button>
      </div>
      <div class="endpoint-row">
        <span class="ep-label">RPC (WS)</span>
        <span class="ep-url">${OFFICIAL_WS}</span>
        <button class="ep-copy" id="copy-official-ws">copy</button>
      </div>
    </div>

    <div class="block-info">
      <div class="block-row">
        <span class="bl-label">Block</span>
        <span>
          <span class="bl-value">${fmt(s.localBlock)}</span>
          <span class="bl-hex">${hex(s.localBlock)}</span>
        </span>
      </div>
      <div class="block-row diff">
        <span class="bl-label">Diff</span>
        <span class="bl-value ${diffClass}">${fmt(s.blockDiff)}</span>
      </div>
    </div>
  `
}

// --- Setup views (downloading, extracting, starting, scanning) ---

function stepperHTML(current: Phase): string {
  const steps = PHASES
  let passedCurrent = false

  return `<div class="stepper">${steps.map((step, i) => {
    let cls = ''
    if (step === current) {
      cls = current === 'synced' ? 'done' : 'active'
      passedCurrent = true
    } else if (!passedCurrent) {
      cls = 'done'
    }

    const line = i < steps.length - 1
      ? `<div class="step-line ${!passedCurrent || step === current ? 'done' : ''}"></div>`
      : ''

    return `<div class="step ${cls}"><div class="dot"></div><div class="label">${step}</div></div>${line}`
  }).join('')}</div>`
}

function downloadingHTML(): string {
  return `
    <div class="phase-title">Downloading snapshot</div>
    <div class="progress-bar-wrapper" id="dl-progress">
      <div class="progress-bar"><div class="fill" style="width: 0%"></div></div>
      <div class="progress-info">
        <span class="dl-size">0.00 / 0.0 GB</span>
        <span class="dl-pct">0.0%</span>
      </div>
    </div>
    <div class="dl-eta" id="dl-eta"></div>
  `
}

function scanningHTML(s: Status): string {
  const current = s.currentBatch ?? 0
  const total = s.totalBatches ?? 0
  const known = s.knownBatches ?? 0
  const pct = s.scanProgress ?? 0
  const step = s.scanStep ?? 'starting'

  let content = ''

  if (step === 'assertions') {
    const aNode = s.assertionNode ?? 0
    const aTotal = s.totalAssertions ?? 0
    const aPct = s.assertionProgress ?? 0
    content = aTotal > 0
      ? `<div class="phase-title">Validating assertions</div>
         <div class="progress-bar-wrapper">
           <div class="progress-bar"><div class="fill" style="width: ${aPct}%"></div></div>
           <div class="progress-info"><span>${fmt(aNode)} / ${fmt(aTotal)}</span><span>${aPct}%</span></div>
         </div>`
      : `<div class="spinner"></div><div class="phase-title">Validating assertions</div>
         <div class="phase-message">${aNode > 0 ? `Assertion ${fmt(aNode)}...` : ''}</div>`
  } else if (step === 'batches' && total > 0) {
    content = `
      <div class="phase-title">Scanning batches</div>
      <div class="scan-explain">${known > 0 ? `Snapshot has ${fmt(known)} batches, scanning ${fmt(total - known)} new.` : ''}</div>
      <div class="progress-bar-wrapper">
        <div class="progress-bar"><div class="fill" style="width: ${pct}%"></div></div>
        <div class="progress-info"><span>${fmt(current)} / ${fmt(total)}</span><span>${pct}%</span></div>
      </div>`
  } else {
    content = `<div class="spinner"></div><div class="phase-title">Scanning chain data</div>`
  }

  return `${content}<div class="scan-blocks">Block ${fmt(s.localBlock)} / ${fmt(s.officialBlock)}</div>`
}

function setupContent(s: Status): string {
  switch (s.phase) {
    case 'installing': return `<div class="spinner"></div><div class="phase-title">Initializing</div>`
    case 'downloading': return downloadingHTML()
    case 'extracting': return `<div class="spinner"></div><div class="phase-title">Extracting snapshot</div><div class="phase-message">This may take a few minutes</div>`
    case 'starting': return `<div class="spinner"></div><div class="phase-title">Starting node</div><div class="phase-message">${s.message || ''}</div>`
    case 'scanning': return scanningHTML(s)
    case 'error': return `<div class="phase-title">Error</div><div class="phase-message">${s.message || ''}</div>`
    default: return `<div class="spinner"></div><div class="phase-title">${s.phase}</div>`
  }
}

// --- Render ---

function isLive(): boolean {
  return status.phase === 'synced' || status.phase === 'syncing'
}

function render() {
  const time = status.updatedAt ? new Date(status.updatedAt).toLocaleTimeString() : ''

  if (lastPhase !== status.phase) {
    lastPhase = status.phase
    const app = document.querySelector<HTMLDivElement>('#app')!

    if (isLive()) {
      app.innerHTML = `
        <header>
          <h1>Intuition RPC</h1>
          <div class="badge">Chain 1155</div>
        </header>
        <div id="live-content">${liveHTML(status)}</div>
        <div class="footer">Updated <span id="update-time">${time}</span></div>
      `
    } else {
      const activePhase = status.phase === 'installing' ? 'downloading' : status.phase
      app.innerHTML = `
        <header>
          <h1>Intuition RPC</h1>
          <div class="badge">Chain 1155</div>
        </header>
        ${stepperHTML(activePhase as Phase)}
        <div class="phase-content">${setupContent(status)}</div>
        <div class="footer">Updated <span id="update-time">${time}</span></div>
      `
    }
  }

  // In-place updates
  const timeEl = document.getElementById('update-time')
  if (timeEl) timeEl.textContent = time

  if (isLive()) {
    const liveEl = document.getElementById('live-content')
    if (liveEl) liveEl.innerHTML = liveHTML(status)
  } else if (status.phase === 'scanning') {
    const phaseEl = document.querySelector('.phase-content')
    if (phaseEl) phaseEl.innerHTML = scanningHTML(status)
  }

  // Download animation
  if (status.phase === 'downloading') {
    const newBytes = status.downloadedBytes ?? 0
    const now = Date.now()
    if (prevTime > 0 && newBytes > prevBytes) {
      const elapsed = (now - prevTime) / 1000
      if (elapsed > 0) {
        const speed = (newBytes - prevBytes) / elapsed
        bytesPerSec = bytesPerSec > 0 ? bytesPerSec * 0.7 + speed * 0.3 : speed
      }
    }
    prevBytes = newBytes
    prevTime = now
    targetBytes = newBytes
    totalBytesVal = status.totalBytes ?? 34_000_000_000
    startLerp()
    updateDownloadDisplay()
  } else if (lerpHandle) {
    clearInterval(lerpHandle)
    lerpHandle = 0
  }
}

function startLerp() {
  if (lerpHandle) return
  lerpHandle = window.setInterval(() => {
    if (Math.abs(targetBytes - displayBytes) < 1000) displayBytes = targetBytes
    else displayBytes += (targetBytes - displayBytes) * 0.15
    updateDownloadDisplay()
  }, LERP_INTERVAL)
}

function updateDownloadDisplay() {
  const el = document.getElementById('dl-progress')
  if (!el) return
  const pct = totalBytesVal > 0 ? (displayBytes / totalBytesVal) * 100 : 0
  const dlGB = displayBytes / 1_073_741_824
  const tGB = totalBytesVal / 1_073_741_824
  const fill = el.querySelector<HTMLDivElement>('.fill')
  const sizeLabel = el.querySelector<HTMLSpanElement>('.dl-size')
  const pctLabel = el.querySelector<HTMLSpanElement>('.dl-pct')
  if (fill) fill.style.width = `${pct}%`
  if (sizeLabel) sizeLabel.textContent = `${dlGB.toFixed(2)} / ${tGB.toFixed(1)} GB`
  if (pctLabel) pctLabel.textContent = `${pct.toFixed(1)}%`
  const etaEl = document.getElementById('dl-eta')
  if (etaEl && bytesPerSec > 0) {
    const secsLeft = Math.max(0, Math.round((totalBytesVal - displayBytes) / bytesPerSec))
    const finishAt = new Date(Date.now() + secsLeft * 1000)
    etaEl.textContent = `~${fmtDuration(secsLeft)} left \u00b7 done at ~${finishAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }
}

// Copy button delegation
document.getElementById('app')!.addEventListener('click', (e) => {
  const target = e.target as HTMLElement
  if (target.id === 'copy-replica-http') copyToClipboard(getReplicaHTTP(), target.id)
  if (target.id === 'copy-replica-ws') copyToClipboard(getReplicaWS(), target.id)
  if (target.id === 'copy-official-http') copyToClipboard(OFFICIAL_HTTP, target.id)
  if (target.id === 'copy-official-ws') copyToClipboard(OFFICIAL_WS, target.id)
})

async function poll() {
  try { status = await fetchStatus() } catch { /* keep last */ }
  render()
}

render()
poll()
setInterval(poll, POLL_INTERVAL)
