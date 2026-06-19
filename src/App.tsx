import { useAuctionStore } from "./store";
import { ArrivalPanel } from "./components/ArrivalPanel";
import { BatchTree } from "./components/BatchTree";
import { BatchDetailPanel } from "./components/BatchDetailPanel";

export default function App() {
  const { batches, rootBatchIds } = useAuctionStore();

  const allBatches = Object.values(batches);
  const totalCount = allBatches.length;
  const soldCount = allBatches.filter((b) => b.status === "sold").length;
  const biddingCount = allBatches.filter((b) => b.status === "bidding").length;
  const abnormalCount = allBatches.filter((b) => b.status === "abnormal").length;
  const totalWeight = allBatches.reduce((s, b) => s + b.weightKg, 0);
  const totalValue = allBatches
    .filter((b) => b.finalPricePerKg)
    .reduce((s, b) => s + (b.finalPricePerKg! * b.weightKg), 0);
  const rootCount = rootBatchIds.length;

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>⚓ 渔港冰鲜拍卖行 · 到货分级与叫价记录工作台</h1>
          <div className="subtitle">
            到货登记 · 批次拆分 · 等级标注 · 叫价记录 · 成交确认
          </div>
        </div>
        <div className="stats-bar">
          <span className="stat">📦 到货批次 <b>{rootCount}</b></span>
          <span className="stat">📊 子批次总数 <b>{totalCount}</b></span>
          <span className="stat">⚖️ 总重量 <b>{totalWeight.toFixed(1)}kg</b></span>
          <span className="stat">🔨 叫价中 <b>{biddingCount}</b></span>
          <span className="stat">✅ 已成交 <b>{soldCount}</b></span>
          <span className="stat">💰 成交总额 <b>¥{totalValue.toFixed(2)}</b></span>
          {abnormalCount > 0 && (
            <span className="stat" style={{ background: "rgba(239, 68, 68, 0.35)" }}>
              ⚠️ 异常 <b>{abnormalCount}</b>
            </span>
          )}
        </div>
      </header>

      <div className="app-body">
        <aside className="left-col">
          <ArrivalPanel />
        </aside>
        <section className="center-col">
          <BatchTree />
        </section>
        <main className="right-col">
          <BatchDetailPanel />
        </main>
      </div>
    </div>
  );
}
