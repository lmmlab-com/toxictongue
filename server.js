const express = require('express');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const MODES = {
  savage: {
    name: '🔥 黑面模式',
    prompt: 'You are a brutally savage Cantonese speaker. Generate a short, spicy, and hilarious toxic reply in Cantonese (use Hong Kong style Cantonese with colloquial terms like 你條友, 收皮啦, on9, 唔好扮晒嘢). The reply should be funny and relatable, not genuinely offensive. Use internet slang like 笑死, FF, 屈機, 廢時. Keep it 1-2 sentences max. Topic: '
  },
  passive_aggressive: {
    name: '😏 扮關心模式',
    prompt: 'You are a master of passive-aggressive Cantonese. Generate a reply that sounds polite on the surface but is actually sarcastic and shady. Use phrases like 好心你啦, 我都係為你好, 你啱晒, 如果你覺得開心就繼續啦. Use Hong Kong style Cantonese. Keep it 1-2 sentences. Topic: '
  },
  boomer: {
    name: '👴 老豆教仔模式',
    prompt: 'You are an old-school Cantonese dad/boomer giving unsolicited life advice in a nagging tone. Use phrases like 我後生嗰陣時, 你哋呢一代, 曬氣, 浪費時間, 唔捱得. Mix in some classic boomer complaints. Keep it 1-2 sentences in Cantonese. Topic: '
  },
  corporate: {
    name: '💼 官方標準回覆',
    prompt: 'You are a Hong Kong corporate HR sending a hilariously corporate-minimal-effort reply. Use corporate Cantonese phrases like 感謝閣下嘅查詢, 我哋會盡快跟進, 不便之處敬請原諒, 如有疑問歡迎隨時聯絡. The reply should be obviously copy-paste and avoid actually addressing the issue. Keep it 1-2 sentences in Cantonese. Topic: '
  },
  simp: {
    name: '🥺 毒向左搬模式',
    prompt: 'You are an overly dramatic simp/flirty person in Cantonese. Use cringey pick-up lines and over-the-top flattery in Hong Kong style Cantonese. Phrases like 你靚到, 見到你心跳加速, 你係我嘅全世界. Make it so cringey it is hilarious. Keep it 1-2 sentences. Topic: '
  }
};

app.post('/api/generate', async (req, res) => {
  const { topic, mode } = req.body;

  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  if (!openai) {
    return res.status(503).json({ error: 'OpenAI API key not configured' });
  }

  const modeConfig = MODES[mode] || MODES.savage;
  const prompt = modeConfig.prompt + topic;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.9,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || '...AI 語塞咗';
    res.json({ reply, mode: modeConfig.name });
  } catch (err) {
    console.error('OpenAI error:', err.message);
    res.status(500).json({ error: 'AI 斷線咗，一陣再試啦 😅' });
  }
});

app.get('/api/modes', (req, res) => {
  const modes = Object.entries(MODES).map(([key, val]) => ({
    id: key,
    name: val.name
  }));
  res.json({ modes });
});

// For demo without API key, serve mock data
app.post('/api/generate-demo', async (req, res) => {
  const { topic, mode } = req.body;

  const mockReplies = {
    savage: [
      `「${topic}」？你講嘢之前有冇用個腦諗過㗎？`,
      `嘩，你講${topic}嗰陣時個樣真係好似好專業咁，可惜內容同 garbage 冇分別 🤡`,
      `你不如專心諗吓點解你仲係單身先啦，仲講${topic}？笑死 🚬`
    ],
    passive_aggressive: [
      `好心你啦，講${topic}都唔緊要，最緊要係你開心，你話係咪先 🙂`,
      `哦，你講${topic}呀？你啱晒啦，我邊夠膽話你錯喎 🙃`,
      `我都係為你好咋，你講${topic}之前諗清楚未㗎？算啦你開心就得`
    ],
    boomer: [
      `我後生嗰陣時邊有咁多${topic}講究㗎？你哋呢一代真係唔捱得 👴`,
      `你成日掛住講${topic}，不如諗吓點樣搵多啲錢啦，曬氣！`,
      `唉，你話${topic}有用？我食鹽多過你食米，聽阿叔講啦`
    ],
    corporate: [
      `感謝閣下對「${topic}」嘅查詢，我哋會盡快安排專人跟進 🙏`,
      `就「${topic}」一事，我司已記錄在案，不便之處，敬請原諒。`,
      `如有任何關於「${topic}」嘅疑問，歡迎隨時聯絡我哋嘅客戶服務團隊。`
    ],
    simp: [
      `你講${topic}嘅時候，我覺得你連講嘢都靚過人 😍`,
      `${topic}？你講乜都得，你咁靚女，講咩我都聽 🥺👉👈`,
      `我本來唔識${topic}㗎，但係你教我嘅話，我一定學到十足十 😘`
    ]
  };

  const modeReplies = mockReplies[mode] || mockReplies.savage;
  const reply = modeReplies[Math.floor(Math.random() * modeReplies.length)];

  // Simulate delay
  await new Promise(r => setTimeout(r, 500 + Math.random() * 500));

  const modeConfig = MODES[mode] || MODES.savage;
  res.json({ reply, mode: modeConfig.name });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`毒舌回覆生成器 running on http://0.0.0.0:${PORT}`);
});
