import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Activity, ArrowUpRight, BookOpen, ChevronRight, CircleDollarSign, Cpu, Database, Github, Gauge, Layers3, Menu, ShieldCheck, X } from "lucide-react";
import { estimateInferenceCost } from "./calculations/inference-cost";
import rawCatalogue from "../public/data/catalogue.json";
import { datasetSchema } from "./data/schema";
const catalogue = datasetSchema.parse(rawCatalogue);

type Page = "overview" | "providers" | "models" | "subscriptions" | "calculator" | "methodology";
const nav: { id: Page; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "providers", label: "Providers", icon: Database },
  { id: "models", label: "Models", icon: Cpu },
  { id: "subscriptions", label: "Subscriptions", icon: Layers3 },
  { id: "calculator", label: "Calculator", icon: Gauge },
  { id: "methodology", label: "Methodology", icon: BookOpen },
];
const researchQueue = [
  { name: "OpenAI", focus: "Consumer plans, model families and published API prices", url: "https://openai.com" },
  { name: "Anthropic", focus: "Claude plans, model families and published API prices", url: "https://www.anthropic.com" },
  { name: "Google", focus: "Gemini plans, model families and published API prices", url: "https://ai.google" },
  { name: "xAI", focus: "Grok plans, model families and published API prices", url: "https://x.ai" },
  { name: "DeepSeek", focus: "Consumer access and published API prices", url: "https://www.deepseek.com" },
];

