// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import tap from "tap"
import { testApplication, TestServer } from "../TestApplication";
import * as fs from "fs";
import FormData from "form-data"
import { Response as LightMyRequestResponse } from "light-my-request";
import { Readable } from "stream";
import { CopyParameters } from "../../node/routes/types";
import { Test } from "../TestUtils";

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

const testEnvironmentProviders: [string, (t: Test) => Promise<TestServer>][] = [
  [" with default configuration", (t: Test) => testApplication(t)],
  [" with compressed store", (t: Test) => testApplication(t, {compress: true})],
]

const sampleNode1: string = "443c815e-6b88-47b1-800f-d74d2d3004bf"
const sampleNode2: string = "999c815e-6b88-47b1-999f-d74d2d3004bf"
const sampleVersion: number = 2

for(const environmentProviderConfig of testEnvironmentProviders) {
  const [description, provider] = environmentProviderConfig

  tap.test(`upload & download ${description}`, async t => {
    const server = await provider(t)
    const filePath = `${process.cwd()}/src/test/resources/file.txt`

    const uploadResponse = await postFile(server, filePath, sampleNode1, sampleVersion);
    t.equal(200, uploadResponse.statusCode)

    const downloadResponse = await downloadFile(server, sampleNode1, sampleVersion);
    t.equal(200, downloadResponse.statusCode)
    const body = downloadResponse.body;
    t.equal(body, await streamToString(fs.createReadStream(filePath)))
  })

  tap.test(`upload & delete`, async t => {
    const server = await provider(t)
    const filePath = `${process.cwd()}/src/test/resources/file.txt`

    const uploadResponse = await postFile(server, filePath, sampleNode1, sampleVersion);
    t.equal(200, uploadResponse.statusCode)

    const deleteResponse = await deleteFile(server, sampleNode1, sampleVersion);
    t.equal(200, deleteResponse.statusCode)
  })

  tap.test(`upload & copy`, async t => {
    const server = await provider(t)
    const filePath = `${process.cwd()}/src/test/resources/file.txt`

    const uploadResponse = await postFile(server, filePath, sampleNode2, sampleVersion);
    t.equal(200, uploadResponse.statusCode)

    const copyResponse = await copy(server, {
      type: "files",
      sourceNode: sampleNode2,
      sourceVersion: sampleVersion,
      destinationNode: sampleNode1,
      destinationVersion: sampleVersion
    });
    t.equal(200, copyResponse.statusCode)

    const downloadResponse1 = await downloadFile(server, sampleNode2, sampleVersion);
    t.equal(200, downloadResponse1.statusCode)

    const downloadResponse2 = await downloadFile(server, sampleNode1, sampleVersion);
    t.equal(200, downloadResponse2.statusCode)
  })

  tap.test(`upload & copy`, async t => {
    const server = await provider(t)
    const filePath = `${process.cwd()}/src/test/resources/file.txt`
    const uploadResponse = await postFile(server, filePath, sampleNode2, sampleVersion);
    t.equal(200, uploadResponse.statusCode)

    const copyResponse = await copy(server, {
      type: "files",
      sourceNode: sampleNode2,
      sourceVersion: sampleVersion,
      destinationNode: sampleNode1,
      destinationVersion: sampleVersion
    });
    t.equal(200, copyResponse.statusCode)

    const downloadResponse1 = await downloadFile(server, sampleNode2, sampleVersion);
    t.equal(200, downloadResponse1.statusCode)

    const downloadResponse2 = await downloadFile(server, sampleNode1, sampleVersion);
    t.equal(200, downloadResponse2.statusCode)
  })

  tap.test(`upload & copy chats`, async t => {
    const server = await provider(t)
    const filePath = `${process.cwd()}/src/test/resources/file.txt`

    const uploadResponse = await postChatsAttachment(server, filePath, sampleNode2);
    t.equal(200, uploadResponse.statusCode)

    const copyResponse = await copy(server, {
      type: "chats",
      sourceNode: sampleNode2,
      destinationNode: sampleNode1,
    });
    t.equal(200, copyResponse.statusCode)

    const downloadResponse1 = await downloadChatsAttachment(server, sampleNode2);
    t.equal(200, downloadResponse1.statusCode)

    const downloadResponse2 = await downloadChatsAttachment(server, sampleNode1);
    t.equal(200, downloadResponse2.statusCode)
  })

  tap.test(`upload & copy with override`, async t => {
    const server = await provider(t)
    const filePath = `${process.cwd()}/src/test/resources/file.txt`

    const uploadResponse1 = await postFile(server, filePath, sampleNode1, sampleVersion);
    t.equal(200, uploadResponse1.statusCode)

    const uploadResponse2 = await postFile(server, filePath, sampleNode2, sampleVersion);
    t.equal(200, uploadResponse2.statusCode)

    const copyResponse = await copy(server, {
      type: "files",
      sourceNode: sampleNode2,
      sourceVersion: sampleVersion,
      destinationNode: sampleNode1,
      destinationVersion: sampleVersion,
      override: true
    });
    t.equal(200, copyResponse.statusCode)
  })

  tap.test(`upload & copy fail becouse of override=false`, async t => {
    const server = await provider(t)
    const filePath = `${process.cwd()}/src/test/resources/file.txt`

    const uploadResponse1 = await postFile(server, filePath, sampleNode1, sampleVersion);
    t.equal(200, uploadResponse1.statusCode)

    const uploadResponse2 = await postFile(server, filePath, sampleNode2, sampleVersion);
    t.equal(200, uploadResponse2.statusCode)

    const copyResponse = await copy(server, {
      type: "files",
      sourceNode: sampleNode2,
      sourceVersion: sampleVersion,
      destinationNode: sampleNode1,
      destinationVersion: sampleVersion,
      override: false
    });
    t.equal(409, copyResponse.statusCode)

    const copyResponse1 = await copy(server, {
      type: "files",
      sourceNode: sampleNode2,
      sourceVersion: sampleVersion,
      destinationNode: sampleNode1,
      destinationVersion: sampleVersion,
      override: undefined
    });
    t.equal(409, copyResponse1.statusCode)
  })

  tap.test(`copy fail becouse source does not exists`, async t => {
    const server = await provider(t)

    const copyResponse = await copy(server, {
      type: "files",
      sourceNode: sampleNode2,
      sourceVersion: sampleVersion,
      destinationNode: sampleNode1,
      destinationVersion: sampleVersion,
      override: false
    });
    t.equal(404, copyResponse.statusCode)
  })

  tap.test(`POST: expect 409 error for same node/version`, async t => {
    const server = await provider(t)
    const filePath = `${process.cwd()}/src/test/resources/file.txt`

    const uploadResponse = await postFile(server, filePath, sampleNode1, sampleVersion);
    t.equal(200, uploadResponse.statusCode)

    const upload2Response = await postFile(server, filePath, sampleNode1, sampleVersion);
    t.equal(409, upload2Response.statusCode)
  })

  tap.test(`PUT: upload twice the same node/version`, async t => {
    const server = await provider(t)
    const filePath = `${process.cwd()}/src/test/resources/file.txt`

    const uploadResponse = await putFile(server, filePath, sampleNode1, sampleVersion);
    t.equal(200, uploadResponse.statusCode)

    const upload2Response = await putFile(server, filePath, sampleNode1, sampleVersion);
    t.equal(200, upload2Response.statusCode)
  })

  const calls = [putFile, postFile];
  for (const c of calls){
    tap.test('upload file response contains hash and size', async t => {
      const server = await provider(t)
      const filePath = `${process.cwd()}/src/test/resources/file.txt`

      const uploadResponse = await c(server, filePath, sampleNode1, sampleVersion);
      t.equal(uploadResponse.statusCode, 200)
      const responseBody = JSON.parse(uploadResponse.body);
      const digest = responseBody.digest
      t.equal(digest, '4f5937de8e24e473df43503273b78e6e')

      const size = responseBody.size
      t.equal(size, 17)
    })
  }

  tap.test(`download missing resource`, async t => {
    const server = await provider(t)

    const downloadResponse = await downloadFile(server, sampleNode1, sampleVersion);
    t.equal(404, downloadResponse.statusCode)
  })

  tap.test(`delete missing resource`, async t => {
    const server = await provider(t)

    const deleteResponse = await deleteFile(server, sampleNode1, sampleVersion);
    t.equal(200, deleteResponse.statusCode)
  })

  tap.test(`uploads & bulk delete`, async t => {
    const server = await provider(t)
    const filePath = `${process.cwd()}/src/test/resources/file.txt`

    const ids = [...Array(9).keys()].map( d => ({
      node:`443c815e-6b88-47b1-800f-d74d2d3004b${d}`,
      version: sampleVersion
    }))
    for await (const {node:id, version} of ids) {
      const uploadResponse = await postFile(server, filePath, id, version);
      if (uploadResponse.statusCode !== 200) {
        t.fail(`Upload failed ${JSON.stringify(uploadResponse, null, 2)}`)
      }
    }

    const deleteResponse = await deleteBulk(server, ids);
    t.equal(200, deleteResponse.statusCode)

    for await (const id of ids) {
      const downloadResponse = await downloadFile(server, id.node, id.version);
      t.equal(404, downloadResponse.statusCode)
    }
  })

  tap.test(`uploads & bulk delete, one file is not stored`, async t => {
    const server = await provider(t)
    const filePath = `${process.cwd()}/src/test/resources/file.txt`

    const ids = [...Array(5).keys()].map( d => ({
      node:`443c815e-6b88-47b1-800f-d74d2d3004b${d}`,
      version: sampleVersion
    }))
    for await (const {node:id, version} of ids) {
      const uploadResponse = await postFile(server, filePath, id, version);
      if (uploadResponse.statusCode !== 200) {
        t.fail(`Upload failed ${JSON.stringify(uploadResponse, null, 2)}`)
      }
    }

    const notStoredId = `443c815e-6b88-47b1-800f-d74d2d3004b7`;
    const notStored = [{
      node:notStoredId,
      version: sampleVersion
    }]

    const deleteResponse = await deleteBulk(server, ids.concat(notStored));
    t.equal(200, deleteResponse.statusCode)
    const respBody = deleteResponse.json()

    t.equal(respBody.ids.length, 1)
    const item = respBody.ids[0];
    t.equal(item.type, "files")
    t.equal(item.node, notStoredId)

    for await (const id of ids) {
      const downloadResponse = await downloadFile(server, id.node, id.version);
      t.equal(404, downloadResponse.statusCode)
    }
  })

}
