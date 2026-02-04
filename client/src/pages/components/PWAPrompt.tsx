import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import toast from 'react-hot-toast';

export default function PWAPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r: ServiceWorkerRegistration | undefined) {
            console.log('SW Registered: ', r);
        },
        onRegisterError(error: Error) {
            console.log('SW registration error', error);
        },
    });

    useEffect(() => {
        if (offlineReady) {
            toast.success('App ready to work offline', {
                id: 'pwa-offline-ready',
            });
            setOfflineReady(false);
        }
    }, [offlineReady, setOfflineReady]);

    useEffect(() => {
        if (needRefresh) {
            toast(
                (t) => (
                    <div className="min-w-[280px] p-1">
                        <div className="space-y-1.5 mb-4">
                            <h3 className="text-white font-medium text-base tracking-tight">New update available</h3>
                            <p className="text-[#6b7280] text-[13px] leading-relaxed">
                                A fresh version is ready. Update to apply the latest improvements.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    updateServiceWorker(true);
                                    toast.dismiss(t.id);
                                }}
                                className="flex-1 h-10 flex items-center justify-center bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                Update
                            </button>
                            <button
                                onClick={() => {
                                    setNeedRefresh(false);
                                    toast.dismiss(t.id);
                                }}
                                className="flex-1 h-10 flex items-center justify-center bg-[#2a2a35] hover:bg-[#252533] text-white text-sm font-medium rounded-lg transition-colors border border-[#1f1f2e]"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                ),
                {
                    id: 'pwa-update-prompt',
                    duration: Infinity,
                    style: {
                        background: '#12121A',
                        color: '#FFFFFF',
                        border: '1px solid #1f1f2e',
                        borderRadius: '14px',
                    }
                }
            );
        }
    }, [needRefresh, setNeedRefresh, updateServiceWorker]);

    return null;
}
