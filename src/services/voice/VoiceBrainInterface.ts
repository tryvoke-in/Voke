export interface IVoiceBrain {
    generateNextQuestion(
        fullMessages: { role: 'user' | 'assistant' | 'system'; content: string }[],
        sysPrompt: string,
        addTokens: (promptTokens: number, completionTokens: number) => void
    ): Promise<{ text: string; apiLabel?: string }>;
}
