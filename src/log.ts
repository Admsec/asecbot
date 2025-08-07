import * as winston from "winston";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

const logPath = join(process.cwd(), "log");
if (!existsSync(logPath)) mkdirSync(logPath);
const logFileName = join(logPath, new Date().toLocaleString().split(" ")[0].replace(/\//g, "-") + ".log");
const alignColorsAndTime = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: "YY-MM-DD HH:mm:ss"
    }),
    winston.format.colorize({
        all: true,
    }),
    winston.format.printf(
        info => `${info.level} ${info.timestamp} ${info.message}`
    )
);

export const log = winston.createLogger({
    level: "info",
    transports: [
        new (winston.transports.Console)({
            format: winston.format.combine(winston.format.colorize(), alignColorsAndTime)
        }),
        new winston.transports.File({ filename: logFileName })
    ],
});
