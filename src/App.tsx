import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, ArrowUpRight, Blocks, Check, ChevronRight, Clock3, Copy, ExternalLink, Globe2, Layers3, RefreshCw, ShieldCheck, Users, Zap } from 'lucide-react'

const RPC = 'https://rpc.mainnet.near.org'
const EXPLORER = 'https://nearblocks.io'
type RpcResult = { result?: any; error?: { message?: string } }
type NetworkStatus = {
  sync_info: { latest_block_height: number; latest_block_hash: string; latest_block_time: string; syncing: boolean; epoch_id: string; epoch_start_height: number; latest_block_time_nanosec?: string }
  version?: { version: string; build: string }
  chain_id?: string
  protocol_version?: number
}
type Validator = { account_id: string; stake: string; is_slashed: boolean }
type Block = { header: { height: number; hash: string; timestamp_nanosec: string; timestamp?: number; author?: string; epoch_id?: string } }

async function rpc<T>(method: string, params: unknown): Promise<T> {
  const response = await fetch(RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 'nearscope', method, params }),
  })
  const body = await response.text()
  let data: RpcResult
  try { data = JSON.parse(body) as RpcResult } catch { data = {} }
  if (!response.ok) {
    const detail = data.error?.message || body.slice(0, 220) || response.statusText
    throw new Error(`NEAR RPC HTTP ${response.status}: ${detail}`)
  }
  if (data.error) throw new Error(data.error.message || 'NEAR RPC request failed')
  return data.result as T
}

