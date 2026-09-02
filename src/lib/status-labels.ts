export const HEALTH_LABELS: Record<string, string> = {
  OK: "稼働中",
  WARNING: "警告",
  DOWN: "停止",
  ERROR: "エラー",
  UNKNOWN: "未報告",
};

export const HEALTH_COLORS: Record<string, string> = {
  OK: "bg-emerald-500",
  WARNING: "bg-amber-500",
  DOWN: "bg-slate-400",
  ERROR: "bg-red-500",
  UNKNOWN: "bg-slate-300",
};

export const HEALTH_TEXT_COLORS: Record<string, string> = {
  OK: "text-emerald-700 bg-emerald-50",
  WARNING: "text-amber-700 bg-amber-50",
  DOWN: "text-slate-700 bg-slate-100",
  ERROR: "text-red-700 bg-red-50",
  UNKNOWN: "text-slate-500 bg-slate-50",
};

export const KIND_LABELS: Record<string, string> = {
  WEB_APP: "Webアプリ",
  AGENT: "常駐エージェント",
  SCHEDULED_BATCH: "スケジュール実行バッチ",
};

export const DEV_STATUS_LABELS: Record<string, string> = {
  PLANNING: "構想中",
  IN_DEVELOPMENT: "開発中",
  ACTIVE: "稼働中",
  PAUSED: "一時停止",
  DEPRECATED: "廃止",
};

export const RUN_MODE_LABELS: Record<string, string> = {
  ALWAYS_ON: "常時稼働",
  SCHEDULED: "定時スケジュール",
  MANUAL: "手動トリガー",
};
