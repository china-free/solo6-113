export type BatchStatus =
  | "arrived"
  | "splitting"
  | "graded"
  | "bidding"
  | "sold"
  | "abnormal";

export type GradeLevel = "S" | "A" | "B" | "C" | "D";

export interface BidRecord {
  id: string;
  buyerName: string;
  pricePerKg: number;
  timestamp: number;
  note?: string;
}

export interface FishBatch {
  id: string;
  parentId: string | null;
  rootId: string;
  batchNo: string;
  fishType: string;
  weightKg: number;
  grade: GradeLevel | null;
  status: BatchStatus;
  arrivalTime: number;
  boatName: string;
  bids: BidRecord[];
  finalBuyer: string | null;
  finalPricePerKg: number | null;
  soldTime: number | null;
  abnormalNote: string | null;
  remark: string;
  children: string[];
}

export interface AuctionState {
  batches: Record<string, FishBatch>;
  rootBatchIds: string[];
  selectedBatchId: string | null;
  fishTypes: string[];
  boatNames: string[];
}
