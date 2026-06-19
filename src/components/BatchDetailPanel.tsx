import { useState } from "react";
import type { GradeLevel } from "../types";
import { useAuctionStore } from "../store";

const GRADES: GradeLevel[] = ["S", "A", "B", "C", "D"];

export function BatchDetailPanel() {
  const {
    batches,
    selectedBatchId,
    setGrade,
    splitBatch,
    addBid,
    removeBid,
    updateBid,
    confirmSale,
    revokeSale,
    setAbnormal,
    setRemark,
    updateWeight,
    deleteBatch,
  } = useAuctionStore();

  const batch = selectedBatchId ? batches[selectedBatchId] : null;

  const [splitCount, setSplitCount] = useState(2);
  const [splitRows, setSplitRows] = useState<{ weight: string; grade: GradeLevel | "" }[]>(
    [{ weight: "", grade: "" }, { weight: "", grade: "" }]
  );
  const [bidBuyer, setBidBuyer] = useState("");
  const [bidPrice, setBidPrice] = useState("");
  const [bidNote, setBidNote] = useState("");
  const [abnormalText, setAbnormalText] = useState("");

  if (!batch) {
    return (
      <div className="detail-panel empty">
        <div className="empty-center">
          <div className="big-icon">🐟</div>
          <p>在左侧批次树中选择一个批次查看详情</p>
        </div>
      </div>
    );
  }

  const handleSplitCountChange = (n: number) => {
    const count = Math.max(2, Math.min(10, n));
    setSplitCount(count);
    const rows = [...splitRows];
    while (rows.length < count) rows.push({ weight: "", grade: "" });
    setSplitRows(rows.slice(0, count));
  };

  const handleSplitRow = (i: number, key: "weight" | "grade", value: string) => {
    const rows = [...splitRows];
    rows[i] = { ...rows[i], [key]: value };
    setSplitRows(rows);
  };

  const doSplit = () => {
    const splits = splitRows
      .filter((r) => r.weight && parseFloat(r.weight) > 0)
      .map((r) => ({
        weightKg: parseFloat(r.weight),
        grade: (r.grade || undefined) as GradeLevel | undefined,
      }));
    if (splits.length < 2) {
      alert("至少需要 2 个有效子批次");
      return;
    }
    const total = splits.reduce((s, x) => s + x.weightKg, 0);
    if (Math.abs(total - batch.weightKg) > 0.5) {
      if (!confirm(`子批次总重 ${total}kg 与原批次 ${batch.weightKg}kg 不一致，是否继续？`)) {
        return;
      }
    }
    splitBatch(batch.id, splits);
    setSplitRows([{ weight: "", grade: "" }, { weight: "", grade: "" }]);
    setSplitCount(2);
  };

  const doAddBid = () => {
    const price = parseFloat(bidPrice);
    if (!bidBuyer.trim() || !price || price <= 0) return;
    addBid(batch.id, bidBuyer.trim(), price, bidNote.trim() || undefined);
    setBidPrice("");
    setBidNote("");
  };

  const doConfirmSale = (buyer: string, price: number) => {
    if (!confirm(`确认以 ¥${price}/kg 卖给 ${buyer}？总价 ¥${(price * batch.weightKg).toFixed(2)}`)) {
      return;
    }
    confirmSale(batch.id, buyer, price);
  };

  const doSetAbnormal = () => {
    if (abnormalText.trim()) {
      setAbnormal(batch.id, abnormalText.trim());
    } else {
      setAbnormal(batch.id, null);
    }
    setAbnormalText("");
  };

  const soldTotal = batch.finalPricePerKg
    ? (batch.finalPricePerKg * batch.weightKg).toFixed(2)
    : "—";

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div>
          <h2>
            <span className="batch-no">{batch.batchNo}</span>
            <span className="fish-type-big">{batch.fishType}</span>
          </h2>
          <div className="meta">
            <span>🚢 {batch.boatName}</span>
            <span>🕐 {new Date(batch.arrivalTime).toLocaleString("zh-CN")}</span>
            {batch.soldTime && (
              <span>💰 成交 {new Date(batch.soldTime).toLocaleTimeString("zh-CN")}</span>
            )}
          </div>
        </div>
        <button
          className="btn-danger small"
          onClick={() => {
            if (confirm(`删除批次 ${batch.batchNo} 及其所有子批次？`)) {
              deleteBatch(batch.id);
            }
          }}
        >
          🗑 删除
        </button>
      </div>

      <div className="detail-grid">
        <section className="card">
          <h4>基础信息</h4>
          <div className="info-row">
            <span>重量</span>
            <input
              type="number"
              step="0.1"
              value={batch.weightKg}
              onChange={(e) => updateWeight(batch.id, parseFloat(e.target.value) || 0)}
            />
            <span>kg</span>
          </div>
          <div className="info-row">
            <span>备注</span>
            <input
              type="text"
              placeholder="内部备注（不影响叫价）"
              value={batch.remark}
              onChange={(e) => setRemark(batch.id, e.target.value)}
            />
          </div>
        </section>

        <section className="card">
          <h4>等级标注</h4>
          <div className="grade-picker">
            {GRADES.map((g) => (
              <button
                key={g}
                className={`grade-btn grade-${g} ${batch.grade === g ? "active" : ""}`}
                onClick={() => setGrade(batch.id, batch.grade === g ? null : g)}
              >
                {g}级
              </button>
            ))}
            {batch.grade === null && <span className="hint">未分级</span>}
          </div>
        </section>

        <section className="card full">
          <h4>
            ✂️ 批次拆分
            <span className="hint">
              {batch.children.length > 0 && `（已有 ${batch.children.length} 个子批次，可继续追加）`}
            </span>
          </h4>
          <div className="split-controls">
            <label>
              拆分为
              <input
                type="number"
                min="2"
                max="10"
                value={splitCount}
                onChange={(e) => handleSplitCountChange(parseInt(e.target.value) || 2)}
              />
              份子批次
            </label>
          </div>
          <div className="split-table">
            {splitRows.map((r, i) => (
              <div className="split-row" key={i}>
                <span className="idx">#{i + 1}</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="重量 kg"
                  value={r.weight}
                  onChange={(e) => handleSplitRow(i, "weight", e.target.value)}
                />
                <select
                  value={r.grade}
                  onChange={(e) => handleSplitRow(i, "grade", e.target.value)}
                >
                  <option value="">暂不分级</option>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}级</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <button className="btn-primary" onClick={doSplit}>
            ✓ 执行拆分
          </button>
        </section>

        <section className="card full">
          <h4>💰 叫价记录</h4>

          {!batch.finalBuyer && (
            <div className="bid-input-row">
              <input
                type="text"
                placeholder="买家名称"
                value={bidBuyer}
                onChange={(e) => setBidBuyer(e.target.value)}
              />
              <input
                type="number"
                step="0.5"
                placeholder="单价 元/kg"
                value={bidPrice}
                onChange={(e) => setBidPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doAddBid()}
              />
              <input
                type="text"
                placeholder="备注（可选）"
                value={bidNote}
                onChange={(e) => setBidNote(e.target.value)}
              />
              <button className="btn-primary" onClick={doAddBid}>
                ➕ 登记叫价
              </button>
            </div>
          )}

          {batch.bids.length === 0 ? (
            <div className="empty-tip">暂无叫价记录</div>
          ) : (
            <table className="bid-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>买家</th>
                  <th>单价</th>
                  <th>总价</th>
                  <th>备注</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {[...batch.bids]
                  .sort((a, b) => b.pricePerKg - a.pricePerKg)
                  .map((bid, idx, arr) => (
                    <tr
                      key={bid.id}
                      className={idx === 0 ? "top-bid-row" : ""}
                    >
                      <td>{new Date(bid.timestamp).toLocaleTimeString("zh-CN")}</td>
                      <td>
                        {idx === 0 && "🏆 "}
                        <b>{bid.buyerName}</b>
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.5"
                          value={bid.pricePerKg}
                          disabled={!!batch.finalBuyer}
                          onChange={(e) =>
                            updateBid(batch.id, bid.id, parseFloat(e.target.value) || 0)
                          }
                        />
                        <span className="unit">元/kg</span>
                      </td>
                      <td>¥{(bid.pricePerKg * batch.weightKg).toFixed(2)}</td>
                      <td className="note">{bid.note || "—"}</td>
                      <td>
                        {!batch.finalBuyer && (
                          <>
                            <button
                              className="btn-success small"
                              onClick={() => doConfirmSale(bid.buyerName, bid.pricePerKg)}
                            >
                              ✓ 成交
                            </button>
                            <button
                              className="btn-danger small"
                              onClick={() => removeBid(batch.id, bid.id)}
                            >
                              撤回
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {batch.finalBuyer && (
            <div className="sold-banner">
              <div>
                <span className="tag">✅ 已成交</span>
                <b> {batch.finalBuyer}</b>
                <span> · 单价 </span>
                <b>¥{batch.finalPricePerKg}/kg</b>
                <span> · 总价 </span>
                <b className="total">¥{soldTotal}</b>
              </div>
              <button className="btn-warning small" onClick={() => revokeSale(batch.id)}>
                ↩ 撤回成交
              </button>
            </div>
          )}

          {!batch.finalBuyer && batch.bids.length > 0 && (
            <div className="quick-buttons">
              <span className="hint">补录成交价：</span>
              <button
                className="btn-accent"
                onClick={() => {
                  const buyer = prompt("买家名称：");
                  if (!buyer) return;
                  const price = prompt("单价 元/kg：", String(batch.bids[0]?.pricePerKg || ""));
                  if (!price) return;
                  const p = parseFloat(price);
                  if (p > 0) doConfirmSale(buyer, p);
                }}
              >
                ✎ 手动补录成交
              </button>
            </div>
          )}
        </section>

        <section className="card full">
          <h4>
            ⚠️ 异常批次
            {batch.abnormalNote && (
              <span className="abnormal-inline">（{batch.abnormalNote}）</span>
            )}
          </h4>
          <div className="abnormal-row">
            <input
              type="text"
              placeholder="如：重量不足、冰鲜度异常、破损等…"
              value={abnormalText || batch.abnormalNote || ""}
              onChange={(e) => setAbnormalText(e.target.value)}
            />
            <button
              className={batch.abnormalNote ? "btn-warning" : "btn-danger"}
              onClick={doSetAbnormal}
            >
              {batch.abnormalNote ? "更新/清除异常" : "标记异常"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
