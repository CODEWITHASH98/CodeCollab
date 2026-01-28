/**
 * Confirmation Modal Component
 * 
 * A reusable modal for confirming destructive actions.
 * Supports customizable title, message, and button text.
 */

import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger', // 'danger' | 'warning' | 'info'
    loading = false,
}) {
    const variantStyles = {
        danger: {
            icon: 'text-red-500',
            button: 'bg-red-600 hover:bg-red-700',
        },
        warning: {
            icon: 'text-yellow-500',
            button: 'bg-yellow-600 hover:bg-yellow-700',
        },
        info: {
            icon: 'text-blue-500',
            button: 'bg-blue-600 hover:bg-blue-700',
        },
    };

    const styles = variantStyles[variant] || variantStyles.danger;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="flex flex-col items-center text-center">
                <div className={`p-3 rounded-full bg-white/5 mb-4 ${styles.icon}`}>
                    <AlertTriangle className="w-8 h-8" aria-hidden="true" />
                </div>

                <p className="text-gray-300 mb-6 max-w-sm">
                    {message}
                </p>

                <div className="flex gap-3 w-full">
                    <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        className={`flex-1 ${styles.button}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Please wait...' : confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

export default ConfirmationModal;
