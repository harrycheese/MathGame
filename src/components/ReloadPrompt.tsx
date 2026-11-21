import { useRegisterSW } from 'virtual:pwa-register/react'

export const ReloadPrompt = () => {
    // Check for updates every 60 minutes
    const period = 60 * 60 * 1000

    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(swUrl: string, r: ServiceWorkerRegistration | undefined) {
            console.log('SW Registered', swUrl)
            if (r) {
                // Ensure the service worker updates periodically
                setInterval(() => r.update(), period)
            }
        },
        onRegisterError(error: any) {
            console.log('SW registration error', error)
        },
    })

    const close = () => {
        setOfflineReady(false)
        setNeedRefresh(false)
    }

    if (!offlineReady && !needRefresh) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between p-4 bg-gray-900 border border-yellow-500/50 rounded-2xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
            <div className="flex-1 mr-4">
                {offlineReady ? (
                    <p className="text-sm font-bold text-white tracking-widest uppercase">
                        Six-7 is ready to play offline.
                    </p>
                ) : (
                    <p className="text-sm font-bold text-yellow-400 tracking-widest uppercase">
                        New version available!
                    </p>
                )}
            </div>

            <div className="flex gap-2">
                {needRefresh && (
                    <button
                        onClick={() => updateServiceWorker(true)}
                        className="px-4 py-2 text-xs font-black text-gray-900 bg-yellow-400 rounded-xl hover:bg-yellow-300 transition-colors"
                    >
                        RELOAD
                    </button>
                )}
                <button
                    onClick={() => close()}
                    className="px-4 py-2 text-xs font-bold text-gray-400 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                >
                    CLOSE
                </button>
            </div>
        </div>
    )
}
