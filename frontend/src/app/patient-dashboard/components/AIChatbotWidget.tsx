'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface AIChatbotWidgetProps {
    onOpen: () => void;
}

const AIChatbotWidget = ({ onOpen }: AIChatbotWidgetProps) => {
    const [isHydrated, setIsHydrated] = useState(false);

    useState(() => {
        setIsHydrated(true);
    });

    if (!isHydrated) {
        return (
            <div className="bg-gradient-to-br from-accent to-primary rounded-xl p-6 shadow-elevation-2">
                <div className="space-y-4">
                    <div className="h-6 bg-white/20 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-white/20 rounded animate-pulse w-full" />
                    <div className="h-10 bg-white/20 rounded animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-accent to-primary rounded-xl p-6 shadow-elevation-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />

            <div className="relative">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Icon name="SparklesIcon" variant="solid" size={24} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">
                            AI Health Assistant
                        </h3>
                        <div className="flex items-center space-x-1.5">
                            <div className="w-2 h-2 bg-success rounded-full animate-pulse-subtle" />
                            <span className="text-sm text-white/90">Online</span>
                        </div>
                    </div>
                </div>

                <p className="text-white/90 text-sm mb-6">
                    Get instant symptom assessment and personalized doctor recommendations powered by AI.
                </p>

                <button
                    onClick={onOpen}
                    className="w-full px-6 py-3 bg-white text-primary rounded-lg hover:shadow-elevation-3 active:scale-[0.97] transition-base font-medium flex items-center justify-center space-x-2"
                >
                    <Icon name="ChatBubbleLeftRightIcon" size={20} />
                    <span>Start Consultation</span>
                </button>
            </div>
        </div>
    );
};

export default AIChatbotWidget;