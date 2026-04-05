'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface ScoreOverlayProps {
    recentScore: {
        player: any;
        team: any;
        points: number;
        config: any;
    } | null;
}

/**
 * Full-screen overlay that animates when a player scores.
 * Config is driven by the scoring_animations Directus collection.
 */
export function ScoreOverlay({ recentScore }: ScoreOverlayProps) {
    return (
        <AnimatePresence>
            {recentScore && (
                <motion.div
                    initial={recentScore.config.overlay.initial || { opacity: 0 }}
                    animate={recentScore.config.overlay.animate || { opacity: 1 }}
                    exit={recentScore.config.overlay.exit || { opacity: 0, transition: { duration: 0.5 } }}
                    className="absolute inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-none"
                    style={{
                        background: recentScore.config.overlay.background || 'rgba(0,0,0,0.9)',
                        backdropFilter: `blur(${recentScore.config.overlay.backdropBlur || '10px'})`,
                    }}
                >
                    <motion.div
                        initial={recentScore.config.content.initial}
                        animate={recentScore.config.content.animate}
                        exit={recentScore.config.content.exit}
                        transition={recentScore.config.content.transition}
                        className="text-center flex flex-col items-center p-4 max-w-full"
                    >
                        <h2
                            className="text-xl md:text-2xl uppercase tracking-[0.3em] font-medium mb-2 text-center"
                            style={{ color: recentScore.team.primary_color || '#fff' }}
                        >
                            {recentScore.team.name}
                        </h2>

                        <h1 className="text-3xl md:text-5xl font-black uppercase text-white mb-4 drop-shadow-2xl text-center leading-tight">
                            {recentScore.player.name}
                        </h1>

                        <div className="relative">
                            <motion.div
                                initial={recentScore.config.score.initial}
                                animate={recentScore.config.score.animate}
                                transition={recentScore.config.score.transition}
                                className="text-6xl md:text-8xl font-black italic leading-none"
                                style={{
                                    color: recentScore.team.primary_color || '#fff',
                                    textShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                }}
                            >
                                +{recentScore.points}
                            </motion.div>

                            {/* Decorative elements from animation config */}
                            {recentScore.config.elements?.map((el: any, i: number) => (
                                <motion.div
                                    key={`el-${i}`}
                                    initial={el.initial}
                                    animate={el.animate}
                                    exit={el.exit}
                                    transition={el.transition}
                                    className="absolute inset-0 flex items-center justify-center text-4xl md:text-6xl pointer-events-none"
                                >
                                    {el.value}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
