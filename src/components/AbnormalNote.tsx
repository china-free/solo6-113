import { useState } from "react";
import type { FishBatch } from "../types";

interface Props {
  batch: FishBatch;
  onSetAbnormal: (note: string | null) => void;
}

export function AbnormalNote({ batch, onSetAbnormal }: Props) {
  const [abnormalText, setAbnormalText] = useState("");

  const doSetAbnormal = () => {
    if (abnormalText.trim()) {
      onSetAbnormal(abnormalText.trim());
    } else {
      onSetAbnormal(null);
    }
    setAbnormalText("");
  };

  return (
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
  );
}
