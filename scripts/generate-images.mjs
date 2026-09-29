// Генерация картинок приложения через Nano Banana.
// Ключ в .env.local (не коммитится): OPENROUTER_API_KEY=... или GEMINI_API_KEY=...
// Запуск:
//   node scripts/generate-images.mjs                 — сгенерировать недостающие
//   node scripts/generate-images.mjs body-now-male-average day-core-1   — только эти id
//   node scripts/generate-images.mjs --force <id>    — перегенерировать
//   node scripts/generate-images.mjs --list          — показать набор
// Оригиналы PNG кладутся в .cache/images/, в приложение — сжатый WebP в public/img/.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnv() {
  const file = join(root, '.env.local')
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
}
loadEnv()

// Провайдер: OpenRouter, если есть его ключ, иначе Gemini API напрямую.
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY
const GEMINI_KEY = process.env.GEMINI_API_KEY
const PROVIDER = OPENROUTER_KEY ? 'openrouter' : 'gemini'
const MODEL = process.env.IMAGE_MODEL
  || (PROVIDER === 'openrouter' ? 'google/gemini-3.1-flash-image' : 'gemini-2.5-flash-image')

// ── Стили серий ─────────────────────────────────────────────────────────────
const NO_TEXT = 'No text, no letters, no logos, no watermark.'

// Фото тренировок: светлая квартира, мужчина (аудитория на 80% мужская).
const LIFESTYLE = [
  'Editorial fitness photography, photorealistic, shot on 35mm.',
  'Bright minimalist modern apartment, soft natural window light, warm neutral palette',
  '(white, beige, light wood) with a subtle amber accent.',
  'Athletic but realistic man around 30 in simple dark sportswear, focused and calm.',
  'Clean composition with generous empty space, subject slightly off-center.',
  'No gym machines.', NO_TEXT,
].join(' ')

// Фото тела для онбординга: одинаковый студийный кадр торса без лица.
const BODY = [
  'Studio fitness body reference photo, photorealistic.',
  'Front view of the torso only, framed from the chin to mid-thigh, face NOT visible (cropped at the chin).',
  'Standing straight, arms relaxed at the sides, neutral pose.',
  'Seamless very light warm-grey background (#F3F2F0), bright soft even studio light, subject centered, torso fills most of the frame.',
  'Tasteful, non-sexualized, natural skin.', NO_TEXT,
].join(' ')
const MALE_BODY = 'Adult man, shirtless, plain dark grey athletic shorts.'
const FEMALE_BODY = 'Adult woman, plain dark grey sports bra and dark grey high-waist leggings.'

const MASCOT = [
  'Cute stylized 3D character render, Pixar-like, soft clay materials, friendly smile.',
  'Isolated on a plain white background, soft studio light, full body visible.', NO_TEXT,
].join(' ')

// ── Набор ───────────────────────────────────────────────────────────────────
const IMAGES = []
const add = (id, aspect, prompt, style) => IMAGES.push({ id, aspect, prompt, style, out: `public/img/${id}.webp` })

// Онбординг: текущая форма тела.
const BODY_NOW = {
  male: {
    average: 'Average build, a little soft around the belly, no visible abs, moderate muscle tone.',
    soft: 'Overweight soft build with a noticeable round belly and love handles, low muscle tone.',
    slim: 'Very slim skinny build, narrow shoulders, visible collarbones, very little muscle.',
    muscular: 'Muscular athletic build, broad shoulders, defined chest and visible abs.',
  },
  female: {
    average: 'Average build, slightly soft belly, moderate tone.',
    soft: 'Curvy fuller build with a soft rounded belly, low muscle tone.',
    slim: 'Very slim slender build, narrow frame, very little muscle.',
    toned: 'Fit toned athletic build, defined arms and flat toned stomach.',
  },
}
for (const [sex, shapes] of Object.entries(BODY_NOW)) {
  for (const [shape, desc] of Object.entries(shapes)) {
    add(`body-now-${sex}-${shape}`, '1:1', `${sex === 'male' ? MALE_BODY : FEMALE_BODY} ${desc}`, BODY)
  }
}

