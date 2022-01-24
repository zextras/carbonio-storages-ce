// SPDX-FileCopyrightText: 2022 2021 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as Transport from "winston-transport";
import winston from "winston";
import {Config} from "./config/configuration";
import {LogLevel} from "./routes/types";

export class LoggerTransports {
    private constructor(readonly transports: Transport[], private level: LogLevel) {
        this.setLevel(this.level)
    }

    setLevel(level: LogLevel): void {
        this.level = level
        this.transports.forEach(t => t.level = this.level)
    }

    getLevel(): LogLevel {
        return this.level
    }

    static createTransports(config: Config): LoggerTransports {
        const defaultLevel = config.logging.defaultLevel as LogLevel;
        return  new LoggerTransports([
            new winston.transports.Console({
                ...config.logging,
                level: defaultLevel
            }),
            new winston.transports.DailyRotateFile({
                ...config.logging,
                level: defaultLevel
            })
        ], defaultLevel)
    }
}