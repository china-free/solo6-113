import { useState } from "react";
import { useAuctionStore } from "../store";

export function ArrivalPanel() {
  const { fishTypes, boatNames, addFishType, addBoatName, createRootBatch } = useAuctionStore();
  const [fishType, setFishType] = useState(fishTypes[0] ?? "");
  const [customFish, setCustomFish] = useState("");
  const [boatName, setBoatName] = useState(boatNames[0] ?? "");
  const [customBoat, setCustomBoat] = useState("");
  const [weight, setWeight] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalFish = fishType === "__custom" ? customFish.trim() : fishType;
    const finalBoat = boatName === "__custom" ? customBoat.trim() : boatName;
    const w = parseFloat(weight);
    if (!finalFish || !finalBoat || !w || w <= 0) return;
    if (fishType === "__custom" && finalFish) addFishType(finalFish);
    if (boatName === "__custom" && finalBoat) addBoatName(finalBoat);
    createRootBatch({ fishType: finalFish, boatName: finalBoat, weightKg: w });
    setWeight("");
    setCustomFish("");
    setCustomBoat("");
  };

  return (
    <form onSubmit={handleSubmit} className="arrival-panel">
      <h3>📦 到货登记</h3>
      <div className="form-grid">
        <label className="field">
          <span>渔船</span>
          <select value={boatName} onChange={(e) => setBoatName(e.target.value)}>
            {boatNames.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
            <option value="__custom">＋ 新增船名…</option>
          </select>
          {boatName === "__custom" && (
            <input
              type="text"
              placeholder="输入船名"
              value={customBoat}
              onChange={(e) => setCustomBoat(e.target.value)}
              autoFocus
            />
          )}
        </label>

        <label className="field">
          <span>鱼货种类</span>
          <select value={fishType} onChange={(e) => setFishType(e.target.value)}>
            {fishTypes.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
            <option value="__custom">＋ 新增种类…</option>
          </select>
          {fishType === "__custom" && (
            <input
              type="text"
              placeholder="输入种类名"
              value={customFish}
              onChange={(e) => setCustomFish(e.target.value)}
              autoFocus
            />
          )}
        </label>

        <label className="field">
          <span>总重量 (kg)</span>
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder="如: 120.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </label>
      </div>
      <button type="submit" className="btn-primary big">
        ➕ 登记到货批次
      </button>
    </form>
  );
}
