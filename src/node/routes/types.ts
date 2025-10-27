// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {Static, Type} from "@sinclair/typebox";

export const ChatsType = Type.Literal("chats")
export const FilesType = Type.Literal("files")

export const NodeIdType = Type.String({pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$'})

export const FilesQueryStringType = Type.Object({
  type: FilesType,
  node: NodeIdType,
  version: Type.Number()
})

export const ChatsQueryStringType = Type.Object({
  type: ChatsType,
  node: NodeIdType
})

export const QueryStringType = Type.Union([FilesQueryStringType, ChatsQueryStringType])

export type QueryString = Static<typeof QueryStringType>
export type FilesQueryString = Static<typeof FilesQueryStringType>
export type ChatsQueryString = Static<typeof ChatsQueryStringType>

export const ErrorType = Type.Object({
  statusCode: Type.Number(),
  error: Type.String(),
  message: Type.String()
})

export type Error = Static<typeof ErrorType>

// "fatal" | "error" | "warn" | "info" | "debug" | "trace"
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

export const CopyParametersType = Type.Object({
  type: Type.Union([ChatsType, FilesType]),
  sourceNode: NodeIdType,
  sourceVersion: Type.Optional(Type.Number()),
  destinationNode: NodeIdType,
  destinationVersion: Type.Optional(Type.Number()),
  override:Type.Optional(Type.Boolean())
})

export type CopyParameters = Static<typeof CopyParametersType>

export const UploadResponseType = Type.Object({
	query: Type.Object({}, {additionalProperties: true}),
	resource: Type.String(),
	size: Type.Number(),
	digest: Type.String(),
	digest_algorithm: Type.String()
})
