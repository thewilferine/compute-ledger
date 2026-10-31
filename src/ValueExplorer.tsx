import { useMemo, useState } from "react";
import { ArrowUpRight, Info, SlidersHorizontal } from "lucide-react";
import type { Dataset, SubscriptionPlan } from "./data/schema";

type Profile = "budget" | "everyday" | "heavy";

const profileCopy: Record<Profile, { title: string; description: string; guidance: string }> = {
  budget: {
    title: "Keep the monthly cost down",
    description: "Find the least expensive plans first, then check whether their model access and limits cover what you need.",
    guidance: "A low sticker price is only good value if the plan includes the models and features you actually use.",
  },
  everyday: {
    title: "A dependable everyday assistant",
    description: "Compare mainstream plans on monthly price, included access and how clearly their usage rules are explained.",
    guidance: "For regular chat, writing and occasional problem-solving, avoid paying for a higher tier until you regularly hit a limit.",
  },
  heavy: {
    title: "Get more headroom for frequent use",
    description: "Look for plans that publish higher usage tiers or explain their shared pools and reset rules.",
    guidance: "Published multipliers are relative to that provider's own baseline. They are not comparable quotas across different providers.",
  },
};

function monthlyPrice(plan: SubscriptionPlan) {
  return plan.billingPeriod === "annual" ? plan.price / 12 : plan.price;
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

export default function ValueExplorer({ dataset }: { dataset: Dataset }) {
  const currencies = [...new Set(dataset.subscriptionPlans.map((plan) => plan.currency))].sort();
  const [currency, setCurrency] = useState("ALL");
  const [profile, setProfile] = useState<Profile>("everyday");
  const [budget, setBudget] = useState(30);
  const [budgetOnly, setBudgetOnly] = useState(false);

  const plans = useMemo(() => {
    const matching = dataset.subscriptionPlans
      .filter((plan) => currency === "ALL" || plan.currency === currency)
      .filter((plan) => currency === "ALL" || !budgetOnly || monthlyPrice(plan) <= budget)
      .sort((a, b) => a.currency.localeCompare(b.currency) || monthlyPrice(a) - monthlyPrice(b));

    return matching;
  }, [dataset.subscriptionPlans, currency, budget, budgetOnly]);

  const cheapestByCurrency = new Map<string, number>();
  for (const plan of plans) {
    const current = cheapestByCurrency.get(plan.currency);
    if (current === undefined || monthlyPrice(plan) < current) cheapestByCurrency.set(plan.currency, monthlyPrice(plan));
  }
  const highestTierByProvider = new Map<string, number>();
  for (const plan of dataset.subscriptionPlans) {
    if ((currency !== "ALL" && plan.currency !== currency) || plan.usageLimitType !== "tier-multiplier" || plan.usageMultiplier === undefined) continue;
    highestTierByProvider.set(plan.providerId, Math.max(highestTierByProvider.get(plan.providerId) ?? 0, plan.usageMultiplier));
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-[0.16em] text-teal-300 uppercase">Find your best-fit plan</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Get more AI for your money</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Explore published consumer plans against the way you use AI. We show the evidence behind each option instead of hiding incomparable limits inside a made-up value score.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
        <section className="h-fit rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-2"><SlidersHorizontal size={17} className="text-teal-300"/><h2 className="text-sm font-semibold text-white">Your usage profile</h2></div>
          <div className="space-y-2">
            {([
              ["budget", "Budget-conscious"],
              ["everyday", "Everyday use"],
              ["heavy", "Frequent / heavy use"],
            ] as const).map(([value, label]) => (
              <button key={value} onClick={() => setProfile(value)} className={`w-full rounded-lg border px-3 py-3 text-left text-sm transition ${profile === value ? "border-teal-300/40 bg-teal-300/10 text-teal-100" : "border-white/[0.08] text-slate-400 hover:bg-white/[0.04]"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="mt-5">
            <label className="mb-2 block text-xs text-slate-400" htmlFor="value-currency">Price currency</label>
            <select id="value-currency" value={currency} onChange={(event) => { setCurrency(event.target.value); if (event.target.value === "ALL") setBudgetOnly(false); }} className="w-full rounded-lg border border-white/10 bg-[#090c12] px-3 py-2.5 text-sm text-white">
              <option value="ALL">All currencies</option>{currencies.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="mt-5">
            <label className="mb-2 flex items-center justify-between text-xs text-slate-400" htmlFor="value-budget"><span>Monthly budget filter</span><span className="text-slate-200">{currency === "ALL" ? "Select one currency" : formatMoney(budget, currency)}</span></label>
            <input id="value-budget" type="number" min="0" step="1" disabled={currency === "ALL"} value={budget} onChange={(event) => setBudget(Math.max(0, Number(event.target.value)))} className="w-full rounded-lg border border-white/10 bg-[#090c12] px-3 py-2.5 text-sm text-white"/>
            <label className="mt-3 flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={budgetOnly} disabled={currency === "ALL"} onChange={(event) => setBudgetOnly(event.target.checked)} className="accent-teal-300"/> Only show plans within this budget</label>
          </div>
          <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
            <h3 className="text-sm font-medium text-white">{profileCopy[profile].title}</h3>
            <p className="mt-2 text-xs leading-5 text-slate-400">{profileCopy[profile].description}</p>
            <p className="mt-3 text-xs leading-5 text-teal-200">{profileCopy[profile].guidance}</p>
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div><h2 className="text-sm font-semibold text-white">Available plans</h2><p className="mt-1 text-xs text-slate-500">{currency === "ALL" ? "Grouped by currency, then sorted by monthly-equivalent price" : `Sorted by monthly-equivalent price · ${currency}`}</p></div>
            <span className="text-xs text-slate-500">{plans.length} matching {plans.length === 1 ? "plan" : "plans"}</span>
          </div>
          {plans.length === 0 ? <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-8 text-center text-sm text-slate-400">No plans match this currency and budget. Increase the budget or choose another currency.</div> : <div className="space-y-3">
            {plans.map((plan) => {
              const provider = dataset.providers.find((item) => item.id === plan.providerId);
              const source = dataset.sources.find((item) => item.id === plan.sources[0]);
              const monthly = monthlyPrice(plan);
              const isCheapest = monthly === cheapestByCurrency.get(plan.currency);
              const isHighestTier = plan.usageLimitType === "tier-multiplier" && plan.usageMultiplier !== undefined && plan.usageMultiplier === highestTierByProvider.get(plan.providerId);
              const usageLabel = plan.usageLimitType === "tier-multiplier" && plan.usageMultiplier ? `${plan.usageMultiplier}× provider tier` : plan.usageLimitType === "shared-pool" ? "Shared usage pool" : plan.usageLimitType === "dynamic" ? "Dynamic limits" : "Limit not published";
              return (
                <article key={plan.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="text-xs text-slate-500">{provider?.name ?? "Provider"}</p><h3 className="mt-1 text-base font-semibold text-white">{plan.name}</h3><p className="mt-1 text-xs text-slate-500">{plan.region} · observed {plan.observedAt}</p></div>
                    <div className="text-right"><p className="text-xl font-semibold text-white">{formatMoney(monthly, plan.currency)}<span className="text-xs font-normal text-slate-500"> / mo</span></p>{plan.billingPeriod === "annual" && <p className="mt-1 text-[10px] text-slate-500">Billed {formatMoney(plan.price, plan.currency)} annually</p>}</div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {isCheapest && <span className="rounded-full border border-teal-300/20 bg-teal-300/[0.07] px-2.5 py-1 text-[10px] text-teal-200">Lowest-priced in this view</span>}
                    {isHighestTier && <span className="rounded-full border border-sky-300/20 bg-sky-300/[0.07] px-2.5 py-1 text-[10px] text-sky-200">Highest published tier for this provider</span>}
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-slate-300">{usageLabel}</span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Model and feature access</p><p className="mt-1 text-xs leading-5 text-slate-300">{plan.accessSummary ?? "Not specified in the linked source."}</p></div>
                    <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Usage policy</p><p className="mt-1 text-xs leading-5 text-slate-300">{plan.usageLimitSummary ?? "No verified public usage-limit detail."}{plan.usageResetCadence ? ` Reset: ${plan.usageResetCadence}.` : ""}</p></div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-3 text-[10px] text-slate-500">
                    <span>{source ? `Source: ${source.publisher}` : "Source details unavailable"}</span>
                    {source && <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-teal-300 hover:underline">Check plan details <ArrowUpRight size={11}/></a>}
                  </div>
                </article>
              );
            })}
          </div>}
          <div className="mt-4 flex gap-2 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-4 text-xs leading-5 text-slate-400">
            <Info size={15} className="mt-0.5 shrink-0 text-amber-200"/>
            <p>There is no defensible universal value score yet. Providers publish different kinds of limits, and a 5× tier at one provider cannot be compared directly with another provider's 5× tier. All currencies are shown by default and are grouped separately, not converted or compared as if they were equivalent. Select one currency to use the monthly budget filter. Check source links before subscribing; prices and limits change.</p>
          </div>
        </section>
      </div>
    </>
  );
}
