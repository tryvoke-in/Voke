import { motion } from "motion/react";

export function CreatingPlanLoader() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="relative flex flex-col items-center justify-center">
                {/* Expanding Waves */}
                {[0, 1, 2].map((index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0.5, scale: 0.8 }}
                        animate={{ opacity: 0, scale: 2.5 }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: index * 0.6,
                            ease: "easeOut",
                        }}
                        className="absolute w-32 h-32 rounded-full border border-violet-500/30 bg-violet-500/5 shadow-[0_0_30px_rgba(139,92,246,0.2)]"
                    />
                ))}

                {/* Central Core */}
                <div className="relative z-10 w-24 h-24 rounded-full bg-black border border-violet-500/50 flex items-center justify-center shadow-[0_0_50px_rgba(139,92,246,0.4)]">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-t-2 border-r-2 border-violet-400 opacity-80"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="w-12 h-12 rounded-full bg-violet-600 blur-md opacity-60"
                    />
                </div>

                {/* Text */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 text-center"
                >
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">
                        Creating Career Plan
                    </h2>
                    <motion.p
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-zinc-400 text-sm tracking-widest uppercase"
                    >
                        Analyzing Trajectory...
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
}
