import winston, { format, transports } from 'winston';
import { v4 as uuidv4 } from 'uuid';

export const logger = winston.createLogger({
  level: 'info',
  defaultMeta: { 
    service: 'DevServer'
  },
  format: format.combine(
    format.metadata(),
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    })
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, metadata }) => {
          const { service, id, ...rest } = metadata;
          return `[${timestamp}] ${uuidv4()} ${metadata.service} - ${level} : ${message} ${Object.keys(rest).length > 0 ? ',' + JSON.stringify(rest) : ''}`
        })
      )
    }),
    // new transports.File({
    //   level: 'info',
    //   dirname: 'src/logs',
    //   filename: 'dev-infos.log',
    //   format: format.combine(format.json())
    // })
  ]
});