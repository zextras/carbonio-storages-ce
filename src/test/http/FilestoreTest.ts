// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {describe, it, expect} from 'vitest'
import { testApplication, TestServer } from "../TestApplication";
import * as fs from "fs";
import FormData from "form-data"
import { Response as LightMyRequestResponse } from "light-my-request";
import { Readable } from "stream";
import { CopyParameters } from "../../node/routes/types";

function uploadURL(node: string, version: number) {
  return `upload?node=${node}&version=${version}&type=files`
}

function chatsUploadURL(node: string) {
  return `upload?node=${node}&type=chats`
}

function downloadURL(node: string, version: number) {
  return `download?node=${node}&version=${version}&type=files`
}

function chatsDownloadURL(node: string) {
  return `download?node=${node}&type=chats`
}

function deleteURL(node: string, version: number) {
  return `delete?node=${node}&version=${version}&type=files`
}

const deleteBulkURL = `bulk-delete?type=files`

function copyUrl(pars:Record<string, boolean | number | string> & CopyParameters) {
  const parts:string[] = []
  for (const k of Object.keys(pars)) {
    const v = pars[k]
    if (v !== undefined) {
      parts.push(`${k}=${encodeURIComponent(v)}`)
    }
  }
  return `copy?${parts.join("&")}`
}

export async function postFile(app: TestServer, path: string, node: string, version: number): Promise<LightMyRequestResponse> {
  const form = new FormData();
  form.append("", fs.createReadStream(path));
  return await app.inject({
    method: "POST",
    url: uploadURL(node, version),
    headers: form.getHeaders(),
    payload: form,
  });
}

export async function postChatsAttachment(app: TestServer, path: string, node: string): Promise<LightMyRequestResponse> {
  const form = new FormData();
  form.append("", fs.createReadStream(path));
  return await app.inject({
    method: "POST",
    url: chatsUploadURL(node),
    headers: form.getHeaders(),
    payload: form,
  });
}


export async function putFile(app: TestServer, path: string, node: string, version: number): Promise<LightMyRequestResponse> {
  const form = new FormData();
  form.append("", fs.createReadStream(path));
  return await app.inject({
    method: "PUT",
    url: uploadURL(node, version),
    headers: form.getHeaders(),
    payload: form,
  });
}

export async function downloadFile(app: TestServer, node: string, version: number): Promise<LightMyRequestResponse> {
  return await app.inject({
    method: "GET",
    url: downloadURL(node, version)
  });
}

export async function downloadChatsAttachment(app: TestServer, node: string): Promise<LightMyRequestResponse> {
  return await app.inject({
    method: "GET",
    url: chatsDownloadURL(node)
  });
}


export async function deleteFile(app: TestServer, node: string, version: number): Promise<LightMyRequestResponse> {
  return await app.inject({
    method: "DELETE",
    url: deleteURL(node, version)
  });
}

export async function deleteBulk(app: TestServer, ids:{node: string, version: number}[]): Promise<LightMyRequestResponse> {
  const payload = {ids}
  return await app.inject({ method: "POST", url: deleteBulkURL, payload });
}

export async function copy(app: TestServer, copyParameters:CopyParameters): Promise<LightMyRequestResponse> {
  return await app.inject({
    method: "PUT",
    url: copyUrl(copyParameters)
  });
}


export async function streamToString (stream: Readable): Promise<string> {
  const chunks: any = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  })
}

const testEnvironmentProviders: [string, (configPatch?: any) => Promise<TestServer>][] = [
  [" with default configuration", (configPatch) => {
    return testApplication(configPatch)}],
  [" with compressed store", (configPatch) => {
    return testApplication({compress: true, ...configPatch})}],
]

const sampleNode1: string = "443c815e-6b88-47b1-800f-d74d2d3004bf"
const sampleNode2: string = "999c815e-6b88-47b1-999f-d74d2d3004bf"
const sampleVersion: number = 2

