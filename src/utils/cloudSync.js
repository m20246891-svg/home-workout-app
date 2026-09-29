// Синхронизация данных с Telegram CloudStorage: прогресс не теряется при очистке кэша
// и переезжает на другое устройство вместе с аккаунтом Telegram.
import { readAll, writeAll, onChange } from './storage'
import { CLOUD_AVAILABLE, cloudLoad, cloudSave } from './telegram'

const SAVE_DELAY = 1500
const LOAD_TIMEOUT = 2500

// Фото аватара большое (десятки КБ) — в облако не отправляем.
function forCloud(data) {
  const copy = { ...data }
  if (copy.userProfile?.avatarPhoto) {
    copy.userProfile = { ...copy.userProfile }
    delete copy.userProfile.avatarPhoto
  }
  return copy
}

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(undefined), ms))])
}

// Вызывается до первого рендера: подтягивает более свежие данные из облака.
export async function startCloudSync() {
  if (!CLOUD_AVAILABLE) return

  const local = readAll()
  let cloud
  try {
    cloud = await withTimeout(cloudLoad(), LOAD_TIMEOUT)
  } catch {
    cloud = undefined
  }

  const localAt = local._updatedAt || 0
  if (cloud && cloud.updatedAt > localAt) {
    // Облако новее: берём его, но оставляем локальное фото аватара.
    const photo = local.userProfile?.avatarPhoto
    const merged = { ...cloud.data, _updatedAt: cloud.updatedAt }
    if (photo && merged.userProfile) merged.userProfile = { ...merged.userProfile, avatarPhoto: photo }
    writeAll(merged)
  } else if (localAt && (!cloud || localAt > cloud.updatedAt)) {
    cloudSave(forCloud(local), localAt).catch(() => {})
  }

  let timer
  onChange((data) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      cloudSave(forCloud(data), data._updatedAt).catch(() => {})
    }, SAVE_DELAY)
  })
}
