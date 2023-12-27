// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {Auth} from "./Auth";
import * as crypto from "crypto-js";
import {FastifyRequest} from "fastify/types/request";
import {createContext} from "../loggingutils";
import {AuthError} from "./AuthError";
import { DefaultFastifyInstance } from "../app";

export class AWSV4SignatureAuth implements Auth {
  private static readonly ALGORITHM_IDENTIFIER = "AWS4-HMAC-SHA256";
  private static readonly AMZ_DATE_HEADER = "x-amz-date";
  private static readonly KEY_TYPE_IDENTIFIER = "aws4_request";

  static readonly REGION = "us-east-1";
  static readonly SERVICE = "s3";

  constructor(private readonly credentials: any) {}

  async check(server: DefaultFastifyInstance, request: FastifyRequest): Promise<void> {
    server.log.debug("AWSV4 signature checks on request " + request.id)

    const authentication = request.headers["authorization"] as string;
    if (authentication === undefined || authentication === null || authentication.length === 0) {
      server.log.error(`[${createContext(request)}] Missing authentication header`)
      throw new AuthError()
    }

    const longDate = request.headers[AWSV4SignatureAuth.AMZ_DATE_HEADER] as string
    if (longDate === undefined || longDate === null || longDate.length === 0) {
      server.log.error(`[${createContext(request)}] Missing date header`)
      throw new AuthError()
    }

    const shortDate = longDate.split("T")[0]
    const scope = AWSV4SignatureAuth.getScope(shortDate, AWSV4SignatureAuth.REGION, AWSV4SignatureAuth.SERVICE)

    const [accessKey, signatureReceived] = AWSV4SignatureAuth.parseAuthenticationHeader(authentication, scope)

    if (!(accessKey in this.credentials)) {
      server.log.error(`[${createContext(request)}] Unknown access key ${accessKey}`)
      throw new AuthError()
    }

    const signedHeaders = AWSV4SignatureAuth.getSignedHeaders(request.headers)
    if (signedHeaders === undefined) {
      server.log.error(`[${createContext(request)}] Invalid signed headers`)
      throw new AuthError()
    }

    const signature = await this.calculateRequestSignature(
        request.method,
        request.url,
        request.headers,
        signedHeaders,
        request.query,
        this.credentials[accessKey],
        await AWSV4SignatureAuth.getPayloadHash(request),
        longDate,
        AWSV4SignatureAuth.REGION,
        AWSV4SignatureAuth.SERVICE
    )

    if (!(signature == signatureReceived)) {
      server.log.error(`[${createContext(request)}] invalid signature`)
      throw new AuthError()
    }
  }

  async calculateRequestSignature(
      method: string,
      url: string,
      headers: any,
      signedHeaders: Set<string>,
      query: any,
      secret: string,
      payloadHash: string,
      longDate: string,
      region: string,
      service: string
  ) : Promise<string> {
    const shortDate = AWSV4SignatureAuth.getShortDateFromLongDate(longDate)
    const scope = AWSV4SignatureAuth.getScope(shortDate, region, service)
    const canonicalHeaders = await AWSV4SignatureAuth.getCanonicalHeaders(headers, signedHeaders)
    const canonicalURL = AWSV4SignatureAuth.getCanonicalURL(url);
    const canonicalQuery = AWSV4SignatureAuth.getCanonicalQuery(query);
    const canonicalRequest = AWSV4SignatureAuth.getCanonicalRequest(
        method, canonicalQuery, canonicalURL, canonicalHeaders, payloadHash
    );
    const signingKey = await AWSV4SignatureAuth.getSigningKey(
        secret,
        shortDate,
        AWSV4SignatureAuth.REGION,
        AWSV4SignatureAuth.SERVICE
    );
    return AWSV4SignatureAuth.getSignature(
        longDate,
        scope,
        signingKey,
        canonicalRequest
    );
  }

  static getShortDateFromLongDate(longDate: string): string {
    return longDate.split("T")[0]
  }

  static parseAuthenticationHeader(authenticationHeader : string, scope: string) : [string, string] {
    let accessKey: string = ''
    let signature: string = ''

    for (const field of authenticationHeader.split(' ')) {
      if (field.startsWith("Credential=")) {
        accessKey = field.replace("Credential=", '').replace(',', '').replace(`/${scope}`, '')
      } else if (field.startsWith("Signature=")) {
        signature = field.replace("Signature=", '')
      }
    }

    return [accessKey, signature]
  }

