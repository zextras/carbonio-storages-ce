// SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { Writable } from "stream";

const LINK_UNSUPPORTED = ['EPERM', 'EOPNOTSUPP', 'ENOTSUP', 'ENOSYS'];

export class AtomicFileWriter extends Writable {
  private readonly tempPath: string;
  private handle: fs.promises.FileHandle | undefined;
  private tempExists = false;

  constructor(private readonly finalPath: string, private readonly overwrite: boolean) {
    super();
    this.tempPath = path.join(path.dirname(finalPath), `.${path.basename(finalPath)}.${crypto.randomUUID()}.tmp`);
  }

  override _construct(callback: (error?: Error | null) => void): void {
    fs.promises.open(this.tempPath, 'wx')
      .then(handle => {
        this.handle = handle;
        this.tempExists = true;
        callback();
      })
      .catch(callback);
  }

  override _write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.writeAll(chunk).then(() => callback(), callback);
  }

  override _writev(chunks: { chunk: Buffer, encoding: BufferEncoding }[], callback: (error?: Error | null) => void): void {
    this.writeAll(Buffer.concat(chunks.map(c => c.chunk))).then(() => callback(), callback);
  }

  override _final(callback: (error?: Error | null) => void): void {
    this.commit().then(() => callback(), callback);
  }

  override _destroy(error: Error | null, callback: (error?: Error | null) => void): void {
    this.cleanup().then(() => callback(error), () => callback(error));
  }

  private async writeAll(buffer: Buffer): Promise<void> {
    let offset = 0;
    while (offset < buffer.length) {
      const { bytesWritten } = await this.handle!.write(buffer, offset, buffer.length - offset);
      offset += bytesWritten;
    }
  }

  private async commit(): Promise<void> {
    const handle = this.handle!;
    await handle.sync();
    this.handle = undefined;
    await handle.close();
    if (this.overwrite) {
      await fs.promises.rename(this.tempPath, this.finalPath);
      this.tempExists = false;
    } else {
      await this.linkOrFallback();
    }
    const dir = await fs.promises.open(path.dirname(this.finalPath), 'r');
    try {
      await dir.sync();
    } catch (e) {
      // Some filesystems cannot fsync a directory; the file itself is already synced.
      if (!['EBADF', 'EINVAL', 'EISDIR'].includes((e as NodeJS.ErrnoException).code ?? '')) {
        throw e;
      }
    } finally {
      await dir.close();
    }
  }

  private async linkOrFallback(): Promise<void> {
    try {
      await fs.promises.link(this.tempPath, this.finalPath);
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code ?? '';
      if (code === 'EEXIST') {
        if (!await this.sameFile()) {
          throw e;
        }
      } else if (LINK_UNSUPPORTED.includes(code)) {
        await this.renameIfAbsent();
        return;
      } else {
        throw e;
      }
    }
    await fs.promises.unlink(this.tempPath).catch(() => undefined);
    this.tempExists = false;
  }

  private async sameFile(): Promise<boolean> {
    try {
      const [temp, final] = await Promise.all([fs.promises.stat(this.tempPath), fs.promises.stat(this.finalPath)]);
      return temp.dev === final.dev && temp.ino === final.ino;
    } catch {
      return false;
    }
  }

  private async renameIfAbsent(): Promise<void> {
    const exists = await fs.promises.lstat(this.finalPath).then(() => true, () => false);
    if (exists) {
      throw Object.assign(new Error(`EEXIST: file already exists, '${this.finalPath}'`), { code: 'EEXIST', path: this.finalPath });
    }
    await fs.promises.rename(this.tempPath, this.finalPath);
    this.tempExists = false;
  }

  private async cleanup(): Promise<void> {
    const handle = this.handle;
    this.handle = undefined;
    let failure: unknown;
    if (handle !== undefined) {
      try {
        await handle.close();
      } catch (e) {
        failure = e;
      }
    }
    if (this.tempExists) {
      try {
        await fs.promises.unlink(this.tempPath);
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
          failure = failure ?? e;
        }
      }
      this.tempExists = false;
    }
    if (failure !== undefined) {
      throw failure;
    }
  }
}
