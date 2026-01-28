import { useState, useRef, useEffect } from "react";
import { Download, Copy, Share2, FileCode } from "lucide-react";
import { Button } from "../ui/Button";
import { downloadCode, copyFormattedCode } from "../../utils/exportCode";

export function ExportMenu({ code, language, roomId, onSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownload = () => {
    downloadCode(code, language, roomId);
    setIsOpen(false);
    onSuccess("Code downloaded successfully!");
  };

  const handleCopyFormatted = () => {
    copyFormattedCode(code, language);
    setIsOpen(false);
    onSuccess("Formatted code copied to clipboard!");
  };

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(code);
    setIsOpen(false);
    onSuccess("Code copied to clipboard!");
  };

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="transition-[transform,box-shadow] hover:-translate-y-0.5"
      >
        <Download className="w-4 h-4 mr-2" aria-hidden="true" />
        Export
      </Button>

      {isOpen && (
        <div
          role="menu"
          className="absolute top-full mt-2 right-0 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in"
        >
          <div className="py-1">
            <button
              role="menuitem"
              onClick={handleDownload}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-gray-700"
            >
              <FileCode className="w-4 h-4" aria-hidden="true" />
              Download as File
            </button>

            <button
              role="menuitem"
              onClick={handleCopyFormatted}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-gray-700"
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
              Copy with Formatting
            </button>

            <button
              role="menuitem"
              onClick={handleCopyRaw}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-gray-700"
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
              Copy Raw Code
            </button>

            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

            <button
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onSuccess("Share feature coming soon!");
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-gray-700"
            >
              <Share2 className="w-4 h-4" aria-hidden="true" />
              Share as Gist
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
