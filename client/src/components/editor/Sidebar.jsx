import { Files, Users, Settings, Hash } from "lucide-react";
import { cn } from "../../utils/cn";
import { Avatar } from "../ui/Avatar";

export function Sidebar({ activeTab, setActiveTab, participants }) {
    const tabs = [
        { id: "files", icon: Files, label: "Files" },
        { id: "users", icon: Users, label: "Team" },
        { id: "settings", icon: Settings, label: "Settings" },
    ];

    return (
        <aside className="w-16 flex flex-col items-center py-4 bg-background border-r border-white/5">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                        "p-3 rounded-xl mb-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        activeTab === tab.id
                            ? "bg-primary/10 text-primary"
                            : "text-gray-500 hover:text-white hover:bg-white/5"
                    )}
                    aria-label={tab.label}
                    aria-pressed={activeTab === tab.id}
                >
                    <tab.icon className="w-6 h-6" aria-hidden="true" />
                </button>
            ))}

            <div className="mt-auto flex flex-col gap-3">
                {participants.slice(0, 3).map((p, i) => (
                    <Avatar key={i} name={p.userName} size="sm" status="online" />
                ))}
            </div>
        </aside>
    );
}

export function SidebarPanel({ activeTab, participants }) {
    if (activeTab === "files") return <FileTree />;
    if (activeTab === "users") return <UserList participants={participants} />;
    return <div className="p-4 text-gray-500">Settings</div>;
}

function FileTree() {
    return (
        <div className="p-4 w-60 border-r border-white/5 bg-surface h-full">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Explorer</h3>
            <div className="space-y-1" role="list">
                <button
                    type="button"
                    className="w-full flex items-center gap-2 px-2 py-1.5 bg-primary/10 text-primary rounded text-sm font-medium text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-current="true"
                >
                    <Hash className="w-4 h-4" aria-hidden="true" />
                    <span>script.js</span>
                </button>
                <button
                    type="button"
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded text-sm transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    <Hash className="w-4 h-4" aria-hidden="true" />
                    <span>package.json</span>
                </button>
            </div>
        </div>
    );
}

function UserList({ participants }) {
    return (
        <div className="p-4 w-60 border-r border-white/5 bg-surface h-full">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Active Users</h3>
            <div className="space-y-3">
                {participants.map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Avatar name={p.userName} size="sm" status="online" />
                        <span className="text-sm text-gray-300 font-medium">{p.userName}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
