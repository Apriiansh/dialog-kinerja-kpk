"use client";

import { CheckCircleIcon, XCircleIcon, ChartPieSliceIcon, CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

export type AnalyticsItem = {
  id: number;
  jenis_aspek: string;
  dialog_evaluasi: string;
  is_tercapai: boolean;
};

export type EmployeeAnalytics = {
  pegawaiId: number;
  nama_pegawai: string;
  npp: string;
  tercapaiCount: number;
  tidakTercapaiCount: number;
  items: AnalyticsItem[];
};

export type EvalAnalyticsItem = {
  jenis_aspek: string;
  items: {
    evaluasi: string;
    tercapai: number;
    tidakTercapai: number;
  }[];
};

interface AchievementListProps {
  analytics: EmployeeAnalytics[];
  evalAnalytics: EvalAnalyticsItem[];
  totalTercapai: number;
  totalTidakTercapai: number;
}

const ASPEK_LABELS: Record<string, string> = {
  SKP: "Sasaran Kinerja Pegawai (SKP)",
  PERILAKU: "Perilaku Kerja",
  KARIR_PENDEK: "Pengembangan Karir (Jangka Pendek)",
  KARIR_MENENGAH: "Pengembangan Karir (Jangka Menengah)",
  GAP_ASESMEN: "Gap Asesmen"
};

export function AchievementList({ analytics, evalAnalytics, totalTercapai, totalTidakTercapai }: AchievementListProps) {
  const [activeTab, setActiveTab] = useState<"pegawai" | "evaluasi">("pegawai");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const total = totalTercapai + totalTidakTercapai;
  const tercapaiPercent = total > 0 ? Math.round((totalTercapai / total) * 100) : 0;
  const tidakPercent = total > 0 ? 100 - tercapaiPercent : 0;
  
  return (
    <div className="flex flex-col gap-6">
      {/* Stats Summary */}
      <div className="flex flex-col gap-3 p-4 rounded-lg bg-surface border border-outline">
        <div className="flex items-center gap-2 text-ink">
          <ChartPieSliceIcon size={20} className="text-primary" />
          <h4 className="font-semibold text-sm">Status Dialog Tahun Ini</h4>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-emerald-700">Tercapai ({totalTercapai})</span>
              <span className="text-red-700">Tidak Tercapai ({totalTidakTercapai})</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden flex bg-surface-muted border border-outline">
              {total > 0 && (
                <>
                  <div 
                    className="h-full bg-emerald-500" 
                    style={{ width: `${tercapaiPercent}%` }}
                  />
                  <div 
                    className="h-full bg-red-500" 
                    style={{ width: `${tidakPercent}%` }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-muted p-1 rounded-lg border border-outline self-start">
        <button
          onClick={() => setActiveTab("pegawai")}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
            activeTab === "pegawai" 
              ? "bg-white text-ink shadow-sm ring-1 ring-outline" 
              : "text-ink-muted hover:text-ink hover:bg-white/50"
          }`}
        >
          Analisis per Pegawai
        </button>
        <button
          onClick={() => setActiveTab("evaluasi")}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
            activeTab === "evaluasi" 
              ? "bg-white text-ink shadow-sm ring-1 ring-outline" 
              : "text-ink-muted hover:text-ink hover:bg-white/50"
          }`}
        >
          Analisis per Target Evaluasi
        </button>
      </div>

      {activeTab === "pegawai" && (
        <div>
        <h4 className="font-semibold text-sm text-ink mb-3">Analisis per Pegawai</h4>
        {analytics.length === 0 ? (
          <div className="py-6 flex items-center justify-center text-sm text-ink-muted border border-dashed border-outline rounded-lg">
            Belum ada evaluasi kinerja pegawai di tahun ini.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {analytics.map((emp) => {
              const isExpanded = expandedId === emp.pegawaiId;
              
              return (
                <li key={emp.pegawaiId} className="flex flex-col rounded-lg border border-outline bg-surface overflow-hidden">
                  <button 
                    onClick={() => setExpandedId(isExpanded ? null : emp.pegawaiId)}
                    className="flex items-center justify-between p-4 hover:bg-surface-muted transition-colors text-left"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-sm text-ink truncate">{emp.nama_pegawai}</span>
                      <span className="text-xs text-ink-muted">NPP: {emp.npp}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          {emp.tercapaiCount} Tercapai
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          {emp.tidakTercapaiCount} Tidak Tercapai
                        </span>
                      </div>
                      <div className="text-ink-muted flex items-center justify-center w-6 h-6 rounded-full bg-surface-muted border border-outline">
                        {isExpanded ? <CaretUpIcon size={14} weight="bold" /> : <CaretDownIcon size={14} weight="bold" />}
                      </div>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="p-4 border-t border-outline bg-surface-muted/30">
                      <div className="flex flex-col gap-4">
                        {Object.entries(
                          emp.items.reduce((acc, item) => {
                            if (!acc[item.jenis_aspek]) acc[item.jenis_aspek] = [];
                            acc[item.jenis_aspek].push(item);
                            return acc;
                          }, {} as Record<string, AnalyticsItem[]>)
                        ).map(([aspek, items]) => (
                          <div key={aspek} className="flex flex-col gap-2">
                            <h5 className="text-[11px] font-bold uppercase tracking-wider text-primary">
                              {ASPEK_LABELS[aspek] || aspek}
                            </h5>
                            <ul className="flex flex-col gap-2">
                              {items.map((item) => (
                                <li key={item.id} className="flex items-start gap-3 p-3 bg-white rounded-md border border-outline">
                                  <div className="shrink-0 mt-0.5">
                                    {item.is_tercapai ? (
                                      <CheckCircleIcon size={16} weight="fill" className="text-emerald-500" />
                                    ) : (
                                      <XCircleIcon size={16} weight="fill" className="text-red-500" />
                                    )}
                                  </div>
                                  <span className="text-sm text-ink leading-5 flex-1 break-words">
                                    {item.dialog_evaluasi || "Target tidak memiliki nama"}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      )}

      {/* Analytics Per Target */}
      {activeTab === "evaluasi" && (
        <div className="flex flex-col gap-6">
            {evalAnalytics.map((aspectGroup, index) => (
              <div key={aspectGroup.jenis_aspek} className="flex flex-col gap-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-primary">
                  {ASPEK_LABELS[aspectGroup.jenis_aspek] || aspectGroup.jenis_aspek}
                </h5>
                <ul className="flex flex-col gap-3">
                  {aspectGroup.items.map((item, i) => {
                    const total = item.tercapai + item.tidakTercapai;
                    const tPercent = Math.round((item.tercapai / total) * 100);
                    
                    return (
                      <li key={i} className="flex flex-col gap-2 p-4 bg-surface rounded-lg border border-outline shadow-sm">
                        <span className="text-sm font-medium text-ink leading-5 break-words">
                          {item.evaluasi}
                        </span>
                        
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex-1 flex flex-col gap-1">
                            <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-surface-muted border border-outline">
                              <div className="h-full bg-emerald-500" style={{ width: `${tPercent}%` }} />
                              <div className="h-full bg-red-500" style={{ width: `${100 - tPercent}%` }} />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0 text-xs">
                            <span className="font-semibold text-emerald-700">{item.tercapai} Tercapai</span>
                            <span className="text-outline-strong">•</span>
                            <span className="font-semibold text-red-700">{item.tidakTercapai} Tidak Tercapai</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                
                {index < evalAnalytics.length - 1 && (
                  <hr className="my-2 border-outline-strong" />
                )}
              </div>
            ))}
          </div>
      )}
    </div>
  );
}
