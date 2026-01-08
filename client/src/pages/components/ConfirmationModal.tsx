import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import type { ConfirmationModalProps } from "../../types/model.ts";

export function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isLoading = false, }: ConfirmationModalProps) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-md mx-4 bg-[#1A1A24] border border-[#2a2a35] rounded-xl shadow-xl animate-in fade-in zoom-in duration-200">

                <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a35]">
                    <h3 className="text-base md:text-lg font-semibold text-white">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4 text-gray-400 text-sm">{message}</div>
                <div className="flex justify-end gap-3 p-4 pt-0">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#2a2a35] transition-colors disabled:opacity-50">
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin text-white" />
                                Processing...
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
