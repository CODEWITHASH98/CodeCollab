import { useEffect, useState } from "react";
import { BarChart2, Clock, CheckCircle, AlertTriangle, Activity } from "lucide-react";
import { analyticsAPI } from "../../services/api";
import { Modal } from "../ui/Modal";

export function AnalyticsModal({ roomId, isOpen, onClose }) {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && roomId) {
            loadReport();
        }
    }, [isOpen, roomId]);

    const loadReport = async () => {
        try {
            setLoading(true);
            const response = await analyticsAPI.getReport(roomId);
            if (response.success) {
                setReport(response.data);
            } else {
                setError(response.error || "Failed to load report");
            }
        } catch {
            setError("Failed to load analytics");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Session Analytics" className="max-w-3xl">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400">Generating report...</p>
                </div>
            ) : error ? (
                <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-400">{error}</p>
                    <button onClick={loadReport} className="mt-4 px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                        Retry
                    </button>
                </div>
            ) : report ? (
                <div className="space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard icon={Clock} label="Duration" value={`${report.overview.duration} min`} color="blue" />
                        <StatCard icon={Activity} label="Executions" value={report.performance.totalExecutions} color="purple" />
                        <StatCard icon={CheckCircle} label="Success Rate" value={report.performance.successRate} color="green" />
                        <StatCard icon={AlertTriangle} label="Errors" value={report.performance.errors} color="red" />
                    </div>

                    {/* AI Feedback */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                            <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Strengths
                            </h4>
                            <ul className="space-y-2">
                                {report.analysis.strengths.length > 0 ? (
                                    report.analysis.strengths.map((item, i) => (
                                        <li key={i} className="text-sm text-green-300 flex items-start gap-2">
                                            <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full shrink-0"></span>
                                            {item}
                                        </li>
                                    ))
                                ) : <li className="text-sm text-gray-500 italic">No specific strengths detected</li>}
                            </ul>
                        </div>

                        <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
                            <h4 className="text-sm font-medium text-orange-400 mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Improvements
                            </h4>
                            <ul className="space-y-2">
                                {report.analysis.areasToImprove.length > 0 ? (
                                    report.analysis.areasToImprove.map((item, i) => (
                                        <li key={i} className="text-sm text-orange-300 flex items-start gap-2">
                                            <span className="mt-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full shrink-0"></span>
                                            {item}
                                        </li>
                                    ))
                                ) : <li className="text-sm text-gray-500 italic">No areas to improve detected</li>}
                            </ul>
                        </div>
                    </div>
                </div>
            ) : null}
        </Modal>
    );
}

function StatCard({ icon: Icon, label, value, color }) {
    const colors = {
        blue: "text-blue-400 bg-blue-400/10",
        purple: "text-purple-400 bg-purple-400/10",
        green: "text-green-400 bg-green-400/10",
        red: "text-red-400 bg-red-400/10",
        orange: "text-orange-400 bg-orange-400/10",
    };

    return (
        <div className="p-4 bg-surface rounded-lg border border-white/5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colors[color]}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</div>
        </div>
    );
}
