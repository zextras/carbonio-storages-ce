// SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {describe, it, expect, onTestFinished, vi} from 'vitest'
import * as fs from "fs";
import * as net from "net";
import * as crypto from "crypto";
import FormData from "form-data"
import { Response as LightMyRequestResponse } from "light-my-request";
import { pipeline } from "stream/promises";
import { Readable, Writable } from "stream";
import { AtomicFileWriter } from "../../node/filesystem/AtomicFileWriter";
import { GzipWriter } from "../../node/filesystem/GzipWrapperFilesystemAccessor";
import { mkTempFolder, testApplication, TestServer } from "../TestApplication";

const node1 = "443c815e-6b88-47b1-800f-d74d2d3004bf"
const node2 = "443c815e-6b88-47b1-999f-d74d2d3004bf"
const node3 = "999c815e-6b88-47b1-999f-d74d2d3004bf"
const node4 = "99ac815e-6b88-47b1-999f-d74d2d3004bf"
const node5 = "aa0c815e-6b88-47b1-999f-d74d2d3004bf"
const version = 1

type Environment = { app: TestServer, port: number, blobDir: (node: string) => string }

async function environment(compress: boolean): Promise<Environment> {
  const root = await mkTempFolder("storagesCEAtomic")
  onTestFinished(async () => {
    await fs.promises.rm(root, {recursive: true, force: true})
  })
  const app = await testApplication({compress, path: root})
  await app.listen({port: 0, host: '127.0.0.1'})
  const port = (app.server.address() as net.AddressInfo).port
  return { app, port, blobDir: node => `${root}/blobs/${node.substring(0, 2)}` }
}

function query(node: string) {
  return `node=${node}&version=${version}&type=files`
}

async function send(app: TestServer, method: "POST" | "PUT", node: string, content: Buffer): Promise<LightMyRequestResponse> {
  const form = new FormData()
  form.append("", content, {filename: "blob.bin"})
  return app.inject({method, url: `upload?${query(node)}`, headers: form.getHeaders(), payload: form})
}

async function download(app: TestServer, node: string): Promise<LightMyRequestResponse> {
  return app.inject({method: "GET", url: `download?${query(node)}`})
}

function copyBlob(app: TestServer, source: string, destination: string, override?: boolean) {
  const extra = override === undefined ? "" : `&override=${override}`
  return app.inject({
    method: "PUT",
    url: `copy?type=files&sourceNode=${source}&sourceVersion=${version}&destinationNode=${destination}&destinationVersion=${version}${extra}`
  })
}

type PartialUpload = { socket: net.Socket, abort: () => Promise<void> }

async function startPartialUpload(port: number, method: "POST" | "PUT", node: string, sentBytes: number): Promise<PartialUpload> {
  const boundary = "----atomicTestBoundary"
  const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name=""; filename="blob.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`)
  const declaredLength = head.length + sentBytes + 5_000_000
  const socket = net.connect(port, "127.0.0.1")
  socket.on("error", () => undefined)
  await new Promise<void>(resolve => socket.once("connect", resolve))
  socket.write(`${method} /upload?${query(node)} HTTP/1.1\r\nHost: localhost\r\nContent-Type: multipart/form-data; boundary=${boundary}\r\nContent-Length: ${declaredLength}\r\n\r\n`)
  socket.write(head)
  socket.write(crypto.randomBytes(sentBytes))
  await new Promise(resolve => setTimeout(resolve, 300))
  const abort = () => new Promise<void>(resolve => {
    socket.once("close", () => resolve())
    socket.destroy()
  })
  onTestFinished(async () => { socket.destroy() })
  return { socket, abort }
}

async function eventually(check: () => Promise<boolean> | boolean, timeoutMs = 5000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await check()) {
      return true
    }
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  return check()
}

async function tempFiles(dir: string): Promise<string[]> {
  const entries = await fs.promises.readdir(dir).catch(() => [] as string[])
  return entries.filter(e => e.endsWith(".tmp"))
}

async function noTempFiles(dir: string): Promise<boolean> {
  return eventually(async () => (await tempFiles(dir)).length === 0)
}

function openTempFds(): string[] {
  return fs.readdirSync("/proc/self/fd")
    .map(fd => { try { return fs.readlinkSync(`/proc/self/fd/${fd}`) } catch { return "" } })
    .filter(target => target.endsWith(".tmp"))
}

const md5 = (b: Buffer) => crypto.createHash("md5").update(b).digest("hex")

