import type { FishBatch } from "../types";

interface Props {
  batch: FishBatch;
  onRevoke: () => void;
}

export function SaleConfirmation({ batch, onRevoke }: Props) {
  if (!batch.finalBuyer) return null;

  const soldTotal = batch.finalPricePerKg
    ? (batch.finalPricePerKg * batch.weightKg).toFixed(2)
    : "—";

  return (
    <div className="sold-banner">
      <div>
        <span className="tag">✅ 已成交</span>
        <b> {batch.finalBuyer}</b>
        <span> · 单价 </span>
        <b>¥{batch.finalPricePerKg}/kg</b>
        <span> · 总价 </span>
        <b className="total">¥{soldTotal}</b>
      </div>
      <button className="btn-warning small" onClick={onRevoke}>
        ↩ 撤回成交
      </button>
    </div>
  );
}