function shortHash(value = '') { return value ? value.slice(0, 8) + '…' + value.slice(-6) : '—' }
function formatTime(ns?: string) {
  if (!ns) return '—'
  const date = new Date(Number(BigInt(ns) / 1000000n))
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
function relativeTime(ns?: string) {
  if (!ns) return '—'
  const seconds = Math.max(0, Math.floor((Date.now() - Number(BigInt(ns) / 1000000n)) / 1000))
  return seconds < 60 ? `${seconds}s ago` : `${Math.floor(seconds / 60)}m ago`
}
function formatStake(value?: string) {
  if (!value) return '—'
  const near = Number(BigInt(value) / 1000000000000000000000000n)
  return near.toLocaleString() + ' NEAR'
}
function App() {
  const [status, setStatus] = useState<NetworkStatus | null>(null)
  const [validators, setValidators] = useState<Validator[]>([])
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setLoading(true)
    setError('')
    try {
      const network = await rpc<NetworkStatus>('status', {})
      const [validatorData, latest] = await Promise.all([
        rpc<{ current_validators?: Validator[] }>('validators', { epoch_id: network.sync_info.epoch_id }),
        rpc<Block>('block', { finality: 'final' }),
      ])
      setStatus(network)
      setValidators(validatorData.current_validators || [])
      const height = latest.header.height
      const samples = await Promise.all(Array.from({ length: 12 }, (_, i) =>
        rpc<Block>('block', { block_id: Math.max(1, height - (11 - i) * 5) }).catch(() => null)
      ))
      setBlocks(samples.filter((item): item is Block => Boolean(item)).reverse())
      setUpdatedAt(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load network data')
    } finally {
      setLoading(false); setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const timer = window.setInterval(() => load(true), 30000)
    return () => window.clearInterval(timer)
  }, [load])

  const activeValidators = validators.filter(v => !v.is_slashed)
  const totalStake = useMemo(() => validators.reduce((sum, v) => sum + BigInt(v.stake || '0'), 0n), [validators])
  const latest = blocks[blocks.length - 1]
  const chartPoints = useMemo(() => {
    if (!blocks.length) return ''
    const heights = blocks.map(b => b.header.height)
    const min = Math.min(...heights), max = Math.max(...heights)
    return heights.map((h, i) => `${(i / Math.max(1, heights.length - 1)) * 100},${36 - ((h - min) / Math.max(1, max - min)) * 28}`).join(' ')
  }, [blocks])

  const copyHash = async () => {
    if (!status?.sync_info.latest_block_hash) return
    await navigator.clipboard.writeText(status.sync_info.latest_block_hash)
    setCopied(true); window.setTimeout(() => setCopied(false), 1600)
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brand-mark"><Activity size={19}/></span><span>near<span className="brand-light">scope</span></span></a>
      <div className="side-label">OVERVIEW</div>
      <a className="nav-item active" href="#overview"><Layers3 size={17}/> Network overview</a>
      <a className="nav-item" href="#blocks"><Blocks size={17}/> Recent blocks</a>
      <a className="nav-item" href="#validators"><Users size={17}/> Validators</a>
      <div className="sidebar-bottom">
        <div className="network-chip"><span className="pulse-dot"/> NEAR Mainnet</div>
        <p>Live data from NEAR Protocol RPC.</p>
        <a href="https://near.org" target="_blank" rel="noreferrer">About NEAR <ArrowUpRight size={13}/></a>
      </div>
    </aside>

    <main className="main-content">
      <header className="topbar">
        <div className="breadcrumb">NEAR NETWORK <ChevronRight size={14}/> <span>OVERVIEW</span></div>
        <div className="top-actions">
          <span className="live-indicator"><i/> LIVE NETWORK</span>
          <button className="refresh-button" onClick={() => load(true)} disabled={refreshing}><RefreshCw size={15} className={refreshing ? 'spin' : ''}/><span>Refresh</span></button>
        </div>
      </header>

      <section className="page-heading" id="overview">
        <div><div className="eyebrow"><Globe2 size={14}/> NETWORK INTELLIGENCE</div><h1>Network overview</h1><p>A clear view of what’s happening on NEAR, right now.</p></div>
        <div className="last-updated"><span>LAST UPDATED</span><strong>{updatedAt ? updatedAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'}) : 'Waiting for data'}</strong></div>
      </section>

      {error && <div className="error-banner"><span>{error}</span><button onClick={() => load()}>Try again</button></div>}

      <section className="stats-grid">
        <article className="stat-card featured">
          <div className="stat-top"><span>Latest block height</span><span className="stat-icon"><Blocks size={17}/></span></div>
          <div className="stat-value">{loading && !status ? '—' : (status?.sync_info.latest_block_height ?? 0).toLocaleString()}</div>
          <div className="stat-foot"><span className="green-dot"/> Finalized block</div>
        </article>
        <article className="stat-card">
          <div className="stat-top"><span>Active validators</span><span className="stat-icon"><Users size={17}/></span></div>
          <div className="stat-value">{loading && !validators.length ? '—' : activeValidators.length.toLocaleString()}</div>
          <div className="stat-foot">Current validator set</div>
        </article>
        <article className="stat-card">
          <div className="stat-top"><span>Total validator stake</span><span className="stat-icon"><ShieldCheck size={17}/></span></div>
          <div className="stat-value">{validators.length ? (Number(totalStake / 1000000000000000000000000n)).toLocaleString() : '—'} <small>NEAR</small></div>
          <div className="stat-foot">Across current validator set</div>
        </article>
        <article className="stat-card">
          <div className="stat-top"><span>Protocol version</span><span className="stat-icon"><Zap size={17}/></span></div>
          <div className="stat-value">{status?.protocol_version?.toLocaleString() ?? '—'}</div>
          <div className="stat-foot">{status?.version?.version ? `Node ${status.version.version}` : 'NEAR protocol'}</div>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel block-panel" id="blocks">
          <div className="panel-heading"><div><div className="eyebrow">CHAIN ACTIVITY</div><h2>Block progression</h2></div><span className="tag"><span className="green-dot"/> FINALIZED</span></div>
          <div className="chart-summary"><strong>{status?.sync_info.latest_block_height?.toLocaleString() ?? '—'}</strong><span>Latest finalized height</span></div>
          <div className="chart-wrap">
            <div className="chart-y-labels"><span>Latest</span><span>Earlier</span></div>
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="chart-svg" role="img" aria-label="Sampled finalized block heights increasing over time">
              <defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#62e4c0" stopOpacity=".22"/><stop offset="100%" stopColor="#62e4c0" stopOpacity="0"/></linearGradient></defs>
              <path d={chartPoints ? `M ${chartPoints.replaceAll(' ', ' L ')} L 100 40 L 0 40 Z` : ''} fill="url(#area)"/>
              <polyline points={chartPoints} fill="none" stroke="#62e4c0" strokeWidth="1.2" vectorEffect="non-scaling-stroke"/>
            </svg>
          </div>
          <div className="chart-caption"><span>Earlier sampled blocks</span><span>Latest block <ArrowUpRight size={12}/></span></div>
          <p className="chart-note">A sample of finalized block heights. This is not a transaction-volume chart.</p>
        </article>

        <article className="panel network-panel">
          <div className="panel-heading"><div><div className="eyebrow">NETWORK HEALTH</div><h2>Chain status</h2></div><span className="status-pill"><i/> {status?.sync_info.syncing ? 'Syncing' : status ? 'Operational' : '—'}</span></div>
          <div className="health-row"><span>Network</span><strong>NEAR Mainnet</strong></div>
          <div className="health-row"><span>Chain ID</span><strong>{status?.chain_id || 'mainnet'}</strong></div>
          <div className="health-row"><span>Latest block time</span><strong>{formatTime(status?.sync_info.latest_block_time)}</strong></div>
          <div className="health-row"><span>Block age</span><strong>{relativeTime(status?.sync_info.latest_block_time)}</strong></div>
          <div className="health-row"><span>Epoch start height</span><strong>{status?.sync_info.epoch_start_height?.toLocaleString() ?? '—'}</strong></div>
          <div className="health-row"><span>Latest block hash</span><button className="hash-button" onClick={copyHash}>{shortHash(status?.sync_info.latest_block_hash)} {copied ? <Check size={13}/> : <Copy size={13}/>}</button></div>
          <a className="explorer-link" href={`${EXPLORER}/blocks`} target="_blank" rel="noreferrer">Open block explorer <ExternalLink size={13}/></a>
        </article>
      </section>

      <section className="panel table-panel" id="validators">
        <div className="panel-heading"><div><div className="eyebrow">CONSENSUS</div><h2>Current validators</h2><p className="panel-subtitle">Validator accounts in the current epoch set.</p></div><span className="count-pill">{activeValidators.length} active</span></div>
        <div className="table-scroll"><table><thead><tr><th>VALIDATOR</th><th>STAKED</th><th>STATUS</th><th></th></tr></thead><tbody>
          {validators.slice(0, 8).map(v => <tr key={v.account_id}><td><div className="validator-name"><span className="validator-avatar">{v.account_id.slice(0,1).toUpperCase()}</span><strong>{v.account_id}</strong></div></td><td className="stake-cell">{formatStake(v.stake)}</td><td><span className={v.is_slashed ? 'validator-status slashed' : 'validator-status'}><i/>{v.is_slashed ? 'Slashed' : 'Active'}</span></td><td><a className="row-link" href={`${EXPLORER}/address/${v.account_id}`} target="_blank" rel="noreferrer"><ArrowUpRight size={15}/></a></td></tr>)}
          {!validators.length && <tr><td colSpan={4} className="empty-cell">{loading ? 'Loading validator data…' : 'Validator data is not available right now.'}</td></tr>}
        </tbody></table></div>
        <div className="table-footer"><span>Showing {Math.min(8, validators.length)} of {validators.length} validators</span><a href={`${EXPLORER}/validators`} target="_blank" rel="noreferrer">View all validators <ChevronRight size={14}/></a></div>
      </section>

      <section className="panel recent-panel">
        <div className="panel-heading"><div><div className="eyebrow">LATEST FINALITY</div><h2>Recent blocks</h2></div><a className="subtle-link" href={`${EXPLORER}/blocks`} target="_blank" rel="noreferrer">View explorer <ArrowUpRight size={13}/></a></div>
        <div className="recent-list">
          {[...blocks].reverse().slice(0, 5).map(b => <div className="recent-row" key={b.header.hash}><span className="block-symbol"><Blocks size={15}/></span><div className="recent-main"><strong>#{b.header.height.toLocaleString()}</strong><span>{shortHash(b.header.hash)}</span></div><div className="recent-author">{b.header.author || 'Producer unavailable'}</div><div className="recent-time"><Clock3 size={13}/>{relativeTime(b.header.timestamp_nanosec)}</div><a href={`${EXPLORER}/blocks/${b.header.height}`} target="_blank" rel="noreferrer"><ArrowUpRight size={14}/></a></div>)}
          {!blocks.length && <div className="empty-cell">{loading ? 'Loading recent blocks…' : 'Recent blocks are not available right now.'}</div>}
        </div>
      </section>
      <footer className="footer"><span>NEARSCOPE <b>·</b> A community-built NEAR network dashboard</span><span>Data served by NEAR Protocol RPC <span className="footer-dot">●</span> Auto-refreshes every 30 seconds</span></footer>
    </main>
  </div>
}
export default App