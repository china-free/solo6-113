import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { FishBatch, BidRecord, GradeLevel, AuctionState, BatchStatus } from "./types";

const STORAGE_KEY = "fish-auction-workbench-v1";

const defaultFishTypes = [
  "大黄鱼", "小黄鱼", "带鱼", "鲳鱼", "鱿鱼", "墨鱼",
  "梭子蟹", "青蟹", "对虾", "基围虾", "鲈鱼", "石斑鱼",
  "马鲛鱼", "鲅鱼", "多宝鱼", "鳗鱼", "海蜇", "蛤蜊",
];

const defaultBoatNames = [
  "浙渔12345", "浙渔67890", "闽渔11111", "苏渔22222",
  "粤渔33333", "鲁渔44444",
];

function loadState(): AuctionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.batches && parsed.rootBatchIds) {
        return {
          batches: parsed.batches,
          rootBatchIds: parsed.rootBatchIds,
          selectedBatchId: parsed.selectedBatchId ?? null,
          fishTypes: parsed.fishTypes ?? defaultFishTypes,
          boatNames: parsed.boatNames ?? defaultBoatNames,
        };
      }
    }
  } catch (e) {
    console.error("Failed to load state:", e);
  }
  return {
    batches: {},
    rootBatchIds: [],
    selectedBatchId: null,
    fishTypes: defaultFishTypes,
    boatNames: defaultBoatNames,
  };
}

function saveState(state: AuctionState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state:", e);
  }
}

