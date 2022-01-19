import {Static, Type} from "@sinclair/typebox";

export const DriveQueryStringType = Type.Object({
  type: Type.Literal("drive"),
  node: Type.String({pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$'}),
  version: Type.Number()
})

export const TeamQueryStringType = Type.Object({
  type: Type.Literal("team"),
  node: Type.String({pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$'})
})

export const QueryStringType = Type.Union([DriveQueryStringType, TeamQueryStringType])

export type QueryString = Static<typeof QueryStringType>
export type DriveQueryString = Static<typeof DriveQueryStringType>
export type TeamQueryString = Static<typeof TeamQueryStringType>

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

