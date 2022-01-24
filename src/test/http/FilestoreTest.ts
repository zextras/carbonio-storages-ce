import tap from "tap"
import { testApplication } from "../TestApplication";
import { FastifyInstance } from "fastify";
import * as fs from "fs";
import FormData from "form-data"
import { Response as LightMyRequestResponse } from "light-my-request";
import { Readable } from "stream";

const node: string = "443c815e-6b88-47b1-800f-d74d2d3004bf"
const version: number = 2

function uploadURL(node: string, version: number) {
  return `upload?node=${node}&version=${version}&type=files`
}

function downloadURL(node: string, version: number) {
  return `download?node=${node}&version=${version}&type=files`
}

function deleteURL(node: string, version: number) {
  return `delete?node=${node}&version=${version}&type=files`
}

export async function postFile(app: FastifyInstance, path: string, node: string, version: number): Promise<LightMyRequestResponse> {
  const form = new FormData();
  form.append("", fs.createReadStream(path));
  return await app.inject({
    method: "POST",
    url: uploadURL(node, version),
    headers: form.getHeaders(),
    payload: form,
  });
}

export async function putFile(app: FastifyInstance, path: string, node: string, version: number): Promise<LightMyRequestResponse> {
  const form = new FormData();
  form.append("", fs.createReadStream(path));
  return await app.inject({
    method: "PUT",
    url: uploadURL(node, version),
    headers: form.getHeaders(),
    payload: form,
  });
}

export async function downloadFile(app: FastifyInstance, node: string, version: number): Promise<LightMyRequestResponse> {
  return await app.inject({
    method: "GET",
    url: downloadURL(node, version)
  });
}

export async function deleteFile(app: FastifyInstance, node: string, version: number): Promise<LightMyRequestResponse> {
  return await app.inject({
    method: "DELETE",
    url: deleteURL(node, version)
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

type Test = InstanceType<typeof tap.Test>

const testEnvironmentProviders: [string, (t: Test) => Promise<FastifyInstance>][] = [
  [" with default configuration", (t: Test) => testApplication(t)],
  [" with compressed store", (t: Test) => testApplication(t, {compress: true})],
]

for(const environmentProviderConfig of testEnvironmentProviders) {
  const [description, provider] = environmentProviderConfig

  tap.test(`upload & download ${description}`, async t => {
    const server = await provider(t)
    const filePath = `${process.cwd()}/src/test/resources/file.txt`

    const uploadResponse = await postFile(server, filePath, node, version);
    t.equal(200, uploadResponse.statusCode)

    const downloadResponse = await downloadFile(server, node, version);
    t.equal(200, downloadResponse.statusCode)
    const body = downloadResponse.body;
    t.equal(body, await streamToString(fs.createReadStream(filePath)))
  })

  tap.test(`upload & delete`, async t => {
    const server = await provider(t)
    const filePath = `${process.cwd()}/src/test/resources/file.txt`

    const uploadResponse = await postFile(server, filePath, node, version);
    t.equal(200, uploadResponse.statusCode)

    const deleteResponse = await deleteFile(server, node, version);
    t.equal(200, deleteResponse.statusCode)
  })

  tap.test(`POST: expect 409 error for same node/version`, async t => {
    const server = await provider(t)
    const filePath = `${process.cwd()}/src/test/resources/file.txt`

    const uploadResponse = await postFile(server, filePath, node, version);
    t.equal(200, uploadResponse.statusCode)

    const upload2Response = await postFile(server, filePath, node, version);
    t.equal(409, upload2Response.statusCode)
  })

  tap.test(`PUT: upload twice the same node/version`, async t => {
    const server = await provider(t)
    const filePath = `${process.cwd()}/src/test/resources/file.txt`

    const uploadResponse = await putFile(server, filePath, node, version);
    t.equal(200, uploadResponse.statusCode)

    const upload2Response = await putFile(server, filePath, node, version);
    t.equal(200, upload2Response.statusCode)
  })

  const calls = [putFile, postFile];
  for (const c of calls){
    tap.test('upload file response contains hash and size', async t => {
      const server = await provider(t)
      const filePath = `${process.cwd()}/src/test/resources/file.txt`

      const uploadResponse = await c(server, filePath, node, version);
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

    const downloadResponse = await downloadFile(server, node, version);
    t.equal(404, downloadResponse.statusCode)
  })

  tap.test(`delete missing resource`, async t => {
    const server = await provider(t)

    const deleteResponse = await deleteFile(server, node, version);
    t.equal(200, deleteResponse.statusCode)
  })
}