for(const environmentProviderConfig of testEnvironmentProviders) {
  const [description, provider] = environmentProviderConfig

  describe(`FilestoreTest: upload & download ${description}`, () => {
    it("upload & download", async () => {
      const server = await provider()
      const filePath = `${process.cwd()}/src/test/resources/file.txt`

      const uploadResponse = await postFile(server, filePath, sampleNode1, sampleVersion);
      expect(uploadResponse.statusCode).toBe(200)

      const downloadResponse = await downloadFile(server, sampleNode1, sampleVersion);
      expect(downloadResponse.statusCode).toBe(200)
      const body = downloadResponse.body;
      expect(body).toBe(await streamToString(fs.createReadStream(filePath)))
    })
  })

  describe(`FilestoreTest: upload & delete ${description}`, () => {
    it("upload & delete", async () => {
      const server = await provider()
      const filePath = `${process.cwd()}/src/test/resources/file.txt`

      const uploadResponse = await postFile(server, filePath, sampleNode1, sampleVersion);
      expect(uploadResponse.statusCode).toBe(200)

      const deleteResponse = await deleteFile(server, sampleNode1, sampleVersion);
      expect(deleteResponse.statusCode).toBe(200)
    })
  })

  describe(`FilestoreTest: upload & copy ${description}`, () => {
    it("upload & copy", async () => {
      const server = await provider()
      const filePath = `${process.cwd()}/src/test/resources/file.txt`

      const uploadResponse = await postFile(server, filePath, sampleNode2, sampleVersion);
      expect(uploadResponse.statusCode).toBe(200)

      const copyResponse = await copy(server, {
        type: "files",
        sourceNode: sampleNode2,
        sourceVersion: sampleVersion,
        destinationNode: sampleNode1,
        destinationVersion: sampleVersion
      });
      expect(copyResponse.statusCode).toBe(200)

      const downloadResponse1 = await downloadFile(server, sampleNode2, sampleVersion);
      expect(downloadResponse1.statusCode).toBe(200)

      const downloadResponse2 = await downloadFile(server, sampleNode1, sampleVersion);
      expect(downloadResponse2.statusCode).toBe(200)
    })

    it("upload & copy again", async () => {
      const server = await provider()
      const filePath = `${process.cwd()}/src/test/resources/file.txt`
      const uploadResponse = await postFile(server, filePath, sampleNode2, sampleVersion);
      expect(uploadResponse.statusCode).toBe(200)

      const copyResponse = await copy(server, {
        type: "files",
        sourceNode: sampleNode2,
        sourceVersion: sampleVersion,
        destinationNode: sampleNode1,
        destinationVersion: sampleVersion
      });
      expect(copyResponse.statusCode).toBe(200)

      const downloadResponse1 = await downloadFile(server, sampleNode2, sampleVersion);
      expect(downloadResponse1.statusCode).toBe(200)

      const downloadResponse2 = await downloadFile(server, sampleNode1, sampleVersion);
      expect(downloadResponse2.statusCode).toBe(200)
    })
  })

  describe(`FilestoreTest: upload & copy chats ${description}`, () => {
    it("upload & copy chats", async () => {
      const server = await provider()
      const filePath = `${process.cwd()}/src/test/resources/file.txt`

      const uploadResponse = await postChatsAttachment(server, filePath, sampleNode2);
      expect(uploadResponse.statusCode).toBe(200)

      const copyResponse = await copy(server, {
        type: "chats",
        sourceNode: sampleNode2,
        destinationNode: sampleNode1,
      });
      expect(copyResponse.statusCode).toBe(200)

      const downloadResponse1 = await downloadChatsAttachment(server, sampleNode2);
      expect(downloadResponse1.statusCode).toBe(200)

      const downloadResponse2 = await downloadChatsAttachment(server, sampleNode1);
      expect(downloadResponse2.statusCode).toBe(200)
    })
  })

  describe(`FilestoreTest: upload & copy with override ${description}`, () => {
    it("upload & copy with override", async () => {
      const server = await provider()
      const filePath = `${process.cwd()}/src/test/resources/file.txt`

      const uploadResponse1 = await postFile(server, filePath, sampleNode1, sampleVersion);
      expect(uploadResponse1.statusCode).toBe(200)

      const uploadResponse2 = await postFile(server, filePath, sampleNode2, sampleVersion);
      expect(uploadResponse2.statusCode).toBe(200)

      const copyResponse = await copy(server, {
        type: "files",
        sourceNode: sampleNode2,
        sourceVersion: sampleVersion,
        destinationNode: sampleNode1,
        destinationVersion: sampleVersion,
        override: true
      });
      expect(copyResponse.statusCode).toBe(200)
    })
  })

  describe(`FilestoreTest: upload & copy fail because of override=false ${description}`, () => {
    it("upload & copy fail because of override=false", async () => {
      const server = await provider()
      const filePath = `${process.cwd()}/src/test/resources/file.txt`

      const uploadResponse1 = await postFile(server, filePath, sampleNode1, sampleVersion);
      expect(uploadResponse1.statusCode).toBe(200)

      const uploadResponse2 = await postFile(server, filePath, sampleNode2, sampleVersion);
      expect(uploadResponse2.statusCode).toBe(200)

      const copyResponse = await copy(server, {
        type: "files",
        sourceNode: sampleNode2,
        sourceVersion: sampleVersion,
        destinationNode: sampleNode1,
        destinationVersion: sampleVersion,
        override: false
      });
      expect(copyResponse.statusCode).toBe(409)

      const copyResponse1 = await copy(server, {
        type: "files",
        sourceNode: sampleNode2,
        sourceVersion: sampleVersion,
        destinationNode: sampleNode1,
        destinationVersion: sampleVersion,
        override: undefined
      });
      expect(copyResponse1.statusCode).toBe(409)
    })
  })

  describe(`FilestoreTest: copy fail because source does not exists ${description}`, () => {
    it("copy fail because source does not exists", async () => {
      const server = await provider()

      const copyResponse = await copy(server, {
        type: "files",
        sourceNode: sampleNode2,
        sourceVersion: sampleVersion,
        destinationNode: sampleNode1,
        destinationVersion: sampleVersion,
        override: false
      });
      expect(copyResponse.statusCode).toBe(404)
    })
  })

  describe(`FilestoreTest: POST ${description}`, () => {
    it("expect 409 error for same node/version", async () => {
      const server = await provider()
      const filePath = `${process.cwd()}/src/test/resources/file.txt`

      const uploadResponse = await postFile(server, filePath, sampleNode1, sampleVersion);
      expect(uploadResponse.statusCode).toBe(200)

      const upload2Response = await postFile(server, filePath, sampleNode1, sampleVersion);
      expect(upload2Response.statusCode).toBe(409)
    })

    it("PUT: upload twice the same node/version", async () => {
      const server = await provider()
      const filePath = `${process.cwd()}/src/test/resources/file.txt`

      const uploadResponse = await putFile(server, filePath, sampleNode1, sampleVersion);
      expect(uploadResponse.statusCode).toBe(200)

      const upload2Response = await putFile(server, filePath, sampleNode1, sampleVersion);
      expect(upload2Response.statusCode).toBe(200)
    })
  })

  describe(`FilestoreTest: upload file response contains hash and size ${description}`, () => {
    const calls = [putFile, postFile];
    for (const c of calls){
      it('upload file response contains hash and size', async () => {
        const server = await provider()
        const filePath = `${process.cwd()}/src/test/resources/file.txt`

        const uploadResponse = await c(server, filePath, sampleNode1, sampleVersion);
        expect(uploadResponse.statusCode).toBe(200)
        const responseBody = JSON.parse(uploadResponse.body);
        const digest = responseBody.digest
        expect(digest).toBe('4f5937de8e24e473df43503273b78e6e')

        const size = responseBody.size
        expect(size).toBe(17)
      })
    }
  })

  describe(`FilestoreTest: download missing resource ${description}`, () => {
    it("download missing resource", async () => {
      const server = await provider()

      const downloadResponse = await downloadFile(server, sampleNode1, sampleVersion);
      expect(downloadResponse.statusCode).toBe(404)
    })

    it("delete missing resource", async () => {
      const server = await provider()

      const deleteResponse = await deleteFile(server, sampleNode1, sampleVersion);
      expect(deleteResponse.statusCode).toBe(200)
    })
  })

  describe(`FilestoreTest: uploads & bulk delete ${description}`, () => {
    it("uploads & bulk delete", async () => {
      const server = await provider()
      const filePath = `${process.cwd()}/src/test/resources/file.txt`

      const ids = [...Array(9).keys()].map( d => ({
        node:`443c815e-6b88-47b1-800f-d74d2d3004b${d}`,
        version: sampleVersion
      }))
      for await (const {node:id, version} of ids) {
        const uploadResponse = await postFile(server, filePath, id, version);
        if (uploadResponse.statusCode !== 200) {
          throw new Error(`Upload failed ${JSON.stringify(uploadResponse, null, 2)}`)
        }
      }

      const deleteResponse = await deleteBulk(server, ids);
      expect(deleteResponse.statusCode).toBe(200)

      for await (const id of ids) {
        const downloadResponse = await downloadFile(server, id.node, id.version);
        expect(downloadResponse.statusCode).toBe(404)
      }
    })

    it("uploads & bulk delete, one file is not stored", async () => {
      const server = await provider()
      const filePath = `${process.cwd()}/src/test/resources/file.txt`

      const ids = [...Array(5).keys()].map( d => ({
        node:`443c815e-6b88-47b1-800f-d74d2d3004b${d}`,
        version: sampleVersion
      }))
      for await (const {node:id, version} of ids) {
        const uploadResponse = await postFile(server, filePath, id, version);
        if (uploadResponse.statusCode !== 200) {
          throw new Error(`Upload failed ${JSON.stringify(uploadResponse, null, 2)}`)
        }
      }

      const notStoredId = `443c815e-6b88-47b1-800f-d74d2d3004b7`;
      const notStored = [{
        node:notStoredId,
        version: sampleVersion
      }]

      const deleteResponse = await deleteBulk(server, ids.concat(notStored));
      expect(deleteResponse.statusCode).toBe(200)
      const respBody = deleteResponse.json()

      expect(respBody.ids.length).toBe(1)
      const item = respBody.ids[0];
      expect(item.type).toBe("files")
      expect(item.node).toBe(notStoredId)

      for await (const id of ids) {
        const downloadResponse = await downloadFile(server, id.node, id.version);
        expect(downloadResponse.statusCode).toBe(404)
      }
    })
  })
}
