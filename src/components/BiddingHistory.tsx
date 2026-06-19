import { useState } from "react";
import type { FishBatch, BidRecord } from "../types";

interface Props {
  batch: FishBatch;
  onAddBid: (buyerName: string, pricePerKg: number, note?: string) => void;
  onUpdateBid: (bidId: string, pricePerKg: number) => void;
  onRemoveBid: (bidId: string) => void;
  onQuickConfirm: (buyer: string, price: number) => void;
}

export function BiddingHistory({
  batch,
  onAddBid,
  onUpdateBid,
  onRemoveBid,
  onQuickConfirm,
}: Props) {
  const [bidBuyer, setBidBuyer] = useState("");
  const [bidPrice, setBidPrice] = useState("");
  const [bidNote, setBidNote] = useState("");

  const doAddBid = () => {
    const price = parseFloat(bidPrice);
    if (!bidBuyer.trim() || !price || price <= 0) return;
    onAddBid(
      bidBuyer.trim(),
      price,
      bidNote.trim() || undefined
    );
    setBidPrice("");
    setBidNote("");
  };

  const doConfirmSale = (buyer: string, price: number) => {
    if (
      !confirm(
        `确认以 ¥${price}/kg 卖给 ${buyer}？总价 ¥${(
        price * batch.weightKg
      ).toFixed(2)}`
      )
    ) {
      return;
    }
    onQuickConfirm(buyer, price);
  };

  const sortedBids: BidRecord[] = [...batch.bids].sort(
    (a, b) => b.pricePerKg - a.pricePerKg
  );

  return (
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
            {sortedBids.map((bid, idx) => (
              <tr
                key={bid.id}
                className={idx === 0 ? "top-bid-row" : ""}
              >
                <td>
                  {new Date(bid.timestamp).toLocaleTimeString("zh-CN")}
                </td>
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
                      onUpdateBid(
                        bid.id,
                        parseFloat(e.target.value) || 0
                      )
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
                        onClick={() =>
                          doConfirmSale(bid.buyerName, bid.pricePerKg)
                        }
                      >
                        ✓ 成交
                      </button>
                      <button
                        className="btn-danger small"
                        onClick={() => onRemoveBid(bid.id)}
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

      {!batch.finalBuyer && batch.bids.length > 0 && (
        <div className="quick-buttons">
          <span className="hint">补录成交价：</span>
          <button
            className="btn-accent"
            onClick={() => {
              const buyer = prompt("买家名称：");
              if (!buyer) return;
              const price = prompt(
                "单价 元/kg：",
                String(batch.bids[0]?.pricePerKg || "")
              );
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
  );
}
