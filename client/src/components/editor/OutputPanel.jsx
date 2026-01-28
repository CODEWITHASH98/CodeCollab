import { Terminal, X } from "lucide-react";

export function OutputPanel({ output, onClose }) {
  return (
    <div className="h-full bg-[#0a0a0a] border-t border-white/10 flex flex-col font-mono text-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-surface/50 border-b border-white/5">
        <div className="flex items-center gap-2 text-gray-400">
          <Terminal className="w-4 h-4" />
          <span>Console Output</span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-auto scrollbar-thin">
        {output ? (
          <pre className="text-gray-300 whitespace-pre-wrap leading-relaxed">
            {output}
          </pre>
        ) : (
          <div className="text-gray-600 italic">
            $ Ready to execute...
          </div>
        )}
      </div>
    </div>
  );
}
