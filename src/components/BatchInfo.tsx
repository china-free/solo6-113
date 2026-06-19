import type { FishBatch, GradeLevel } from "../types";

const GRADES: GradeLevel[] = ["S", "A", "B", "C", "D"];

interface Props {
  batch: FishBatch;
  onUpdateWeight: (weightKg: number) => void;
  onSetRemark: (remark: string) => void;
  onSetGrade: (grade: GradeLevel | null) => void;
}

export function BatchInfo({
  batch,
  onUpdateWeight,
  onSetRemark,
  onSetGrade,
}: Props) {
  return (
    <>
      <section className="card">
        <h4>基础信息</h4>
        <div className="info-row">
          <span>重量</span>
          <input
            type="number"
            step="0.1"
            value={batch.weightKg}
            onChange={(e) =>
              onUpdateWeight(parseFloat(e.target.value) || 0)
            }
          />
          <span>kg</span>
        </div>
        <div className="info-row">
          <span>备注</span>
          <input
            type="text"
            placeholder="内部备注（不影响叫价）"
            value={batch.remark}
            onChange={(e) => onSetRemark(e.target.value)}
          />
        </div>
      </section>

      <section className="card">
        <h4>等级标注</h4>
        <div className="grade-picker">
          {GRADES.map((g) => (
            <button
              key={g}
              className={`grade-btn grade-${g} ${
                batch.grade === g ? "active" : ""
              }`}
              onClick={() =>
                onSetGrade(batch.grade === g ? null : g)
              }
            >
              {g}级
            </button>
          ))}
          {batch.grade === null && <span className="hint">未分级</span>}
        </div>
      </section>
    </>
  );
}
