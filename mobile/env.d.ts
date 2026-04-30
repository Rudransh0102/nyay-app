// Minimal typing for Expo public env vars (avoids pulling full Node typings into RN)

declare const process: {
  env: Record<string, string | undefined>;
};
