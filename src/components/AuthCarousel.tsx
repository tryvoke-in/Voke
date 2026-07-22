import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Brain, Sparkles, TrendingUp, Users, Shield } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import { useState, useEffect, useRef } from "react";
import { type CarouselApi } from "@/components/ui/carousel";

export const AuthCarousel = () => {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const plugin = useRef(
        Autoplay({ delay: 3000, stopOnInteraction: false })
    );

    useEffect(() => {
        if (!api) {
            return;
        }

        setCurrent(api.selectedScrollSnap());

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);

    const features = [
        {
            icon: Brain,
            title: "AI-Powered Interviews",
            description: "Practice with advanced AI that adapts to your skill level and provides instant, personalized feedback.",
            color: "text-violet-500",
            bg: "bg-violet-500/10",
        },
        {
            icon: Sparkles,
            title: "Real-time Feedback",
            description: "Get detailed insights on your answers, body language, and tone to improve your interview presence.",
            color: "text-fuchsia-500",
            bg: "bg-fuchsia-500/10",
        },
        {
            icon: TrendingUp,
            title: "Track Your Growth",
            description: "Monitor your progress over time with detailed analytics and performance metrics.",
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            icon: Users,
            title: "Peer Mock Interviews",
            description: "Connect with other job seekers for realistic peer-to-peer mock interview sessions.",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
        },
    ];

    return (
        <div className="w-full h-full flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900/50">
            <Carousel
                setApi={setApi}
                plugins={[plugin.current]}
                className="w-full max-w-md"
                onMouseEnter={plugin.current.stop}
                onMouseLeave={plugin.current.reset}
            >
                <CarouselContent>
                    {features.map((feature, index) => (
                        <CarouselItem key={index}>
                            <div className="p-6 flex flex-col items-center text-center space-y-6">
                                <div className={`w-20 h-20 rounded-2xl ${feature.bg} flex items-center justify-center mb-4`}>
                                    <feature.icon className={`w-10 h-10 ${feature.color}`} />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {feature.title}
                                </h2>
                                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <div className="hidden md:flex justify-center gap-2 mt-8">
                    {features.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => api?.scrollTo(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${index === current
                                ? "bg-violet-600 w-8"
                                : "bg-gray-300 dark:bg-gray-700 w-2 hover:bg-violet-400"
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </Carousel>
        </div>
    );
};