// Онбординг: желаемая форма тела (слайдер, 5 ступеней).
const BODY_GOAL = {
  male: [
    'Lean slim build, flat stomach, light muscle definition, about 10% body fat.',
    'Fit athletic build, visible six-pack abs, defined arms and chest, about 12% body fat.',
    'Athletic muscular build, broad shoulders, strong chest, visible abs, about 14% body fat.',
    'Big muscular bodybuilder-like build, very broad shoulders, large chest and big arms, visible abs, same tight torso framing as the others.',
    'Strong powerful build, large muscles with a little softness, no visible abs, about 20% body fat.',
  ],
  female: [
    'Very thin slender build, narrow hips, slim thin arms, flat stomach with no muscle definition.',
    'Lightly toned build, flat firm stomach with faint ab lines, slim toned arms, medium hips.',
    'Athletic build, clearly visible abs, defined shoulders and arms, strong legs.',
    'Very muscular fitness-competitor build, prominent six-pack abs, big defined shoulders and biceps, muscular thighs.',
    'Curvy strong build, noticeably wider hips and fuller thighs, soft but firm waist, no visible abs.',
  ],
}
for (const [sex, list] of Object.entries(BODY_GOAL)) {
  list.forEach((desc, i) => add(`body-goal-${sex}-${i + 1}`, '1:1', `${sex === 'male' ? MALE_BODY : FEMALE_BODY} ${desc}`, BODY))
}

// Онбординг: персональный экран.
add('mascot-male', '1:1', 'A cheerful bearded man in his 30s with sunglasses, grey t-shirt and dark shorts, sitting relaxed on a light grey sofa and flexing one bicep proudly.', MASCOT)
add('mascot-female', '1:1', 'A cheerful woman in her 30s with a ponytail, grey sports top and dark leggings, sitting relaxed on a light grey sofa and flexing one bicep proudly.', MASCOT)

// 28-дневный план: обложки по типу дня, по 2 вариации.
const DAY_COVERS = {
  full: [
    'A man doing a deep bodyweight squat in the living room next to a sofa, full body visible.',
    'A man doing a forward lunge on a wooden floor near a big window, full body visible, dynamic.',
  ],
  upper: [
    'A man doing a push-up on a wooden floor, strong arms and shoulders, side view.',
    'A man doing a seated dumbbell shoulder press on a wooden bench in the living room.',
  ],
  lower: [
    'A man doing a jump squat mid-air in a bright living room, energetic, full body visible.',
    'A man doing a deep bodyweight squat, side view, focus on legs and glutes.',
  ],
  core: [
    'A man holding a forearm plank on a yoga mat in the living room, side view, full body.',
    'A man doing a russian twist on a yoga mat, seated, torso rotated, focused.',
  ],
  final: [
    'A man standing proudly after a workout in a sunlit living room, towel over shoulder, confident smile, sense of achievement.',
  ],
}
for (const [type, list] of Object.entries(DAY_COVERS)) {
  list.forEach((p, i) => add(`day-${type}-${i + 1}`, '4:3', p, LIFESTYLE))
}

// Каталог «Тренировки».
add('plan-full-body', '16:9', 'A man doing a deep bodyweight squat next to a sofa, full body visible, dynamic yet controlled movement.', LIFESTYLE)
add('generator-coach', '16:9', [
  'Stylized 3D render of a friendly athletic male fitness coach in a dark t-shirt with a whistle,',
  'his head has a glowing translucent digital brain made of amber light circuits and neural network lines,',
  'arms crossed, confident smile. Dark near-black background with subtle amber glow and floating data particles on the right side,',
  'coach positioned on the right third, empty dark space on the left for text. High quality, cinematic lighting.',
].join(' '), NO_TEXT)

// Раздел «Питание».
add('nutrition-cover', '16:9', [
  'Overhead flat lay of three healthy home-cooked meals on a light wooden table:',
  'oatmeal with pear and walnuts, grilled chicken with buckwheat and fresh vegetable salad, baked fish with potatoes and cucumber.',
  'Simple ceramic plates, linen napkin, natural window light, warm neutral palette with a subtle amber accent,',
  'editorial food photography, photorealistic, generous empty space on the left.',
].join(' '), NO_TEXT)

