import tap from "tap";
import {AWSV4SignatureAuth} from "../../node/auth/AWSV4SignatureAuth";
import {testApplication} from "../TestApplication";

const node = "443c815e-6b88-47b1-800f-d74d2d3004bf"
const version = "29"
const query = {node: node, version: version}
const accessKey = "AKIAIOSFODNN7EXAMPLE"
const secret = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
const url = `/slimstore/upload?node=${node}&version=${version}`
const signature = "3cf9d1f9545753472b526fff3f296ec266f3570a7892eb90e65239c048c3c566"
const region = AWSV4SignatureAuth.REGION
const service = AWSV4SignatureAuth.SERVICE
const scope = `20211015/${region}/${service}/aws4_request`
const signedHeaders = new Set(["host", "x-amz-content-sha256", "x-amz-date"])
const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${Array.from(signedHeaders).join(";")}, Signature=${signature}`
const longDate = "20211015T091435Z"
const payloadHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
const headers = {
  "host": "localhost:5794",
  "x-amz-content-sha256": payloadHash,
  "x-amz-date": longDate,
  authorization: authorization
}

tap.test("parse authentication header", async t => {
  const [parsedAccessKey, parsedSignature] = AWSV4SignatureAuth.parseAuthenticationHeader(authorization, scope)
  t.equal(parsedAccessKey, accessKey)
  t.equal(parsedSignature, signature)
})

tap.test("calculate signature", async t => {
  const credentials: any = {}
  credentials[accessKey] = secret
  AWSV4SignatureAuth.getSignedHeaders(headers)
  t.equal(
    await new AWSV4SignatureAuth(credentials)
      .calculateRequestSignature(
        "PUT",
        url,
        headers,
        signedHeaders,
        query,
        secret,
        payloadHash,
        longDate,
        region,
        service
      ),
    signature
  )
})

const testEnvironmentProviders: [string, () => any][] = [
  [
    "no auth header",
    () => {
      const testHeaders: any = {... headers}
      delete testHeaders.authorization
      return testHeaders
    }
  ],
  [
    "invalid auth header",
    () => {
      const testHeaders: any = {... headers}
      testHeaders.authorization = "test"
      return testHeaders
    }
  ],
  [
    "no date header",
    () => {
      const testHeaders: any = {... headers}
      delete testHeaders['x-amz-date']
      console.log(JSON.stringify(testHeaders))
      return testHeaders
    }
  ],
  [
    "no date header",
    () => {
      const testHeaders: any = {... headers}
      testHeaders['x-amz-date'] = ''
      return testHeaders
    }
  ],
  [
    "invalid date header",
    () => {
      const testHeaders: any = {... headers}
      testHeaders['x-amz-date'] = "test"
      return testHeaders
    }
  ],
  [
    "invalid signature",
    () => {
      const testHeaders: any = {... headers}
      testHeaders.authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=test`
      return testHeaders
    }
  ],
  [
    "invalid signed headers",
    () => {
      const testHeaders: any = {... headers}
      testHeaders.authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, Signature=${signature}`
      return testHeaders
    }
  ],
]

for(const environmentProviderConfig of testEnvironmentProviders) {
  const [description, getHeaders] = environmentProviderConfig

  tap.test(`failed authentication ${description}`, async t => {
    const credentials: any = {}
    credentials[accessKey] = secret
    const server = await testApplication(t, {awsv4signature: credentials});
    const response = await server.inject({
      method: "GET",
      url: `slimstore/download?node=${node}&version=${version}`,
      headers: getHeaders()
    });
    t.equal(response.statusCode,401)
  })
}