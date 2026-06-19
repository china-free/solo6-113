import type { GradeLevel } from "../types";
import { useAuctionStore } from "../store";
import { BatchInfo } from "./BatchInfo";
import { BatchSplitter } from "./BatchSplitter";
import { BiddingHistory } from "./BiddingHistory";
import { SaleConfirmation } from "./SaleConfirmation";
import { AbnormalNote } from "./AbnormalNote";

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

  const handleConfirmSale = (buyer: string, price: number) => {
    if (
      !confirm(
        `确认以 ¥${price}/kg 卖给 ${buyer}？总价 ¥${(
          price * batch.weightKg
        ).toFixed(2)}`
      )
    ) {
      return;
    }
    confirmSale(batch.id, buyer, price);
  };

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
            <span>
              🕐 {new Date(batch.arrivalTime).toLocaleString("zh-CN")}
            </span>
            {batch.soldTime && (
              <span>
                💰 成交{" "}
                {new Date(batch.soldTime).toLocaleTimeString("zh-CN")}
              </span>
            )}
          </div>
        </div>
        <button
          className="btn-danger small"
          onClick={() => {
            if (
              confirm(
                `删除批次 ${batch.batchNo} 及其所有子批次？`
              )
            ) {
              deleteBatch(batch.id);
            }
          }}
        >
          🗑 删除
        </button>
      </div>

      <div className="detail-grid">
        <BatchInfo
          batch={batch}
          onUpdateWeight={(w) => updateWeight(batch.id, w)}
          onSetRemark={(r) => setRemark(batch.id, r)}
          onSetGrade={(g: GradeLevel | null) => setGrade(batch.id, g)}
        />

        <BatchSplitter
          batch={batch}
          onSplit={(splits) => splitBatch(batch.id, splits)}
        />

        <BiddingHistory
          batch={batch}
          onAddBid={(buyer, price, note) =>
            addBid(batch.id, buyer, price, note)
          }
          onUpdateBid={(bidId, price) => updateBid(batch.id, bidId, price)}
          onRemoveBid={(bidId) => removeBid(batch.id, bidId)}
          onQuickConfirm={handleConfirmSale}
        />

        <SaleConfirmation
          batch={batch}
          onRevoke={() => revokeSale(batch.id)}
        />

        <AbnormalNote
          batch={batch}
          onSetAbnormal={(note) => setAbnormal(batch.id, note)}
        />
      </div>
    </div>
  );
}
