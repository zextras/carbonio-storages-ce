export default function oasSchema(url:string, host:string) {
  return {
    routePrefix: url,
    swagger: {
      info: {
        title: 'Slimstore Server',
        description: 'Slimstore server',
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