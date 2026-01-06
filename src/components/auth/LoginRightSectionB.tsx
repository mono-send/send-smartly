import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

const PREFIX = "Ask MonoSend to ";
const COMPLETIONS = [
    "build welcome email...",
    "replace SendGrid...",
    "build email workflows...",
    "run marketing campaign...",
];

export const LoginRightSectionB = () => {
    const [displayText, setDisplayText] = useState(PREFIX + COMPLETIONS[0]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const currentCompletion = COMPLETIONS[currentIndex];
        const targetText = PREFIX + currentCompletion;

        const timeout = setTimeout(() => {
            if (!isDeleting) {
                // Typing forward
                if (displayText.length < targetText.length) {
                    setDisplayText(targetText.slice(0, displayText.length + 1));
                } else {
                    // Finished typing, wait then start deleting
                    setTimeout(() => setIsDeleting(true), 2000);
                }
            } else {
                // Deleting back to prefix
                if (displayText.length > PREFIX.length) {
                    setDisplayText(displayText.slice(0, -1));
                } else {
                    // Finished deleting, move to next completion
                    setIsDeleting(false);
                    setCurrentIndex((prev) => (prev + 1) % COMPLETIONS.length);
                }
            }
        }, isDeleting ? 25 : 50); // Faster when deleting

        return () => clearTimeout(timeout);
    }, [displayText, currentIndex, isDeleting]);

    return (
        <div className="hidden lg:flex flex-1 items-center justify-center p-4">
            <div className="w-full h-full rounded-[32px] overflow-hidden relative flex items-center justify-center bg-gradient-to-br from-[#FFEEEE] via-[#DDEFBB] to-[#FF99CC]">
                {/* Custom Gradient Background matching the reference approximately 
            Reference has soft pinks, blues, yellows. 
            Let's try a better gradient mix.
        */}
                <div
                    className="absolute inset-0 bg-gradient-to-br from-white/40 via-blue-100/30 to-rose-200/40 backdrop-blur-3xl"
                    style={{
                        background: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)", // Fallback
                    }}
                >
                    {/* Overlay with the colorful blobs or mesh gradient simulation */}
                    <div className="absolute inset-0 opacity-80"
                        style={{
                            background: `
                        radial-gradient(circle at 15% 15%, rgba(255, 255, 230, 0.8) 0%, transparent 40%),
                        radial-gradient(circle at 85% 15%, rgba(230, 240, 255, 0.8) 0%, transparent 40%),
                        radial-gradient(circle at 15% 85%, rgba(255, 220, 230, 0.8) 0%, transparent 40%),
                        radial-gradient(circle at 85% 85%, rgba(255, 230, 200, 0.8) 0%, transparent 40%),
                        linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)
                    `
                        }}
                    >
                    </div>
                    {/* More vivid colors to match the provided image */}
                    <div className="absolute top-0 left-0 w-full h-full bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-indigo-200 via-slate-100 to-indigo-100 opacity-40 mix-blend-overlay"></div>
                    <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-[20%] left-[20%] w-[500px] h-[500px] bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                {/* Central Element mimicking the prompt bar */}
                <div className="relative z-10 w-full max-w-md">
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/50 flex items-center justify-between gap-4">
                        <div className="text-gray-800 text-base font-medium w-full pl-2">
                            {displayText}
                            <span className="w-0.5 h-4 bg-blue-500 inline-block ml-1 animate-pulse align-middle"></span>
                        </div>
                        <div className="bg-[#1a1f2c] rounded-full p-2 flex-shrink-0 text-white cursor-pointer hover:bg-black transition-colors">
                            <ArrowUp size={20} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
