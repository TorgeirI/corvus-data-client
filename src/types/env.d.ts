/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_CLIENT_ID: string
  readonly VITE_AZURE_TENANT_ID: string
  readonly VITE_AZURE_REDIRECT_URI: string
  readonly VITE_ADX_CLUSTER_URL: string
  readonly VITE_ADX_DATABASE_NAME: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_OPENAI_MODEL: string
  readonly VITE_TEAMS_APP_ID: string
  readonly VITE_USE_MOCK_DATA: string
  readonly VITE_MOCK_VESSEL_COUNT: string
  readonly VITE_MOCK_DATA_DAYS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}