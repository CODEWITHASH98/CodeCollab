import { Play, Sparkles, Brain } from "lucide-react";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";
import { ExportMenu } from "./ExportMenu";
import { LANGUAGES } from "../../utils/constants";

export function EditorToolbar({
  language,
  setLanguage,
  onExecute,
  onHint,
  onReview,
  loading,
  code,
  roomId,
  onExportSuccess
}) {
  return (
    <div className="h-14 bg-surface border-b border-white/5 px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          aria-label="Select programming language"
          className="bg-[#0f0f0f] text-gray-300 text-sm font-medium px-3 py-1.5 rounded-lg border border-white/10 focus-visible:border-primary/50 focus-visible:outline-none transition-[border-color]"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>

        <div className="h-6 w-px bg-white/10 mx-2"></div>

        <Tooltip content="Get AI suggestions">
          <Button variant="ghost" size="sm" onClick={onHint}>
            <Sparkles className="w-4 h-4 mr-2 text-yellow-500" aria-hidden="true" />
            Hint
          </Button>
        </Tooltip>

        <Tooltip content="Full Code Review">
          <Button variant="ghost" size="sm" onClick={onReview}>
            <Brain className="w-4 h-4 mr-2 text-purple-500" aria-hidden="true" />
            Review
          </Button>
        </Tooltip>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:block">
          <ExportMenu
            code={code}
            language={language}
            roomId={roomId}
            onSuccess={onExportSuccess}
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={onExecute}
          disabled={loading}
          className="shadow-lg shadow-primary/20"
        >
          <Play className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : "fill-current"}`} aria-hidden="true" />
          {loading ? "Running…" : "Run Code"}
        </Button>
      </div>
    </div>
  );
}