for (const compress of [false, true]) {
  describe(`Atomic blob writes (compress=${compress})`, () => {
    const oldContent = crypto.randomBytes(3_000_000)
    const newContent = crypto.randomBytes(1_000_000)

    it("PUT over an existing key replaces the content", async () => {
      const env = await environment(compress)
      expect((await send(env.app, "POST", node1, oldContent)).statusCode).toBe(200)
      const response = await send(env.app, "PUT", node1, newContent)
      expect(response.statusCode).toBe(200)
      expect(response.json().digest).toBe(md5(newContent))
      expect((await download(env.app, node1)).rawPayload.equals(newContent)).toBe(true)
      expect(await tempFiles(env.blobDir(node1))).toEqual([])
    })

    it("POST over an existing key answers 409 and keeps the content", async () => {
      const env = await environment(compress)
      await send(env.app, "POST", node1, oldContent)
      expect((await send(env.app, "POST", node1, newContent)).statusCode).toBe(409)
      expect((await download(env.app, node1)).rawPayload.equals(oldContent)).toBe(true)
    })

    it("aborted PUT over an existing key keeps the old content and leaves no temp", async () => {
      const env = await environment(compress)
      await send(env.app, "POST", node1, oldContent)
      const partial = await startPartialUpload(env.port, "PUT", node1, 100_000)
      await partial.abort()
      expect(await noTempFiles(env.blobDir(node1))).toBe(true)
      expect((await download(env.app, node1)).rawPayload.equals(oldContent)).toBe(true)
      expect((await send(env.app, "POST", node2, newContent)).statusCode).toBe(200)
    })

    it("concurrent GET during a stalled PUT returns the old content", async () => {
      const env = await environment(compress)
      await send(env.app, "POST", node1, oldContent)
      const partial = await startPartialUpload(env.port, "PUT", node1, 100_000)
      expect(await tempFiles(env.blobDir(node1))).toHaveLength(1)
      const response = await download(env.app, node1)
      expect(response.statusCode).toBe(200)
      expect(response.rawPayload.equals(oldContent)).toBe(true)
      await partial.abort()
      expect(await noTempFiles(env.blobDir(node1))).toBe(true)
      expect((await download(env.app, node1)).rawPayload.equals(oldContent)).toBe(true)
    })

    it("aborted POST on a new key leaves nothing and a retry succeeds", async () => {
      const env = await environment(compress)
      const partial = await startPartialUpload(env.port, "POST", node1, 100_000)
      await partial.abort()
      expect(await noTempFiles(env.blobDir(node1))).toBe(true)
      expect((await download(env.app, node1)).statusCode).toBe(404)
      const retry = await send(env.app, "POST", node1, newContent)
      expect(retry.statusCode).toBe(200)
      expect((await download(env.app, node1)).rawPayload.equals(newContent)).toBe(true)
    })

    it("concurrent POSTs on the same key give exactly one 200 and one 409", async () => {
      const env = await environment(compress)
      const a = crypto.randomBytes(2_000_000)
      const b = crypto.randomBytes(2_000_000)
      const responses = await Promise.all([send(env.app, "POST", node1, a), send(env.app, "POST", node1, b)])
      const codes = responses.map(r => r.statusCode).sort()
      expect(codes).toEqual([200, 409])
      const winner = responses.find(r => r.statusCode === 200)!
      const stored = (await download(env.app, node1)).rawPayload
      expect(md5(stored)).toBe(winner.json().digest)
      expect(await tempFiles(env.blobDir(node1))).toEqual([])
    })

    it("a write error does not kill the process", async () => {
      const env = await environment(compress)
      await send(env.app, "POST", node3, oldContent)
      await fs.promises.mkdir(`${env.blobDir(node4)}/${node4}-${version}`)
      await fs.promises.writeFile(env.blobDir(node5), "not a directory")
      const failingOverwrite = await send(env.app, "PUT", node3, newContent)
      expect(failingOverwrite.statusCode).toBe(200)
      const failingCommit = await send(env.app, "PUT", node4, newContent)
      const failingMkdir = await send(env.app, "PUT", node5, newContent)
      const failingMkdirPost = await send(env.app, "POST", node5, newContent)
      expect(failingCommit.statusCode).toBeGreaterThanOrEqual(500)
      expect(failingMkdir.statusCode).toBeGreaterThanOrEqual(500)
      expect(failingMkdirPost.statusCode).toBeGreaterThanOrEqual(500)
      expect((await tempFiles(env.blobDir(node4)))).toEqual([])
      expect((await send(env.app, "POST", node1, newContent)).statusCode).toBe(200)
      expect((await download(env.app, node1)).rawPayload.equals(newContent)).toBe(true)
    })

    it("early writer failure closes the connection instead of stalling the client", async () => {
      const env = await environment(compress)
      await fs.promises.mkdir(env.blobDir(node1), {recursive: true})
      await fs.promises.writeFile(env.blobDir(node5), "not a directory")
      const boundary = "----earlyFailureBoundary"
      const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name=""; filename="blob.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`)
      const socket = net.connect(env.port, "127.0.0.1")
      let received = ""
      socket.on("data", d => { received += d.toString("latin1") })
      socket.on("error", () => undefined)
      const closed = new Promise<boolean>(resolve => {
        socket.once("close", () => resolve(true))
        socket.once("end", () => resolve(true))
        setTimeout(() => resolve(false), 5000)
      })
      await new Promise<void>(resolve => socket.once("connect", resolve))
      socket.write(`PUT /upload?${query(node5)} HTTP/1.1\r\nHost: localhost\r\nContent-Type: multipart/form-data; boundary=${boundary}\r\nContent-Length: ${head.length + 50_000_000}\r\n\r\n`)
      socket.write(head)
      const chunk = crypto.randomBytes(64 * 1024)
      const timer = setInterval(() => { if (!socket.destroyed && socket.writableLength < 1_000_000) socket.write(chunk) }, 5)
      const result = await closed
      clearInterval(timer)
      socket.destroy()
      expect(result).toBe(true)
      expect(received.split("\r\n")[0]).toMatch(/^HTTP\/1\.1 5\d\d|^$/)
    })

    it("aborted upload leaves no open fd on a temp file", async () => {
      const env = await environment(compress)
      const partial = await startPartialUpload(env.port, "POST", node1, 100_000)
      expect(openTempFds().length).toBeGreaterThan(0)
      await partial.abort()
      expect(await eventually(() => openTempFds().length === 0)).toBe(true)
    })

    it("copy without override onto an existing key answers 409 and keeps the destination", async () => {
      const env = await environment(compress)
      await send(env.app, "POST", node1, oldContent)
      await send(env.app, "POST", node2, newContent)
      expect((await copyBlob(env.app, node1, node2)).statusCode).toBe(409)
      expect((await copyBlob(env.app, node1, node2, false)).statusCode).toBe(409)
      expect((await download(env.app, node2)).rawPayload.equals(newContent)).toBe(true)
    })

    it("copy with override replaces the destination", async () => {
      const env = await environment(compress)
      await send(env.app, "POST", node1, oldContent)
      await send(env.app, "POST", node2, newContent)
      const response = await copyBlob(env.app, node1, node2, true)
      expect(response.statusCode).toBe(200)
      expect(response.json().digest).toBe(md5(oldContent))
      expect((await download(env.app, node2)).rawPayload.equals(oldContent)).toBe(true)
      expect(await tempFiles(env.blobDir(node2))).toEqual([])
    })

    it("copy onto a new key round trips", async () => {
      const env = await environment(compress)
      await send(env.app, "POST", node1, oldContent)
      expect((await copyBlob(env.app, node1, node2)).statusCode).toBe(200)
      expect((await download(env.app, node2)).rawPayload.equals(oldContent)).toBe(true)
    })

    it("copy commit conflict answers 409 and keeps the other writer's content", async () => {
      const env = await environment(compress)
      const other = crypto.randomBytes(1000)
      await send(env.app, "POST", node1, oldContent)
      const original = fs.promises.link.bind(fs.promises)
      const spy = vi.spyOn(fs.promises, "link").mockImplementationOnce(async (existing, target) => {
        await fs.promises.writeFile(target, other)
        return original(existing, target)
      })
      onTestFinished(() => { spy.mockRestore() })
      const response = await copyBlob(env.app, node1, node2)
      expect(response.statusCode).toBe(409)
      expect(fs.readFileSync(`${env.blobDir(node2)}/${node2}-${version}`).equals(other)).toBe(true)
      expect(await tempFiles(env.blobDir(node2))).toEqual([])
    })

    it("copy from an unreadable source fails without killing the process", async () => {
      const env = await environment(compress)
      await fs.promises.mkdir(`${env.blobDir(node1)}/${node1}-${version}`, {recursive: true})
      const response = await copyBlob(env.app, node1, node2)
      expect(response.statusCode).toBeGreaterThanOrEqual(500)
      expect(await noTempFiles(env.blobDir(node2))).toBe(true)
      expect((await download(env.app, node2)).statusCode).toBe(404)
      expect((await send(env.app, "POST", node3, newContent)).statusCode).toBe(200)
    })

    it("download of an unreadable blob does not kill the process", async () => {
      const env = await environment(compress)
      await fs.promises.mkdir(`${env.blobDir(node1)}/${node1}-${version}`, {recursive: true})
      await download(env.app, node1).catch(() => undefined)
      expect((await send(env.app, "POST", node3, newContent)).statusCode).toBe(200)
      expect((await download(env.app, node3)).rawPayload.equals(newContent)).toBe(true)
    })
  })
}

