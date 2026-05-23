const express = require('express');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── OpenAI Configuration from Environment Variables ──
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

// Initialize OpenAI client only if API key is provided
let openai = null;
if (OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    baseURL: OPENAI_BASE_URL,
  });
  console.log(`✓ OpenAI configured (model: ${OPENAI_MODEL}, baseURL: ${OPENAI_BASE_URL})`);
} else {
  console.log('⚠ No OPENAI_API_KEY set — using demo mode (mock replies)');
}

const MODES = {
  savage: {
    name: '🔥 毒舌串嘴Mode',
    prompt: 'You are a brutally savage Cantonese speaker. Generate a short, spicy, and hilarious toxic reply in Cantonese (use Hong Kong style Cantonese with colloquial terms like 你條友, 水魚, on9, 唔好意思). The reply should be funny and relatable, not genuinely offensive. Use internet slang like 膠, FF, 左膠, 好撚. Keep it 1-2 sentences max. Topic: '
  },
  passive_aggressive: {
    name: '😏 陰陽怪氣Mode',
    prompt: 'You are a master of passive-aggressive Cantonese. Generate a reply that sounds polite on the surface but is actually sarcastic and shady. Use phrases like 唔好意思你啫, 我都冇乜嘢呀你啫, 你啱呀, 當我多嘴啦. Use Hong Kong style Cantonese. Keep it 1-2 sentences. Topic: '
  },
  boomer: {
    name: '👴 老豆教仔Mode',
    prompt: 'You are an old-school Cantonese dad/boomer giving unsolicited life advice in a nagging tone. Use phrases like 我食鹽多過你食米, 你呢代人呀, 唉, 好心你啦, 唔識野. Mix in some classic boomer complaints. Keep it 1-2 sentences in Cantonese. Topic: '
  },
  corporate: {
    name: '💼 打工仔行貨Mode',
    prompt: 'You are a Hong Kong corporate HR sending a hilariously corporate-minimal-effort reply. Use corporate Cantonese phrases like 收到閣下嘅查詢, 我哋會盡快跟進處理, 唔該留意電郵通知, 感謝你嘅支持同理解. The reply should be obviously copy-paste and avoid actually addressing the issue. Keep it 1-2 sentences in Cantonese. Topic: '
  },
  simp: {
    name: '🥺 扮晒嘢Mode',
    prompt: 'You are an overly dramatic simp/flirty person in Cantonese. Use cringey pick-up lines and over-the-top flattery in Hong Kong style Cantonese. Phrases like 你咁靚, 靚到你唔敢直視, 你冇嘢呀嘛咁完美. Make it so cringey it is hilarious. Keep it 1-2 sentences. Topic: '
  }
};

// ── API: Generate with OpenAI ──
app.post('/api/generate', async (req, res) => {
  const { topic, mode } = req.body;

  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  if (!openai) {
    return res.status(503).json({ error: 'OpenAI API key not configured. Set OPENAI_API_KEY environment variable.' });
  }

  const modeConfig = MODES[mode] || MODES.savage;
  const prompt = modeConfig.prompt + topic;

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.9,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || '...AI 冇反應';
    res.json({ reply, mode: modeConfig.name });
  } catch (err) {
    console.error('OpenAI error:', err.message);
    res.status(500).json({ error: 'AI 唔睬我，一係冇錢一係壞咗 🤔' });
  }
});

// ── API: Get available modes ──
app.get('/api/modes', (req, res) => {
  const modes = Object.entries(MODES).map(([key, val]) => ({
    id: key,
    name: val.name
  }));
  res.json({ modes });
});

// ── API: Generate Demo (mock data, no API key needed) ──
app.post('/api/generate-demo', async (req, res) => {
  const { topic, mode } = req.body;

  const mockReplies = {
    savage: [
      `${topic}？你把口食咗屎未刷呀？成個垃圾筒咁款🤣`,
      `吓，${topic}你都有興趣？你個腦裝草㗎？唔怪得成日食 garbarge 啦 🥴`,
      `你同我講${topic}？你把口真係噏得出就噏，ff 無限 loop 😂`
    ],
    passive_aggressive: [
      `唔好意思你啫，${topic}我真係冇乜研究㗎，不過你咁叻梗係你啱晒啦 🙂`,
      `嗯，${topic}呀… 你講得啱㗎，我垃圾嚟㗎，冇你咁有見地 🙃`,
      `我都冇乜嘢呀，你啫係話我唔識${topic}啦？好啊，我以後唔出聲囉 😇`
    ],
    boomer: [
      `我食鹽多過你食米呀，${topic}呢啲嘢我見識過啦！你識條鐵咩👴`,
      `你而家後生仔掛住講${topic}，我當年捱世界嗰陣你仲未出世㗎！唉，`,
      `呵，${topic}？你知唔知我後生嗰陣幾辛苦？你哋班廢青真係...唉！`
    ],
    corporate: [
      `收到閣下對「${topic}」嘅查詢，我哋已經記錄在案，會盡快安排同事跟進，唔該耐心等候 🙂`,
      `感謝閣下對「${topic}」嘅關注，我哋已轉交相關部門處理，請留意電郵通知。🙏`,
      `關於「${topic}」嘅查詢，我哋非常重視，已轉交跟進同事處理，感謝你嘅支持同理解。`
    ],
    simp: [
      `你講${topic}嘅樣真係好靚仔好可愛，可唔可以同你傾多陣計？😍🥰`,
      `${topic}？吓你講咩都得㗎，你咁靚女你講咩我都聽晒你話🤤💕`,
      `我一見你講${topic}個樣就心跳加速，不如我哋講第啲嘢？🤪👉👈`
    ]
  };

  const modeReplies = mockReplies[mode] || mockReplies.savage;
  const reply = modeReplies[Math.floor(Math.random() * modeReplies.length)];

  // Simulate AI delay
  await new Promise(r => setTimeout(r, 500 + Math.random() * 500));

  const modeConfig = MODES[mode] || MODES.savage;
  res.json({ reply, mode: modeConfig.name });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`💀 毒舌回覆生成器 running on http://0.0.0.0:${PORT}`);
});
