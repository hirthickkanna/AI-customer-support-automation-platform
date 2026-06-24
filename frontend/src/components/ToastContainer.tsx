import React from "react";
import { Check, AlertTriangle, Cpu } from "lucide-react";

interface Toast {
  id: number;
  text: string;
  type: string;
}

interface ToastContainerProps {
  toasts: Toast[];
}

export default function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[1000] flex flex-col gap-2">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 border min-w-[280px] animate-slide-in text-xs font-semibold leading-none ${
            toast.type === "success" ? "bg-[#0c1a12e6] border-emerald-500/30 text-emerald-400" :
            toast.type === "danger" ? "bg-[#250d0de6] border-rose-500/30 text-rose-400" :
            toast.type === "warning" ? "bg-[#251b0de6] border-yellow-500/30 text-yellow-400" :
            "bg-[#0e101be6] border-indigo-500/30 text-indigo-400"
          }`}
        >
          {toast.type === "success" && <Check className="w-4 h-4 shrink-0" />}
          {toast.type === "danger" && <AlertTriangle className="w-4 h-4 shrink-0" />}
          {toast.type === "warning" && <AlertTriangle className="w-4 h-4 shrink-0" />}
          {toast.type === "primary" && <Cpu className="w-4 h-4 shrink-0" />}
          <span>{toast.text}</span>
        </div>
      ))}
    </div>
  );
}
