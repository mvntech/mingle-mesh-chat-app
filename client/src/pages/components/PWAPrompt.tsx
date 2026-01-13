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
        onRegisterError(error: any) {
            console.log('SW registration error', error);
        },
    });
    useEffect(() => {
        if (offlineReady) {
            toast.success('App ready to work offline!', {
                id: 'pwa-offline-ready',
            });
            setOfflineReady(false);
        }
    }, [offlineReady, setOfflineReady]);
    useEffect(() => {
        if (needRefresh) {
            toast(
                (t) => (
                    <div className="flex flex-col gap-2 bg-[#12121A] p-2">
                        <span className="font-medium text-white text-xl">New version available!</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    updateServiceWorker(true);
                                    toast.dismiss(t.id);
                                }}
                                className="px-4 py-2 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                Update
                            </button>
                            <button
                                onClick={() => {
                                    setNeedRefresh(false);
                                    toast.dismiss(t.id);
                                }}
                                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#2a2a35] transition-colors disabled:opacity-50"
                            >
                                Close
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
                        border: '1px solid #2a2a35',
                    }
                }
            );
        }
    }, [needRefresh, setNeedRefresh, updateServiceWorker]);
    return null;
}
