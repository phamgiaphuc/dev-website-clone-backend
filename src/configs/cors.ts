import { DOMAIN_LIST } from "./environment"
import { logger } from "./logger";

export const corsOption = {
  origin: function(origin: string, callback: any) {
    if (DOMAIN_LIST.includes(origin)) {
      logger.info(`Origin ${origin} is accepted by CORS`)
      return callback(null, true);
    }
    return callback(null, false);
  },
  optionsSuccessStatus: 200,
  credentials: true
}