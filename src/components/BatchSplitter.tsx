import { useState } from "react";
import type { FishBatch, GradeLevel } from "../types";

const GRADES: GradeLevel[] = ["S", "A", "B", "C", "D"];

interface Props {
  batch: FishBatch;
  onSplit: (
    splits: { weightKg: number; grade?: GradeLevel }[]
  ) => void;
}

export function BatchSplitter({ batch, onSplit }: Props) {
  const [splitCount, setSplitCount] = useState(2);
  const [splitRows, setSplitRows] = useState<
    { weight: string; grade: GradeLevel | "" }[]
  >([{ weight: "", grade: "" }, { weight: "", grade: "" }]);

  const handleSplitCountChange = (n: number) => {
    const count = Math.max(2, Math.min(10, n));
    setSplitCount(count);
    const rows = [...splitRows];
    while (rows.length < count) rows.push({ weight: "", grade: "" });
    setSplitRows(rows.slice(0, count));
  };

  const handleSplitRow = (
    i: number,
    key: "weight" | "grade",
    value: string
  ) => {
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
      if (
        !confirm(
          `子批次总重 ${total}kg 与原批次 ${batch.weightKg}kg 不一致，是否继续？`
        )
      ) {
        return;
      }
    }
    onSplit(splits);
    setSplitRows([{ weight: "", grade: "" }, { weight: "", grade: "" }]);
    setSplitCount(2);
  };

  return (
    <section className="card full">
      <h4>
        ✂️ 批次拆分
        <span className="hint">
          {batch.children.length > 0 &&
            `（已有 ${batch.children.length} 个子批次，可继续追加）`}
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
            onChange={(e) =>
              handleSplitCountChange(parseInt(e.target.value) || 2)
            }
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
                <option key={g} value={g}>
                  {g}级
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <button className="btn-primary" onClick={doSplit}>
        ✓ 执行拆分
      </button>
    </section>
  );
}