function genBatchNo(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const d = now.getDate().toString().padStart(2, "0");
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${y}${m}${d}-${rand}`;
}

function deriveStatus(b: FishBatch): BatchStatus {
  if (b.abnormalNote) return "abnormal";
  if (b.finalBuyer) return "sold";
  if (b.bids.length > 0) return "bidding";
  if (b.grade) return "graded";
  if (b.children.length > 0) return "splitting";
  return "arrived";
}

interface StoreActions {
  createRootBatch: (data: { fishType: string; weightKg: number; boatName: string }) => string;
  splitBatch: (parentId: string, splits: { weightKg: number; grade?: GradeLevel }[]) => void;
  setGrade: (batchId: string, grade: GradeLevel | null) => void;
  addBid: (batchId: string, buyerName: string, pricePerKg: number, note?: string) => void;
  removeBid: (batchId: string, bidId: string) => void;
  updateBid: (batchId: string, bidId: string, pricePerKg: number) => void;
  confirmSale: (batchId: string, buyerName: string, pricePerKg: number) => void;
  revokeSale: (batchId: string) => void;
  setAbnormal: (batchId: string, note: string | null) => void;
  setRemark: (batchId: string, remark: string) => void;
  selectBatch: (batchId: string | null) => void;
  deleteBatch: (batchId: string) => void;
  updateWeight: (batchId: string, weightKg: number) => void;
  addFishType: (name: string) => void;
  addBoatName: (name: string) => void;
}

export const useAuctionStore = create<AuctionState & StoreActions>((set) => ({
  ...loadState(),

  createRootBatch: (data) => {
    const id = uuidv4();
    const batch: FishBatch = {
      id,
      parentId: null,
      rootId: id,
      batchNo: genBatchNo(),
      fishType: data.fishType,
      weightKg: data.weightKg,
      grade: null,
      status: "arrived",
      arrivalTime: Date.now(),
      boatName: data.boatName,
      bids: [],
      finalBuyer: null,
      finalPricePerKg: null,
      soldTime: null,
      abnormalNote: null,
      remark: "",
      children: [],
    };
    set((s) => {
      const next: AuctionState = {
        ...s,
        batches: { ...s.batches, [id]: batch },
        rootBatchIds: [id, ...s.rootBatchIds],
        selectedBatchId: id,
      };
      saveState(next);
      return next;
    });
    return id;
  },

  splitBatch: (parentId, splits) => {
    set((s) => {
      const parent = s.batches[parentId];
      if (!parent) return s;
      const newBatches: Record<string, FishBatch> = { ...s.batches };
      const childIds: string[] = [];
      splits.forEach((sp) => {
        const id = uuidv4();
        childIds.push(id);
        const status: BatchStatus = sp.grade ? "graded" : "splitting";
        newBatches[id] = {
          id,
          parentId,
          rootId: parent.rootId,
          batchNo: `${parent.batchNo}-${childIds.length}`,
          fishType: parent.fishType,
          weightKg: sp.weightKg,
          grade: sp.grade ?? null,
          status,
          arrivalTime: parent.arrivalTime,
          boatName: parent.boatName,
          bids: [],
          finalBuyer: null,
          finalPricePerKg: null,
          soldTime: null,
          abnormalNote: null,
          remark: "",
          children: [],
        };
      });
      newBatches[parentId] = {
        ...parent,
        children: [...parent.children, ...childIds],
        status: "splitting",
      };
      const next: AuctionState = { ...s, batches: newBatches };
      saveState(next);
      return next;
    });
  },

  setGrade: (batchId, grade) => {
    set((s) => {
      const b = s.batches[batchId];
      if (!b) return s;
      const updated: FishBatch = { ...b, grade, status: deriveStatus({ ...b, grade }) };
      const next: AuctionState = { ...s, batches: { ...s.batches, [batchId]: updated } };
      saveState(next);
      return next;
    });
  },

  addBid: (batchId, buyerName, pricePerKg, note) => {
    const bid: BidRecord = {
      id: uuidv4(),
      buyerName,
      pricePerKg,
      timestamp: Date.now(),
      note,
    };
    set((s) => {
      const b = s.batches[batchId];
      if (!b) return s;
      const updatedBids = [...b.bids, bid];
      const updated: FishBatch = {
        ...b,
        bids: updatedBids,
        status: deriveStatus({ ...b, bids: updatedBids }),
      };
      const next: AuctionState = { ...s, batches: { ...s.batches, [batchId]: updated } };
      saveState(next);
      return next;
    });
  },

  removeBid: (batchId, bidId) => {
    set((s) => {
      const b = s.batches[batchId];
      if (!b) return s;
      const bids = b.bids.filter((x) => x.id !== bidId);
      const updated: FishBatch = {
        ...b,
        bids,
        status: b.status === "sold" ? b.status : deriveStatus({ ...b, bids }),
      };
      const next: AuctionState = { ...s, batches: { ...s.batches, [batchId]: updated } };
      saveState(next);
      return next;
    });
  },

  updateBid: (batchId, bidId, pricePerKg) => {
    set((s) => {
      const b = s.batches[batchId];
      if (!b) return s;
      const bids = b.bids.map((x) =>
        x.id === bidId ? { ...x, pricePerKg, timestamp: Date.now() } : x
      );
      const updated: FishBatch = { ...b, bids };
      const next: AuctionState = { ...s, batches: { ...s.batches, [batchId]: updated } };
      saveState(next);
      return next;
    });
  },

  confirmSale: (batchId, buyerName, pricePerKg) => {
    set((s) => {
      const b = s.batches[batchId];
      if (!b) return s;
      const updated: FishBatch = {
        ...b,
        finalBuyer: buyerName,
        finalPricePerKg: pricePerKg,
        soldTime: Date.now(),
        status: "sold",
      };
      const next: AuctionState = { ...s, batches: { ...s.batches, [batchId]: updated } };
      saveState(next);
      return next;
    });
  },

  revokeSale: (batchId) => {
    set((s) => {
      const b = s.batches[batchId];
      if (!b) return s;
      const cleared: FishBatch = {
        ...b,
        finalBuyer: null,
        finalPricePerKg: null,
        soldTime: null,
      };
      const updated: FishBatch = { ...cleared, status: deriveStatus(cleared) };
      const next: AuctionState = { ...s, batches: { ...s.batches, [batchId]: updated } };
      saveState(next);
      return next;
    });
  },

  setAbnormal: (batchId, note) => {
    set((s) => {
      const b = s.batches[batchId];
      if (!b) return s;
      const withNote: FishBatch = { ...b, abnormalNote: note };
      const updated: FishBatch = { ...withNote, status: deriveStatus(withNote) };
      const next: AuctionState = { ...s, batches: { ...s.batches, [batchId]: updated } };
      saveState(next);
      return next;
    });
  },

  setRemark: (batchId, remark) => {
    set((s) => {
      const b = s.batches[batchId];
      if (!b) return s;
      const updated: FishBatch = { ...b, remark };
      const next: AuctionState = { ...s, batches: { ...s.batches, [batchId]: updated } };
      saveState(next);
      return next;
    });
  },

  selectBatch: (batchId) => {
    set((s) => {
      const next: AuctionState = { ...s, selectedBatchId: batchId };
      saveState(next);
      return next;
    });
  },

  deleteBatch: (batchId) => {
    set((s) => {
      const b = s.batches[batchId];
      if (!b) return s;
      const toDelete = new Set<string>();
      const walk = (id: string) => {
        toDelete.add(id);
        s.batches[id]?.children.forEach(walk);
      };
      walk(batchId);
      const newBatches: Record<string, FishBatch> = {};
      Object.entries(s.batches).forEach(([id, batch]) => {
        if (!toDelete.has(id)) newBatches[id] = batch;
      });
      const newRoot = s.rootBatchIds.filter((id) => !toDelete.has(id));
      if (b.parentId && newBatches[b.parentId]) {
        newBatches[b.parentId] = {
          ...newBatches[b.parentId],
          children: newBatches[b.parentId].children.filter((c) => !toDelete.has(c)),
        };
      }
      const next: AuctionState = {
        ...s,
        batches: newBatches,
        rootBatchIds: newRoot,
        selectedBatchId: s.selectedBatchId && toDelete.has(s.selectedBatchId) ? null : s.selectedBatchId,
      };
      saveState(next);
      return next;
    });
  },

  updateWeight: (batchId, weightKg) => {
    set((s) => {
      const b = s.batches[batchId];
      if (!b) return s;
      const updated: FishBatch = { ...b, weightKg };
      const next: AuctionState = { ...s, batches: { ...s.batches, [batchId]: updated } };
      saveState(next);
      return next;
    });
  },

  addFishType: (name) => {
    set((s) => {
      if (s.fishTypes.includes(name)) return s;
      const next: AuctionState = { ...s, fishTypes: [...s.fishTypes, name] };
      saveState(next);
      return next;
    });
  },

  addBoatName: (name) => {
    set((s) => {
      if (s.boatNames.includes(name)) return s;
      const next: AuctionState = { ...s, boatNames: [...s.boatNames, name] };
      saveState(next);
      return next;
    });
  },
}));
