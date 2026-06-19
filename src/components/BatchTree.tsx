import { useState } from "react";
import type { FishBatch, BatchStatus } from "../types";
import { useAuctionStore } from "../store";

const statusLabel: Record<BatchStatus, string> = {
  arrived: "已到港",
  splitting: "拆分中",
  graded: "已分级",
  bidding: "叫价中",
  sold: "已成交",
  abnormal: "异常",
};

const statusColor: Record<BatchStatus, string> = {
  arrived: "#1e88e5",
  splitting: "#fb8c00",
  graded: "#43a047",
  bidding: "#8e24aa",
  sold: "#2e7d32",
  abnormal: "#e53935",
};

interface Props {
  batch: FishBatch;
  depth: number;
}

function BatchNode({ batch, depth }: Props) {
  const { batches, selectBatch, selectedBatchId } = useAuctionStore();
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = batch.children.length > 0;
  const isSelected = selectedBatchId === batch.id;

  const topBid = batch.bids.length > 0
    ? batch.bids.reduce((a, b) => (b.pricePerKg > a.pricePerKg ? b : a))
    : null;

  return (
    <div className={`batch-node depth-${depth} ${isSelected ? "selected" : ""}`}>
      <div
        className="batch-row"
        onClick={() => selectBatch(batch.id)}
        style={{ paddingLeft: 8 + depth * 24 }}
      >
        {hasChildren ? (
          <span
            className="toggle"
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
          >
            {collapsed ? "▶" : "▼"}
          </span>
        ) : (
          <span className="toggle-placeholder" />
        )}

        <span className={`grade-badge grade-${batch.grade ?? "none"}`}>
          {batch.grade ?? "—"}
        </span>

        <span className="batch-no">{batch.batchNo}</span>
        <span className="fish-type">{batch.fishType}</span>
        <span className="weight">{batch.weightKg}kg</span>

        {topBid && !batch.finalBuyer && (
          <span className="top-bid">
            最高 <b>¥{topBid.pricePerKg}/kg</b> · {topBid.buyerName}
          </span>
        )}

        {batch.finalBuyer && (
          <span className="final-price">
            ✅ 成交 ¥{batch.finalPricePerKg}/kg · {batch.finalBuyer}
          </span>
        )}

        {batch.abnormalNote && (
          <span className="abnormal-flag" title={batch.abnormalNote}>⚠ 异常</span>
        )}

        <span
          className="status-tag"
          style={{ background: statusColor[batch.status] }}
        >
          {statusLabel[batch.status]}
        </span>
      </div>

      {hasChildren && !collapsed && (
        <div className="batch-children">
          {batch.children.map((cid) => {
            const child = batches[cid];
            if (!child) return null;
            return <BatchNode key={cid} batch={child} depth={depth + 1} />;
          })}
        </div>
      )}
    </div>
  );
}

export function BatchTree() {
  const { batches, rootBatchIds } = useAuctionStore();
  return (
    <div className="batch-tree">
      <div className="tree-header">
        <h3>🌳 批次树</h3>
        <span className="hint">点击查看详情 · ▼ 展开子批次</span>
      </div>
      {rootBatchIds.length === 0 && (
        <div className="empty-tip">暂无到货批次，请在左侧登记</div>
      )}
      {rootBatchIds.map((rid) => {
        const b = batches[rid];
        if (!b) return null;
        return <BatchNode key={rid} batch={b} depth={0} />;
      })}
    </div>
  );
}
