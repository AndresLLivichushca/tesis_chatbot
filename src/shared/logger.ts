export const logInfo = (msg: string, extra?: any) => {
  console.log(`[INFO] ${msg}`, extra ?? '');
};

export const logError = (msg: string, extra?: any) => {
  console.error(`[ERROR] ${msg}`, extra ?? '');
};
