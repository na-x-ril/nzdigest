import { BrainCircuitIcon, ZapIcon } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

// definisikan array semua model
export const MODELS = [
  "gemini-flash",
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-120b",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "moonshotai/kimi-k2-instruct",
  "deepseek-r1-distill-llama-70b",
  "qwen/qwen3-32b",
] as const;

// otomatis jadi union dari isi array
export type Model = typeof MODELS[number];

// bikin subset GROQ
export const GROQ_MODELS = new Set<Model>([
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-120b",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "moonshotai/kimi-k2-instruct",
  "deepseek-r1-distill-llama-70b",
  "qwen/qwen3-32b",
]);

export const modelDisplayNames = {
  "gemini-flash": "Gemini Flash",
  "llama-3.3-70b-versatile": "LLaMA 3.3 70B",
  "openai/gpt-oss-120b": "GPT OSS 120B",
  "meta-llama/llama-4-scout-17b-16e-instruct": "LLaMA 4 Scout",
  "moonshotai/kimi-k2-instruct": "Kimi K2 Instruct",
  "deepseek-r1-distill-llama-70b": "DeepSeek R1",
  "qwen/qwen3-32b": "Qwen 3 32B",
} satisfies Record<Model, string>;

export const modelIcons: Record<Model, React.ElementType> = {
  "gemini-flash": BrainCircuitIcon,
  "llama-3.3-70b-versatile": ZapIcon,
  "openai/gpt-oss-120b": ZapIcon,
  "meta-llama/llama-4-scout-17b-16e-instruct": BrainCircuitIcon,
  "moonshotai/kimi-k2-instruct": BrainCircuitIcon,
  "deepseek-r1-distill-llama-70b": BrainCircuitIcon,
  "qwen/qwen3-32b": BrainCircuitIcon,
};

export interface ModelContextType {
  selectedModel: Model;
  setSelectedModel: Dispatch<SetStateAction<Model>>;
}