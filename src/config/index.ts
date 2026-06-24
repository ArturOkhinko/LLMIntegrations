import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  logLevel: string;
  logFile: string;
  usageLogFile: string;
  llm: {
    baseUrl: string;
    apiKey: string;
  };
}

const config: AppConfig = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || 'logs/app.log',
  usageLogFile: process.env.USAGE_LOG_FILE || 'logs/usage.log',
  llm: {
    baseUrl: process.env.LLM_BASE_URL || 'https://gptunnel.ru',
    apiKey: process.env.LLM_API_KEY || '',
  },
};

export default config;
