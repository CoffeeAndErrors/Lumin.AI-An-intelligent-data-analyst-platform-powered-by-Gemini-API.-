import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import EDAExplorer from './components/EDAExplorer'
import DataStory from './components/DataStory'
import ChatWithData from './components/ChatWithData'

export default function App() {
    const { activeFeature } = useStore()

    return (
        <div className="flex h-screen bg-void overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        {activeFeature === 'eda' && (
                            <motion.div
                                key="eda"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                transition={{ duration: 0.2 }}
                            >
                                <EDAExplorer />
                            </motion.div>
                        )}
                        {activeFeature === 'story' && (
                            <motion.div
                                key="story"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                transition={{ duration: 0.2 }}
                            >
                                <DataStory />
                            </motion.div>
                        )}
                        {activeFeature === 'chat' && (
                            <motion.div
                                key="chat"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                <ChatWithData />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    )
}
