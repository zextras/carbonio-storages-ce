// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {describe, it, expect} from 'vitest';
import {AWSV4SignatureAuth} from "../../node/auth/AWSV4SignatureAuth";
import {testApplication} from "../TestApplication";

const node = "443c815e-6b88-47b1-800f-d74d2d3004bf"
const version = "29"
const query = {node, version}
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
  authorization
}

describe("AWSV4SignatureAuthTest", () => {
  it("parse authentication header", async () => {
    const [parsedAccessKey, parsedSignature] = AWSV4SignatureAuth.parseAuthenticationHeader(authorization, scope)
    expect(parsedAccessKey).toBe(accessKey)
    expect(parsedSignature).toBe(signature)
  })

  it("calculate signature", async () => {
    const credentials: any = {}
    credentials[accessKey] = secret
    AWSV4SignatureAuth.getSignedHeaders(headers)
    expect(
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
        )
    ).toBe(signature)
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
        return testHeaders
      }
    ],
    [
      "empty date header",
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

    describe(`failed authentication ${description}`, () => {
      it("should return 401", async () => {
        const credentials: any = {}
        credentials[accessKey] = secret
        // tslint:disable-next-line: no-empty
        const server = await testApplication({teardown: () => {}}, {awsv4signature: credentials});
        const response = await server.inject({
          method: "GET",
          url: `download?node=${node}&version=${version}`,
          headers: getHeaders()
        });
        expect(response.statusCode).toBe(401);
      })
    })
  }
})
