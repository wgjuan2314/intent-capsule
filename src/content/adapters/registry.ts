import type { Adapter } from './types';
import ClaudeAdapter from './claude';
import ChatGPTAdapter, { OpenAIAdapter } from './chatgpt';
import GeminiAdapter from './gemini';
import {
  KimiAdapter,
  DeepSeekAdapter,
  DoubaoAdapter,
  QwenAdapter,
  GLMAdapter,
  MinimaxAdapter,
} from './china';

const ADAPTERS: Adapter[] = [
  ClaudeAdapter,
  ChatGPTAdapter,
  OpenAIAdapter,
  GeminiAdapter,
  KimiAdapter,
  DeepSeekAdapter,
  DoubaoAdapter,
  QwenAdapter,
  GLMAdapter,
  MinimaxAdapter,
];

export function getAdapter(): Adapter | null {
  const host = location.hostname;
  return ADAPTERS.find(a => host.includes(a.host)) ?? null;
}