  private static async getSigningKey(
      key: string, dateStamp: string, regionName: string, serviceName: string
  ) : Promise<CryptoJS.lib.WordArray> {
    const kDate = crypto.HmacSHA256(dateStamp, "AWS4" + key);
    const kRegion = crypto.HmacSHA256(regionName, kDate);
    const kService = crypto.HmacSHA256(serviceName, kRegion);
    return crypto.HmacSHA256(AWSV4SignatureAuth.KEY_TYPE_IDENTIFIER, kService);
  }

  private static async getPayloadHash(request: FastifyRequest): Promise<string> {
    return crypto.SHA256(request.body? request.body as any : '').toString();
  }

  private static getCanonicalURL(url: string) {
    const n = url.indexOf('?');
    return url.substring(0, n != -1 ? n : url.length);
  }

  static getSignedHeaders(headers: any): Set<string> | undefined {
    const signedHeaders : string | undefined =
        (headers["authorization"] as string).split(' ')
        .find((value) =>  value.startsWith("SignedHeaders="));

    if (signedHeaders === undefined) {
      return undefined
    }

    return new Set(signedHeaders.replace("SignedHeaders=", '')
    .replace(',', '')
    .split(';'))
  }

  private static async getCanonicalHeaders(
      headers: any,
      signedHeaders: Set<string>
  ) : Promise<any> {
    const canonical: any = {};
    for (const headerName of Object.keys(headers).sort()) {
      if (signedHeaders.has(headerName)) {
        const canonicalHeaderName = headerName.toLowerCase();
        canonical[canonicalHeaderName] = (headers[headerName] as string).trim().replace(/\s+/g, " ");
      }
    }
    return canonical;
  }

  private static getCanonicalRequest(
      method: string, canonicalQueryString: string, canonicalPath: string, canonicalHeaders: any, payloadHash: string
  ): string {
    const sortedHeaders = Object.keys(canonicalHeaders).sort();
    return [
      method,
      canonicalPath,
      canonicalQueryString,
      sortedHeaders.map((name) => `${name}:${canonicalHeaders[name]}`).join("\n") + '\n',
      sortedHeaders.join(";"),
      payloadHash
    ].join("\n")
  }

  private static async getSignature(
      longDate: string,
      credentialScope: string,
      signingKey: CryptoJS.lib.WordArray,
      canonicalRequest: string
  ): Promise<string> {
    const stringToSign = await this.createStringToSign(longDate, credentialScope, canonicalRequest);
    return crypto.HmacSHA256(stringToSign, await signingKey).toString();
  }

  private static async createStringToSign(
      longDate: string,
      credentialScope: string,
      canonicalRequest: string
  ): Promise<string> {
    return [
      AWSV4SignatureAuth.ALGORITHM_IDENTIFIER,
      longDate,
      credentialScope,
      crypto.SHA256(canonicalRequest).toString()
    ].join("\n")
  }

  private static escapeUri(uri: string): string {
    return encodeURIComponent(uri).replace(/[!'()*]/g, AWSV4SignatureAuth.hexEncode);
  }

  private static hexEncode(c: string) : string {
    return `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  };

  private static getCanonicalQuery(query: any): string {
    if (query === undefined || query === null || (typeof query === 'object' && Object.keys(query).length === 0)) {
      return ''
    }

    const keys: Array<string> = [];
    const serialized: { [key: string]: string } = {};
    for (const key of Object.keys(query).sort()) {
      keys.push(key);
      const value = query[key];
      if (typeof value === "string") {
        serialized[key] = `${AWSV4SignatureAuth.escapeUri(key)}=${AWSV4SignatureAuth.escapeUri(value)}`;
      } else if (Array.isArray(value)) {
        serialized[key] = value
        .slice(0)
        .sort()
        .reduce(
            (encoded: Array<string>, value: string) => encoded.concat([`${AWSV4SignatureAuth.escapeUri(key)}=${AWSV4SignatureAuth.escapeUri(value)}`]),
            []
        )
        .join("&");
      }
    }

    const canonicalQuery = keys
    .map((key) => serialized[key])
    .filter((serialized) => serialized) // omit any falsy values
    .join("&");

    if (canonicalQuery === undefined) {
      throw new Error("invalid query string")
    }

    return canonicalQuery
  }

  private static getScope(shortDate: string, region: string, service: string): string {
    return `${shortDate}/${region}/${service}/${AWSV4SignatureAuth.KEY_TYPE_IDENTIFIER}`;
  }
}

// import {Error} from "../routes/types";
