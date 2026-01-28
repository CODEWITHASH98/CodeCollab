import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Home, RefreshCw, AlertTriangle, FileQuestion } from "lucide-react";

/**
 * 404 Not Found Page
 */
export function NotFoundPage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                {/* Animated Icon */}
                <div className="mb-8 relative">
                    <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center animate-pulse">
                        <FileQuestion className="w-16 h-16 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary/30 rounded-full animate-ping" />
                </div>

                {/* Error Code */}
                <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400 mb-4">
                    404
                </h1>

                {/* Message */}
                <h2 className="text-2xl font-semibold text-white mb-2">
                    Page Not Found
                </h2>
                <p className="text-gray-400 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to="/">
                        <Button variant="primary" size="lg" className="w-full sm:w-auto">
                            <Home className="w-5 h-5 mr-2" />
                            Go Home
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto"
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    );
}

/**
 * 500 Server Error Page
 */
export function ServerErrorPage({ error, resetErrorBoundary }) {
    const handleRefresh = () => {
        if (resetErrorBoundary) {
            resetErrorBoundary();
        } else {
            window.location.reload();
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                {/* Animated Icon */}
                <div className="mb-8 relative">
                    <div className="w-32 h-32 mx-auto bg-gradient-to-br from-red-500/20 to-red-500/5 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-16 h-16 text-red-500 animate-bounce" />
                    </div>
                </div>

                {/* Error Code */}
                <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-4">
                    500
                </h1>

                {/* Message */}
                <h2 className="text-2xl font-semibold text-white mb-2">
                    Something Went Wrong
                </h2>
                <p className="text-gray-400 mb-8">
                    We're experiencing technical difficulties. Please try again.
                </p>

                {/* Error details in dev */}
                {error && process.env.NODE_ENV === 'development' && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-left">
                        <code className="text-red-400 text-sm break-all">{error.message}</code>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleRefresh}
                        className="w-full sm:w-auto"
                    >
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Try Again
                    </Button>
                    <Link to="/">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto">
                            <Home className="w-5 h-5 mr-2" />
                            Go Home
                        </Button>
                    </Link>
                </div>

                {/* Support Link */}
                <p className="mt-8 text-sm text-gray-500">
                    If the problem persists, please{" "}
                    <a href="mailto:support@example.com" className="text-primary hover:underline">
                        contact support
                    </a>
                </p>
            </div>
        </div>
    );
}

/**
 * Error Boundary Fallback Component
 */
export function ErrorFallback({ error, resetErrorBoundary }) {
    return <ServerErrorPage error={error} resetErrorBoundary={resetErrorBoundary} />;
}

export default { NotFoundPage, ServerErrorPage, ErrorFallback };
