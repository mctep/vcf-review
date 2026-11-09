import { CONNECTIONS, FILE_TREE, type FsEntry, type StorageConnection } from '../mocks/connections'
import { delay } from './delay'

export type { FsEntry, StorageConnection }

export class AccessDeniedError extends Error {
  constructor(path: string) {
    super(`The service account has no read access to ${path}`)
    this.name = 'AccessDeniedError'
  }
}

export interface StorageService {
  listConnections(): Promise<StorageConnection[]>
  /** Lists a folder. `path` is relative to the connection root ('' = root). */
  browse(connectionId: string, path: string): Promise<FsEntry[]>
}

export const mockStorage: StorageService = {
  async listConnections() {
    await delay(250)
    return CONNECTIONS
  },
  async browse(connectionId, path) {
    await delay(350 + Math.random() * 300)
    const parentPath = path.split('/').slice(0, -1).join('/')
    const name = path.split('/').pop()
    const parent = FILE_TREE[`${connectionId}:${parentPath}`]
    if (path && parent?.find((e) => e.name === name)?.restricted) throw new AccessDeniedError(path)
    return FILE_TREE[`${connectionId}:${path}`] ?? []
  },
}