// Слайдер «Что ты получишь» в «Питании» — в том же стиле, что обложка; внизу слева место под подпись.
const FOOD = [
  'Editorial food photography, photorealistic, natural window light,',
  'warm neutral palette (light wood, white ceramics, linen) with a subtle amber accent,',
  'the lower left area calm and uncluttered for a caption.', NO_TEXT,
].join(' ')
add('nutrition-portions', '16:9', [
  'A plate of grilled chicken breast, rice and steamed broccoli next to a minimalist digital kitchen scale',
  'with a portion of rice on it, measuring cups, on a light wooden kitchen counter. Balanced, precise, healthy portions.',
].join(' '), FOOD)
add('nutrition-recipe', '16:9', [
  'Hands of a man in a dark t-shirt cooking at home: slicing vegetables on a wooden board, a pan with salmon',
  'and vegetables on the stove next to it, bright modern home kitchen. Face not visible.',
].join(' '), FOOD)
add('nutrition-shopping', '16:9', [
  'A paper grocery bag on a light wooden kitchen table with everyday supermarket groceries spilling out:',
  'chicken breast, eggs, buckwheat, oats, cottage cheese, tomatoes, cucumbers, apples, greens.',
].join(' '), FOOD)
add('nutrition-mealprep', '16:9', [
  'Overhead view of neatly arranged meal prep containers with healthy home-cooked meals for the week:',
  'chicken with buckwheat and vegetables, fish with potatoes, cottage cheese with berries, on a light wooden table.',
].join(' '), FOOD)

// ── Генерация ───────────────────────────────────────────────────────────────
function fullPrompt(image) {
  return `${image.prompt} ${image.style}`
}

async function generateOpenRouter(image) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENROUTER_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: fullPrompt(image) }],
      modalities: ['image', 'text'],
      image_config: { aspect_ratio: image.aspect },
    }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.error) throw new Error(`${res.status} ${body.error?.message || res.statusText}`)

  const url = body.choices?.[0]?.message?.images?.[0]?.image_url?.url
  if (!url) throw new Error(body.choices?.[0]?.finish_reason || 'нет картинки в ответе')
  return { base64: url.split(',')[1], cost: body.usage?.cost }
}

async function generateGemini(image) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt(image) }] }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: { aspectRatio: image.aspect },
        },
      }),
    },
  )
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${res.status} ${body.error?.message || res.statusText}`)

  const part = body.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)
  if (!part) {
    const reason = body.candidates?.[0]?.finishReason || body.promptFeedback?.blockReason || 'нет картинки в ответе'
    throw new Error(reason)
  }
  return { base64: part.inlineData.data }
}

// PNG-оригинал в кэш, WebP (≤1200px по длинной стороне) — в public.
function save(image, base64) {
  const raw = join(root, '.cache/images', `${image.id}.png`)
  mkdirSync(dirname(raw), { recursive: true })
  writeFileSync(raw, Buffer.from(base64, 'base64'))
  const out = join(root, image.out)
  mkdirSync(dirname(out), { recursive: true })
  execFileSync('cwebp', ['-quiet', '-q', '80', '-resize', '1200', '0', raw, '-o', out])
  return image.out
}

const args = process.argv.slice(2)
if (args.includes('--list')) {
  for (const i of IMAGES) console.log(`${existsSync(join(root, i.out)) ? '✓' : '·'} ${i.id}`)
  process.exit(0)
}
if (!OPENROUTER_KEY && !GEMINI_KEY) {
  console.error('Нет ключа. Добавь OPENROUTER_API_KEY=... или GEMINI_API_KEY=... в .env.local в корне проекта.')
  process.exit(1)
}

const force = args.includes('--force')
const only = args.filter((a) => !a.startsWith('--'))
const queue = IMAGES.filter((i) => (only.length ? only.includes(i.id) : true))
  .filter((i) => force || only.length || !existsSync(join(root, i.out)))
const generate = PROVIDER === 'openrouter' ? generateOpenRouter : generateGemini

console.log(`${PROVIDER} · ${MODEL} · ${queue.length} шт.`)
let failed = 0
let totalCost = 0
const CONCURRENCY = 4
let next = 0
async function worker() {
  while (next < queue.length) {
    const image = queue[next++]
    try {
      const { base64, cost } = await generate(image)
      if (cost) totalCost += cost
      console.log(`✓ ${image.id} → ${save(image, base64)}${cost ? ` ($${cost.toFixed(4)})` : ''}`)
    } catch (e) {
      failed++
      console.error(`✗ ${image.id}: ${e.message}`)
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker))
if (totalCost) console.log(`Итого: $${totalCost.toFixed(4)}`)
process.exit(failed ? 1 : 0)
