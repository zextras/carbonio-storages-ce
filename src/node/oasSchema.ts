export default function oasSchema(url:string, prefix:string, host:string) {
  console.log(url)
  return {
    routePrefix: prefix + "/swagger",
    openapi: {
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