function usePage(): [Page, (page: Page) => void] {
  const read = (): Page => {
    if (typeof window === "undefined") return "overview";
    const key = window.location.hash.replace("#", "") as Page;
    return nav.some((item) => item.id === key) ? key : "overview";
  };
  const [page, setPage] = useState<Page>(read);
  useEffect(() => {
    const onHash = () => setPage(read());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const navigate = (next: Page) => { window.location.hash = next; setPage(next); };
  return [page, navigate];
}

function App() {
  const [page, navigate] = usePage();
  const [mobileNav, setMobileNav] = useState(false);
  const active = nav.find((item) => item.id === page) ?? nav[0];

  return (
    <div className="min-h-screen bg-[#090b10] text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/[0.07] bg-[#0d1017] lg:flex lg:flex-col">
        <Brand onClick={() => navigate("overview")} />
        <nav className="mt-10 flex-1 space-y-1 px-3">
          {nav.map(({ id, label, icon: Icon }) => <NavButton key={id} active={page === id} onClick={() => navigate(id)}><Icon size={17} />{label}</NavButton>)}
        </nav>
        <div className="m-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-teal-300"><ShieldCheck size={14} /> Research principles</div>
          <p className="mt-2 text-xs leading-5 text-slate-500">Sources, assumptions and estimates are kept distinct.</p>
        </div>
        <a className="flex items-center gap-2 border-t border-white/[0.07] px-6 py-5 text-xs text-slate-500 hover:text-white" href="https://github.com/thewilferine/compute-ledger"><Github size={15} /> View source on GitHub <ArrowUpRight size={13} /></a>
      </aside>

      {mobileNav && <div className="fixed inset-0 z-50 bg-black/70 lg:hidden" onClick={() => setMobileNav(false)}><aside className="h-full w-72 bg-[#0d1017] p-4" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between"><Brand onClick={() => {navigate("overview");setMobileNav(false)}}/><button onClick={() => setMobileNav(false)} aria-label="Close menu"><X /></button></div><nav className="mt-8 space-y-1">{nav.map(({id,label,icon:Icon})=><NavButton key={id} active={page===id} onClick={()=>{navigate(id);setMobileNav(false)}}><Icon size={17}/>{label}</NavButton>)}</nav></aside></div>}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#090b10]/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3"><button className="lg:hidden" onClick={()=>setMobileNav(true)} aria-label="Open menu"><Menu size={20}/></button><span className="text-sm text-slate-500">Workspace</span><ChevronRight size={14} className="text-slate-700"/><span className="text-sm font-medium">{active.label}</span></div>
          <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-3 py-1 text-[11px] font-medium text-amber-200">Research preview</span>
        </header>
        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
          {page === "overview" && <Overview onNavigate={navigate}/>}
          {page === "providers" && <Providers/>}
          {page === "models" && <Models/>}
          {page === "subscriptions" && <Subscriptions/>}
          {page === "calculator" && <Calculator/>}
          {page === "methodology" && <Methodology/>}
          <footer className="mt-16 flex flex-col justify-between gap-3 border-t border-white/[0.07] pt-6 text-xs text-slate-600 sm:flex-row"><span>© {new Date().getFullYear()} The Compute Ledger</span><span>Independent estimates, not provider financial disclosures.</span></footer>
        </main>
      </div>
    </div>
  );
}

function Brand({onClick}:{onClick:()=>void}) { return <button onClick={onClick} className="flex items-center gap-3 px-5 pt-6 text-left"><span className="grid size-9 place-items-center rounded-xl bg-teal-300 text-slate-950"><Cpu size={19}/></span><span><span className="block text-sm font-semibold tracking-tight">Compute Ledger</span><span className="mt-0.5 block text-[10px] tracking-[0.16em] text-slate-500 uppercase">AI economics explorer</span></span></button>; }
function NavButton({active,onClick,children}:{active:boolean;onClick:()=>void;children:ReactNode}) { return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active?"bg-teal-300/10 text-teal-200":"text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}>{children}</button>; }
function Eyebrow({children}:{children:React.ReactNode}) { return <p className="text-xs font-semibold tracking-[0.16em] text-teal-300 uppercase">{children}</p>; }
function Heading({eyebrow,title,description}:{eyebrow:string;title:string;description:string}) { return <div className="mb-8"><Eyebrow>{eyebrow}</Eyebrow><h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{description}</p></div>; }
function Panel({children,className=""}:{children:React.ReactNode;className?:string}) { return <section className={`rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6 ${className}`}>{children}</section>; }
function Stat({label,value,note,icon:Icon}:{label:string;value:string;note:string;icon:typeof Activity}) { return <Panel><div className="flex items-center justify-between text-slate-500"><span className="text-xs">{label}</span><Icon size={17}/></div><p className="mt-5 text-2xl font-semibold tracking-tight text-white">{value}</p><p className="mt-2 text-xs text-slate-500">{note}</p></Panel>; }

function Overview({onNavigate}:{onNavigate:(p:Page)=>void}) {
 return <><div className="mb-10 grid gap-8 xl:grid-cols-[1.4fr_0.6fr]"><div className="pt-2"><Eyebrow>Understanding the economics of AI</Eyebrow><h1 className="mt-4 max-w-3xl text-4xl leading-[1.08] font-semibold tracking-tight text-white sm:text-6xl">What does AI really cost to serve?</h1><p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">An independent explorer of AI inference economics, consumer subscriptions and the assumptions behind the numbers.</p><div className="mt-8 flex flex-wrap gap-3"><button onClick={()=>onNavigate("calculator")} className="rounded-lg bg-teal-300 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-200">Open cost calculator <ArrowUpRight className="ml-2 inline" size={15}/></button><button onClick={()=>onNavigate("methodology")} className="rounded-lg border border-white/10 px-5 py-3 text-sm text-slate-300 hover:bg-white/5">Read methodology</button></div></div><Panel className="flex flex-col justify-between"><div className="flex items-center gap-2 text-sm text-slate-400"><ShieldCheck size={17} className="text-teal-300"/> Evidence before conclusions</div><p className="mt-8 text-2xl leading-snug font-medium text-white">Transparency over false precision.</p><p className="mt-3 text-sm leading-6 text-slate-400">Provider infrastructure costs and per-user profitability are not public. We model plausible scenarios and make uncertainty visible.</p><div className="mt-8 border-t border-white/[0.08] pt-4 text-xs text-slate-500">No provider has endorsed this project.</div></Panel></div>
 <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold text-white">The research dashboard</h2><span className="text-xs text-slate-600">Initial release</span></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Providers tracked" value={String(catalogue.providers.length)} note="Companies in the source catalogue" icon={Database}/><Stat label="Models catalogued" value={String(catalogue.models.length)} note="Models with linked documentation" icon={Cpu}/><Stat label="Subscription plans" value={String(catalogue.subscriptionPlans.length)} note="Observed regional prices" icon={Layers3}/><Stat label="Cost scenarios" value="1" note="Illustrative calculator available" icon={CircleDollarSign}/></div>
 <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"><Panel><div className="flex items-center gap-2"><Database size={17} className="text-teal-300"/><h2 className="text-sm font-semibold">Provider research queue</h2></div><div className="mt-5 divide-y divide-white/[0.06]">{researchQueue.slice(0,4).map((p)=><div key={p.name} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium text-slate-200">{p.name}</p><p className="mt-1 text-xs text-slate-500">{p.focus}</p></div><span className="text-[10px] text-amber-200">Not yet verified</span></div>)}</div><button onClick={()=>onNavigate("providers")} className="mt-4 text-xs font-medium text-teal-300 hover:text-teal-200">Explore providers <ArrowUpRight className="ml-1 inline" size={13}/></button></Panel><Panel><div className="flex items-center gap-2"><Activity size={17} className="text-teal-300"/><h2 className="text-sm font-semibold">How to read this project</h2></div><div className="mt-5 space-y-4 text-sm leading-6 text-slate-400"><p><b className="text-slate-200">Published facts</b> are attributed to primary sources and dates.</p><p><b className="text-slate-200">Assumptions</b> are editable modelling inputs, not provider disclosures.</p><p><b className="text-slate-200">Estimates</b> are calculated outputs with uncertainty, not measured losses.</p></div></Panel></div></>;
}

function EmptyData({title,detail}:{title:string;detail:string}) { return <Panel className="py-12 text-center"><Database className="mx-auto text-slate-600" size={24}/><h3 className="mt-4 text-sm font-semibold text-slate-200">{title}</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{detail}</p></Panel>; }
function Providers(){return <><Heading eyebrow="Provider directory" title="AI providers" description="A source-backed directory of companies, their consumer offerings and model families. Provider records will appear as they are researched and cited."/><div className="mb-5 flex flex-wrap gap-2">{["Consumer subscriptions","Model catalogues","Published API pricing","Source history"].map(x=><span key={x} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400">{x}</span>)}</div><EmptyData title="Provider records are being researched" detail="The initial research queue includes OpenAI, Anthropic, Google, xAI and DeepSeek. We will only publish details once their sources and observation dates have been recorded."/></>}
function Models(){return <><Heading eyebrow="Model catalogue" title="Models and capabilities" description="Compare model families, modalities, context windows and published API prices. All technical specifications will link back to provider documentation."/><EmptyData title="No verified model records yet" detail="Model names, context windows and capabilities change frequently. This catalogue will be populated from official model documentation rather than guessed or scraped without attribution."/></>}
function Subscriptions(){return <><Heading eyebrow="Consumer plans" title="Subscription economics" description="Compare monthly and annual plan prices, regional differences, published limits and the assumptions needed to estimate the value of included usage."/><EmptyData title="No verified subscription prices yet" detail="Prices will be recorded with currency, region, billing period, source URL and observation date. We won't treat a subscription fee as pure inference revenue."/></>}

function Field({label,value,onChange,min=0,max,step=1,suffix}:{label:string;value:number;onChange:(n:number)=>void;min?:number;max?:number;step?:number;suffix?:string}) {return <label className="block"><span className="mb-2 flex justify-between text-xs text-slate-400"><span>{label}</span>{suffix&&<span className="text-slate-500">{suffix}</span>}</span><input type="number" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-[#090c12] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-300/60"/></label>}
function Calculator(){
 const [hourly,setHourly]=useState(2.5),[throughput,setThroughput]=useState(120),[utilisation,setUtilisation]=useState(55),[overhead,setOverhead]=useState(1.35),[tokens,setTokens]=useState(50000),[requests,setRequests]=useState(100);
 const result=useMemo(()=>{try{return estimateInferenceCost({acceleratorHourlyCost:hourly,outputTokensPerSecond:throughput,utilisation:utilisation/100,infrastructureOverheadMultiplier:overhead,outputTokens:tokens*requests})}catch{return null}},[hourly,throughput,utilisation,overhead,tokens,requests]);
 const money=(n:number)=>new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP",maximumFractionDigits:4}).format(n);
 return <><Heading eyebrow="Scenario modelling" title="Inference cost calculator" description="Explore how serving assumptions affect an illustrative output-token workload. These are your inputs, not claims about any AI provider's infrastructure."/><div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]"><Panel><div className="mb-6 flex items-center gap-2"><Gauge className="text-teal-300" size={18}/><h2 className="text-sm font-semibold">Model assumptions</h2></div><div className="grid gap-5 sm:grid-cols-2"><Field label="Accelerator allocation cost / hour" value={hourly} onChange={setHourly} step={0.1} suffix="GBP / hour"/><Field label="Sustained output throughput" value={throughput} onChange={setThroughput} min={0.01} suffix="tokens / second"/><Field label="Productive utilisation" value={utilisation} onChange={setUtilisation} min={1} max={100} suffix="%"/><Field label="Infrastructure overhead multiplier" value={overhead} onChange={setOverhead} min={1} step={0.05} suffix="×"/><Field label="Output tokens per request" value={tokens} onChange={setTokens} min={0} step={1000}/><Field label="Requests in scenario" value={requests} onChange={setRequests} min={0}/></div><p className="mt-6 rounded-lg bg-white/[0.03] p-3 text-xs leading-5 text-slate-500">The calculation allocates accelerator time based on effective throughput and utilisation, then applies an overhead multiplier. It does not yet model prompt tokens, batching, KV cache, parallelism or multimodal workloads.</p></Panel><div className="space-y-4"><Panel><p className="text-xs text-slate-500">Illustrative total serving cost</p><p className="mt-3 text-4xl font-semibold tracking-tight text-teal-200">{result?money(result.estimatedTotalCost):"—"}</p><p className="mt-2 text-xs text-slate-500">For {new Intl.NumberFormat("en-GB").format(tokens*requests)} output tokens</p><div className="mt-6 space-y-3 border-t border-white/[0.08] pt-5 text-sm"><div className="flex justify-between"><span className="text-slate-500">Effective throughput</span><b>{result?result.effectiveTokensPerSecond.toFixed(1)+" tok/s":"—"}</b></div><div className="flex justify-between"><span className="text-slate-500">Serving time</span><b>{result?(result.secondsRequired/60).toFixed(1)+" min":"—"}</b></div><div className="flex justify-between"><span className="text-slate-500">Accelerator allocation</span><b>{result?money(result.acceleratorCost):"—"}</b></div></div></Panel><Panel><div className="flex items-center gap-2 text-amber-200"><Activity size={16}/><span className="text-xs font-semibold">Interpret with care</span></div><p className="mt-3 text-xs leading-5 text-slate-400">This is a transparent toy model for exploring assumptions. Real production cost depends on architecture, prompt processing, batching, memory, hardware configuration, redundancy, capacity planning and other factors.</p></Panel></div></div></>;
}

function Methodology(){return <><Heading eyebrow="Research standards" title="Methodology and limitations" description="The aim is to make the economics understandable without claiming access to information providers do not disclose."/><div className="grid gap-4 lg:grid-cols-2"><Panel><h2 className="font-semibold text-white">Evidence categories</h2><div className="mt-5 space-y-4 text-sm leading-6"><p><b className="text-teal-200">Published fact</b><br/><span className="text-slate-400">A price, model specification or plan detail stated by a primary source.</span></p><p><b className="text-sky-200">External estimate</b><br/><span className="text-slate-400">A third-party estimate with its own methodology and limitations.</span></p><p><b className="text-amber-200">Modelling assumption</b><br/><span className="text-slate-400">An input selected to explore a scenario, such as accelerator hourly cost or throughput.</span></p><p><b className="text-violet-200">Calculated estimate</b><br/><span className="text-slate-400">An output produced from documented inputs and a deterministic formula.</span></p></div></Panel><Panel><h2 className="font-semibold text-white">Initial cost model</h2><div className="mt-5 space-y-3 font-mono text-xs leading-6 text-slate-300"><p>Effective throughput = sustained throughput × utilisation</p><p>Serving seconds = output tokens ÷ effective throughput</p><p>Accelerator cost = serving seconds ÷ 3,600 × hourly cost</p><p>Estimated total = accelerator cost × overhead multiplier</p></div></Panel><Panel className="lg:col-span-2"><h2 className="font-semibold text-white">What this model does not claim</h2><ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-400 sm:grid-cols-2"><li>• Actual provider GPU fleet costs or utilisation</li><li>• Actual per-user inference costs or profitability</li><li>• Prompt/prefill cost, batching and KV cache effects</li><li>• Hardware depreciation, power contracts or network topology</li><li>• Subscription revenue allocation or cross-subsidies</li><li>• Proof that an individual user creates a financial loss</li></ul></Panel></div></>}
export default App;
