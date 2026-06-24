import React from "react";

interface SentimentLog {
  timestamp: string;
  text: string;
  score: number;
  status: string;
}

interface SentimentLogsViewProps {
  sentimentLogs: SentimentLog[];
}

export default function SentimentLogsView({ sentimentLogs }: SentimentLogsViewProps) {
  return (
    <main className="p-4 lg:p-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="glass-card p-4 lg:p-6 lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-lg font-bold">Inbound Sentiment Logs</h2>
            <p className="text-xs text-slate-400">Continuously evaluating emotion score models. Messages flagging anger values above 0.75 are redirected.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-[#ffffff14] text-xs font-semibold text-slate-400">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Inbound message text</th>
                  <th className="py-3 px-4">Anger Metric</th>
                  <th className="py-3 px-4">Auto-Workflow Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ffffff0c] text-xs">
                {sentimentLogs.map((log, idx) => {
                  const angerColor = log.score > 0.75 ? "text-rose-400" : log.score > 0.4 ? "text-yellow-400" : "text-emerald-400";
                  const barBg = log.score > 0.75 ? "bg-rose-500" : log.score > 0.4 ? "bg-yellow-500" : "bg-emerald-500";
                  return (
                    <tr key={idx} className="hover:bg-[#ffffff02]">
                      <td className="py-4 px-4 font-mono text-slate-400">{log.timestamp}</td>
                      <td className="py-4 px-4 max-w-[200px] truncate text-slate-200">{log.text}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full ${barBg}`} style={{ width: `${log.score * 100}%` }}></div>
                          </div>
                          <span className={`font-bold ${angerColor}`}>{log.score.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          log.status === "Escalated" ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
                        }`}>{log.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card p-4 lg:p-6 space-y-4">
          <h3 className="text-sm font-bold">Emotion Escalations Active</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The automated sentiment analyzer filters PII and formats prompts. Score bounds determine routing pathways:
          </p>
          <ul className="text-xs space-y-2 text-slate-400 pl-4 list-disc">
            <li><strong>Anger &gt; 0.8</strong>: Prompts immediate assignment to Marcus Wright. Updates priority status indicator.</li>
            <li><strong>Joy &gt; 0.7</strong>: Automated CSAT collection invitation sent.</li>
          </ul>
        </div>

      </div>
    </main>
  );
}
