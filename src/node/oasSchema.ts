// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

export default function oasSchema(url:string, prefix:string, host:string) {
  return {
    routePrefix: prefix + "/swagger",
    openapi: {
      info: {
        title: 'Storages-CE Server',
        description: 'Storages-CE server',
        version: '0.0.0'
      },
      servers: [{
        url
      }],
      host,
      schemes: ['http']
    },
    staticCSP: false,
    exposeRoute: true
  }
}