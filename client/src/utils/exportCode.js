export const downloadCode = (code, language, roomId) => {
  const extensions = {
    javascript: "js",
    python: "py",
    java: "java",
    cpp: "cpp",
    c: "c",
    typescript: "ts",
    go: "go",
    rust: "rs",
    html: "html",
    css: "css",
    php: "php",
    ruby: "rb",
    swift: "swift",
    kotlin: "kt",
    sql: "sql",
    shell: "sh",
  };

  const ext = extensions[language] || "txt";
  const filename = `codecollab-${roomId}-${Date.now()}.${ext}`;

  const blob = new Blob([code], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const copyFormattedCode = (code, language) => {
  const formatted = `\`\`\`${language}\n${code}\n\`\`\``;
  navigator.clipboard.writeText(formatted);
  return formatted;
};

export const shareAsGist = async () => {
  // Future implementation for GitHub Gist sharing
  // Requires GitHub API token
  console.log("Gist sharing - Coming soon!");
};