describe("AtomicFileWriter", () => {
  async function folder(): Promise<string> {
    const dir = await mkTempFolder("storagesCEWriter")
    onTestFinished(async () => { await fs.promises.rm(dir, {recursive: true, force: true}) })
    return dir
  }

  const code = (c: string) => Object.assign(new Error(c), {code: c})

  it("overwrite=false onto an existing file rejects with EEXIST and changes nothing", async () => {
    const dir = await folder()
    await fs.promises.writeFile(`${dir}/blob`, "old")
    await expect(pipeline(Readable.from([Buffer.from("new")]), new AtomicFileWriter(`${dir}/blob`, false))).rejects.toMatchObject({code: "EEXIST"})
    expect(fs.readFileSync(`${dir}/blob`, "utf8")).toBe("old")
    expect(await tempFiles(dir)).toEqual([])
  })

  it("a failing commit rejects and leaves no temp and the directory untouched", async () => {
    const dir = await folder()
    await fs.promises.mkdir(`${dir}/blob`)
    await fs.promises.writeFile(`${dir}/blob/inner`, "x")
    await expect(pipeline(Readable.from([Buffer.from("new")]), new AtomicFileWriter(`${dir}/blob`, true))).rejects.toThrow()
    expect(fs.readdirSync(`${dir}/blob`)).toEqual(["inner"])
    expect(await tempFiles(dir)).toEqual([])
  })

  it("falls back to rename when link is unsupported", async () => {
    const dir = await folder()
    const spy = vi.spyOn(fs.promises, "link").mockRejectedValue(code("EPERM"))
    onTestFinished(() => { spy.mockRestore() })
    await pipeline(Readable.from([Buffer.from("new")]), new AtomicFileWriter(`${dir}/blob`, false))
    expect(fs.readFileSync(`${dir}/blob`, "utf8")).toBe("new")
    expect(await tempFiles(dir)).toEqual([])
    await expect(pipeline(Readable.from([Buffer.from("again")]), new AtomicFileWriter(`${dir}/blob`, false))).rejects.toMatchObject({code: "EEXIST"})
    expect(fs.readFileSync(`${dir}/blob`, "utf8")).toBe("new")
    expect(await tempFiles(dir)).toEqual([])
  })

  it("treats EEXIST on a link that actually succeeded as success", async () => {
    const dir = await folder()
    const spy = vi.spyOn(fs.promises, "link").mockImplementationOnce(async (existing, target) => {
      fs.linkSync(existing as string, target as string)
      throw code("EEXIST")
    })
    onTestFinished(() => { spy.mockRestore() })
    await pipeline(Readable.from([Buffer.from("new")]), new AtomicFileWriter(`${dir}/blob`, false))
    expect(fs.readFileSync(`${dir}/blob`, "utf8")).toBe("new")
    expect(await tempFiles(dir)).toEqual([])
  })

  it("a failing unlink of the temp after a committed link does not fail the write", async () => {
    const dir = await folder()
    const spy = vi.spyOn(fs.promises, "unlink").mockRejectedValue(code("EIO"))
    await pipeline(Readable.from([Buffer.from("new")]), new AtomicFileWriter(`${dir}/blob`, false))
    spy.mockRestore()
    expect(fs.readFileSync(`${dir}/blob`, "utf8")).toBe("new")
  })
})

describe("GzipWriter", () => {
  const chunks = () => Array.from({length: 60}, () => crypto.randomBytes(64 * 1024))

  it("rejects without finishing when the inner writer fails in _write under backpressure", async () => {
    let calls = 0
    const inner = new Writable({
      highWaterMark: 1,
      write(_chunk, _enc, cb) {
        calls++
        if (calls > 3) { cb(new Error("boom")) } else { setTimeout(cb, 5) }
      }
    })
    const outer = new GzipWriter(inner)
    let finished = false
    outer.on("finish", () => { finished = true })
    await expect(pipeline(Readable.from(chunks()), outer)).rejects.toThrow("boom")
    expect(finished).toBe(false)
    expect(inner.destroyed).toBe(true)
  })

  it("rejects without finishing when the inner writer fails in _final", async () => {
    const inner = new Writable({
      write(_chunk, _enc, cb) { cb() },
      final(cb) { setTimeout(() => cb(new Error("final boom")), 10) }
    })
    const outer = new GzipWriter(inner)
    let finished = false
    outer.on("finish", () => { finished = true })
    await expect(pipeline(Readable.from(chunks()), outer)).rejects.toThrow("final boom")
    expect(finished).toBe(false)
  })
})
