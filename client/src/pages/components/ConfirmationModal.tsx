import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import type { ConfirmationModalProps } from "../../types/model.ts";

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isLoading = false,
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/60 backdrop-blur-[2px]">
            <div className="relative w-full max-w-[360px] bg-[#12121A] border border-[#1f1f2e] rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute top-3 right-3 text-[#6b7280] hover:text-white transition-colors p-1 disabled:opacity-50"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="min-w-[280px] p-1">
                    <div className="space-y-1.5 mb-4 px-4 pt-4">
                        <h3 className="text-white font-medium text-base tracking-tight">
                            {title}
                        </h3>
                        <p className="text-[#6b7280] text-[13px] leading-relaxed">
                            {message}
                        </p>
                    </div>

                    <div className="flex gap-2 px-4 pb-4">
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 h-10 flex items-center justify-center bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                confirmText
                            )}
                        </button>

                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 h-10 flex items-center justify-center bg-[#2a2a35] hover:bg-[#252533] text-white text-sm font-medium rounded-lg transition-colors border border-[#1f1f2e] disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
