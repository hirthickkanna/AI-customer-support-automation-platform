import React from "react";
import { Globe, PhoneCall, Mail, MessageSquareCode } from "lucide-react";

interface Channel {
  id: number;
  name: string;
  api_key?: string;
  webhook_url?: string;
  config_settings?: any;
  is_enabled: boolean;
}

interface IntegrationsViewProps {
  channels: Channel[];
  channelLogs: { timestamp: string; text: string; type: string }[];
  onToggleChannel: (channelId: number, isEnabled: boolean) => void;
  token: string;
  triggerToast: (text: string, type?: string) => void;
}

export default function IntegrationsView({
  channels,
  channelLogs,
  onToggleChannel,
  token,
  triggerToast
}: IntegrationsViewProps) {

  // Local helper to resolve channels by name keyword
  const findChannel = (keyword: string) => {
    return channels.find(c => c.name.toLowerCase().includes(keyword.toLowerCase()));
  };

  const widgetChan = findChannel("widget") || findChannel("website");
  const whatsappChan = findChannel("whatsapp");
  const emailChan = findChannel("email") || findChannel("imap");
  const slackChan = findChannel("slack");

  const renderStatusBadge = (chan?: Channel) => {
    if (!chan) return <span className="text-[10px] bg-slate-500/10 text-slate-400 px-2 py-0.5 rounded font-bold border border-slate-500/20">Loading</span>;
    return chan.is_enabled ? (
      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/20">Active</span>
    ) : (
      <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded font-bold border border-yellow-500/20">Setup</span>
    );
  };

  const renderActionButton = (chan?: Channel, actionLabel: string = "Configure") => {
    if (!chan) return <button className="w-full bg-[#ffffff08] border border-[#ffffff14] py-1.5 rounded text-[10px] text-slate-500 cursor-not-allowed">...</button>;
    return (
      <button 
        onClick={() => onToggleChannel(chan.id, !chan.is_enabled)}
        className={`w-full py-1.5 rounded text-[10px] font-semibold transition-all border ${
          chan.is_enabled 
            ? "bg-rose-500/10 hover:bg-rose-500/25 border-rose-500/25 text-rose-400" 
            : "bg-emerald-500/10 hover:bg-emerald-500/25 border-emerald-500/25 text-emerald-400"
        }`}
      >
        {chan.is_enabled ? "Deactivate" : "Activate Channel"}
      </button>
    );
  };

  return (
    <main className="p-4 lg:p-8 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        
        {/* Website Widget card */}
        <div className="glass-card p-6 space-y-3 flex flex-col justify-between min-h-[180px]">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Website widget</span>
              </h3>
              {renderStatusBadge(widgetChan)}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Integrated chat widget loaded on company HTML structures.
            </p>
            {widgetChan?.is_enabled && widgetChan?.config_settings?.widget_id && (
              <div className="text-[9px] text-slate-500 font-mono">
                ID: {widgetChan.config_settings.widget_id}
              </div>
            )}
          </div>
          <div>
            {renderActionButton(widgetChan, "Configure Widget")}
          </div>
        </div>

        {/* WhatsApp Card */}
        <div className="glass-card p-6 space-y-3 flex flex-col justify-between min-h-[180px]">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp API</span>
              </h3>
              {renderStatusBadge(whatsappChan)}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pipes incoming whatsapp customer chat triggers to database models.
            </p>
            {whatsappChan?.is_enabled && whatsappChan?.config_settings?.phone_number && (
              <div className="text-[9px] text-slate-500 font-mono">
                Num: {whatsappChan.config_settings.phone_number}
              </div>
            )}
          </div>
          <div>
            {renderActionButton(whatsappChan, "API Keys")}
          </div>
        </div>

        {/* IMAP/SMTP Email Card */}
        <div className="glass-card p-6 space-y-3 flex flex-col justify-between min-h-[180px]">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>IMAP/SMTP Node</span>
              </h3>
              {renderStatusBadge(emailChan)}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Translates raw inbound support mail triggers into open tickets.
            </p>
            {emailChan?.is_enabled && emailChan?.config_settings?.host && (
              <div className="text-[9px] text-slate-500 font-mono">
                Host: {emailChan.config_settings.host}
              </div>
            )}
          </div>
          <div>
            {renderActionButton(emailChan, "Connect Server")}
          </div>
        </div>

        {/* Slack Card */}
        <div className="glass-card p-6 space-y-3 flex flex-col justify-between min-h-[180px]">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <MessageSquareCode className="w-4 h-4 text-purple-400" />
                <span>Slack App</span>
              </h3>
              {renderStatusBadge(slackChan)}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pushes notifications to team Slack rooms on SLA failures.
            </p>
            {slackChan?.is_enabled && slackChan?.config_settings?.channel && (
              <div className="text-[9px] text-slate-500 font-mono">
                Chan: {slackChan.config_settings.channel}
              </div>
            )}
          </div>
          <div>
            {renderActionButton(slackChan, "Webhook URL")}
          </div>
        </div>

      </div>

      <div className="glass-card p-4 lg:p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">API Auditing logs</h2>
          <span className="text-[10px] bg-slate-500/10 text-slate-400 px-2 py-0.5 rounded border border-slate-500/20 font-mono">Live Sync</span>
        </div>
        <div className="font-mono text-[10px] bg-black/40 border border-[#ffffff0c] p-4 rounded-lg space-y-2 text-slate-400 transition-all duration-300">
          {channelLogs.length > 0 ? (
            channelLogs.map((log, index) => (
              <div 
                key={index} 
                className={`transition-all duration-300 ${log.type === "warning" ? "text-yellow-400" : "text-slate-400"}`}
              >
                [{log.timestamp}] {log.text}
              </div>
            ))
          ) : (
            <div className="text-slate-500 italic">No auditing logs fetched yet.</div>
          )}
        </div>
      </div>
    </main>
  );
}
