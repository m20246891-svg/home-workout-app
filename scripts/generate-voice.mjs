// Озвучка упражнений: название + коротко техника, и фраза для отдыха.
// Провайдер — OpenRouter (openai/gpt-audio-mini, ключ OPENROUTER_API_KEY), иначе Gemini TTS
// (GEMINI_API_KEY; бесплатно только 10 запросов в сутки). Ключи в .env.local. Запуск:
//   node scripts/generate-voice.mjs            — сгенерировать недостающие
//   node scripts/generate-voice.mjs --force    — перегенерировать всё
// Оригиналы PCM — в .cache/voice/, в приложение — сжатый AAC (.m4a) в public/voice/.
// Список файлов для плеера пишется в src/data/voice.json.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
}
const OR_KEY = process.env.OPENROUTER_API_KEY
const KEY = process.env.GEMINI_API_KEY
if (!OR_KEY && !KEY) throw new Error('Нет OPENROUTER_API_KEY или GEMINI_API_KEY в .env.local')

const MODEL = 'gemini-2.5-flash-preview-tts'
const VOICE = process.env.TTS_VOICE || (OR_KEY ? 'onyx' : 'Charon') // мужской, уверенный
const OR_MODEL = process.env.TTS_MODEL || 'openai/gpt-audio-mini'
const STYLE = 'Скажи бодро и дружелюбно, как персональный фитнес-тренер, в спокойном темпе:'
const FORCE = process.argv.includes('--force')

// Короткая подсказка по технике. Одинаковые упражнения с разными id делят одну озвучку.
const CUES = {
  'mountain-climber': 'Скалолаз. Упор лёжа, корпус прямой. Быстро подтягивай колени к груди по очереди.',
  burpee: 'Бёрпи. Присядь, прыжком в упор лёжа, отжимание, ноги к рукам — и выпрыгни вверх.',
  'jump-squat': 'Прыжковые приседания. Присядь, мощно выпрыгни вверх и мягко приземлись на согнутые ноги.',
  pushup: 'Отжимания. Тело прямой линией, пресс напряжён. Опускай грудь к полу, локти под сорок пять градусов.',
  'russian-twist': 'Русский твист. Отклонись назад, стопы на весу. Поворачивай корпус влево и вправо.',
  'world-greatest-stretch': 'Комплексная растяжка. Из выпада опусти руку к полу, разверни корпус и вытяни другую руку вверх.',
  'butterfly-stretch': 'Бабочка. Стопы вместе, колени в стороны. Мягко дави локтями на колени, спина прямая.',
  'bodyweight-squat': 'Приседания. Ноги на ширине плеч, вес на пятках. Отводи таз назад, как будто садишься на стул.',
  'hand-plank': 'Планка на прямых руках. Ладони под плечами, пресс и ягодицы напряжены. Таз не провисает, дыши ровно.',
  'forward-lunge': 'Выпады вперёд. Широкий шаг вперёд, оба колена под прямым углом. Корпус прямо, чередуй ноги.',
  'dumbbell-seated-overhead-press': 'Жим гантелей сидя. Спина прижата, пресс напряжён. Выжимай гантели вверх и опускай под контролем.',
  'dumbbell-curl': 'Сгибания рук с гантелями. Локти прижаты к корпусу. Поднимай гантели к плечам и медленно опускай.',
  'bench-dips': 'Обратные отжимания от скамьи. Руки на краю скамьи, ноги вперёд. Сгибай локти назад и выжимай себя вверх.',
  'bodyweight-donkey-calf-raise': 'Подъёмы на носки в наклоне. Обопрись на стену или стул. Поднимись на носки как можно выше и медленно опустись.',
  'bodyweight-hip-abduction': 'Отведение ноги в сторону. Корпус ровно, пресс напряжён. Плавно отведи прямую ногу в сторону и медленно верни.',
  supermans: 'Супермен. Лёжа на животе, подними руки, грудь и ноги. Задержись на секунду и медленно опусти.',
}
const ALIASES = { 'push-up': 'pushup', 'jump-squats': 'jump-squat', 'bodyweight-russian-twist': 'russian-twist' }

const data = JSON.parse(readFileSync(join(root, 'src/data/workouts.json'), 'utf8'))
const missing = Object.keys(data.exercises).filter((id) => !CUES[ALIASES[id] || id])
if (missing.length) throw new Error(`Нет подсказки для упражнений: ${missing.join(', ')}`)

