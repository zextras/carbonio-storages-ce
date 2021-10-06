import {Static, Type} from "@sinclair/typebox";

export const DriveQueryStringType = Type.Object({
  type: Type.Optional(Type.Literal("drive")),
  node: Type.String(),
  version: Type.Number()
})

export const MailQueryStringType = Type.Object({
  type: Type.Literal("mail"),
  mailboxId: Type.Number(),
  id: Type.Number(),
  revision: Type.Number()
})

export const QueryStringType = Type.Union([DriveQueryStringType, MailQueryStringType])

export type QueryString = Static<typeof QueryStringType>
export type DriveQueryString = Static<typeof DriveQueryStringType>

export const ErrorType = Type.Object({
  statusCode: Type.Number(),
  error: Type.String(),
  message: Type.String()
})

export type Error = Static<typeof ErrorType>

export const LogLevelType = Type.Union([
    Type.Literal("trace"),
    Type.Literal("debug"),
    Type.Literal("info"),
    Type.Literal("warn"),
    Type.Literal("error"),
    Type.Literal("fatal")
])

export const LogLevelQueryStringType = Type.Object({
  level: LogLevelType
})

export type LogLevel = Static<typeof LogLevelType>

export type LogLevelQueryString = Static<typeof LogLevelQueryStringType>

export const LogLevelResponseType = LogLevelQueryStringType

export type LogLevelResponse = Static<typeof LogLevelResponseType>