// Клипы: <key>.m4a — старт упражнения, next-<key>.m4a — во время отдыха перед ним.
const clips = []
for (const [key, cue] of Object.entries(CUES)) {
  const name = cue.split('.')[0]
  clips.push({ file: `${key}`, text: cue })
  clips.push({ file: `next-${key}`, text: `Отдых. Следующее упражнение — ${name.toLowerCase()}.` })
}

const cacheDir = join(root, '.cache/voice')
const outDir = join(root, 'public/voice')
mkdirSync(cacheDir, { recursive: true })
mkdirSync(outDir, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// OpenRouter: аудио-модель в режиме диктора. Она может «додумать» текст —
// поэтому сверяем расшифровку с заданной фразой и при расхождении повторяем.
const words = (t) => t.toLowerCase().replace(/ё/g, 'е').replace(/[^а-яa-z0-9]+/g, ' ').trim()
let spent = 0

async function ttsOpenRouter(text) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OR_KEY}` },
      body: JSON.stringify({
        model: OR_MODEL,
        modalities: ['text', 'audio'],
        audio: { voice: VOICE, format: 'pcm16' },
        stream: true,
        messages: [
          {
            role: 'system',
            content:
              'Ты диктор. Твоя единственная задача — прочитать вслух текст пользователя слово в слово, на русском, ' +
              'бодро и дружелюбно, как персональный фитнес-тренер. Не добавляй ни одного слова, не отвечай, не комментируй.',
          },
          { role: 'user', content: `Прочитай дословно: «${text}»` },
        ],
      }),
    })
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`)
    const chunks = []
    let transcript = ''
    let buf = ''
    for await (const part of res.body) {
      buf += Buffer.from(part).toString()
      let i
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim()
        buf = buf.slice(i + 1)
        if (!line.startsWith('data:') || line === 'data: [DONE]') continue
        const j = JSON.parse(line.slice(5))
        if (j.error) throw new Error(j.error.message)
        const a = j.choices?.[0]?.delta?.audio
        if (a?.data) chunks.push(Buffer.from(a.data, 'base64'))
        if (a?.transcript) transcript += a.transcript
        if (j.usage?.cost) spent += j.usage.cost
      }
    }
    if (words(transcript) === words(text)) return Buffer.concat(chunks)
    console.log(`  попытка ${attempt}: прочитано «${transcript}» — повторяю`)
  }
  throw new Error(`Модель не прочитала текст дословно: ${text}`)
}

async function tts(text) {
  if (OR_KEY) return ttsOpenRouter(text)
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${STYLE} ${text}` }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
        },
      }),
    })
    const body = await res.json().catch(() => ({}))
    const data = body.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
    if (res.ok && data) return Buffer.from(data, 'base64')
    // Бесплатный тариф ограничивает частоту запросов — ждём и повторяем.
    if ((res.status === 429 || res.status >= 500) && attempt < 6) {
      const wait = 20 * attempt
      console.log(`  ${res.status}, жду ${wait} с…`)
      await sleep(wait * 1000)
      continue
    }
    throw new Error(`${res.status} ${body.error?.message || 'нет аудио в ответе'}`)
  }
}

let made = 0
for (const clip of clips) {
  const out = join(outDir, `${clip.file}.m4a`)
  if (existsSync(out) && !FORCE) continue
  const pcm = join(cacheDir, `${clip.file}.pcm`)
  if (!existsSync(pcm) || FORCE) writeFileSync(pcm, await tts(clip.text))
  // PCM 24 кГц → AAC 64 кбит/с, тишина по краям обрезается.
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', pcm,
    '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse',
    '-c:a', 'aac', '-b:a', '64k', out,
  ])
  made++
  console.log(`✓ ${clip.file} — ${clip.text}`)
}

// Какой файл играть для какого упражнения.
const map = Object.fromEntries(Object.keys(data.exercises).map((id) => [id, ALIASES[id] || id]))
writeFileSync(join(root, 'src/data/voice.json'), JSON.stringify(map, null, 2) + '\n')
console.log(`Готово: новых клипов ${made}, всего ${clips.length}.${spent ? ` Потрачено $${spent.toFixed(4)}.` : ''}`)
