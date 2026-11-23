/** The pre-3.2 shape of `summarize.llm`, kept only for migration. */
export interface LegacyLlmConfig {
	platform?: string
	enabled?: boolean
	model?: string
	prompt?: string
	contextTokens?: number
	maxTokens?: number
	claudeApiKey?: string
	ollamaBaseUrl?: string
	openaiBaseUrl?: string
	openaiApiKey?: string
}

/**
 * AI in Vibe: one connection, separate tasks.
 *
 * The connection is where the model lives. A task is one thing Vibe asks it to do, with
 * its own switch and its own prompt, so tuning the summary never changes what dictation
 * does to a sentence. Prompts belong to tasks, so changing the platform keeps them.
 */

export type AiPlatform = 'ollama' | 'claude' | 'openai'

export interface AiConnection {
	platform: AiPlatform
	model: string
	contextTokens: number
	claudeApiKey: string
	ollamaBaseUrl: string
	openaiBaseUrl: string
	openaiApiKey: string
}

export interface AiTask {
	enabled: boolean
	/** A preset id from `presets`, or `custom` once the prompt was edited. */
	preset: string
	prompt: string
}

export interface AiSettings {
	connection: AiConnection
	tasks: {
		summary: AiTask & { autoOnFinish: boolean }
		dictation: AiTask
	}
}

export const PLACEHOLDERS = {
	transcript: '{transcript}',
	text: '{text}',
	language: '{language}',
	speakers: '{speakers}',
} as const

const RULE = 'Output only the requested content. No introductions, explanations, or commentary.'

export interface Preset {
	id: string
	task: 'summary' | 'dictation'
	prompt: string
	/**
	 * The answer is the whole transcript reworked, not a digest of it. A long transcript is
	 * then worked piece by piece and the pieces joined, never fed back for a second pass.
	 */
	preserveLength?: boolean
}

const RULE_AR = 'أخرِج المطلوب فقط، بلا مقدمة ولا شرح ولا تعليق. اكتب بالعربية الفصحى، وحافظ على ترتيب الكلام كما ورد.'

const KEEP_SACRED = 'لا تغيّر ألفاظ الآيات القرآنية ولا الأحاديث ولا الأبيات والمتون المحفوظة؛ انقلها كما وردت في النص.'

/** معين: ثلاثة مستويات للتلخيص، وتصحيح، وتمييز النصوص الشرعية. */
const moeeenPresets: Preset[] = [
	{
		id: 'moeeen-light',
		task: 'summary',
		preserveLength: true,
		prompt: `${RULE_AR}\n\nهذا تفريغ آلي لدرس أو محاضرة. نقِّحه تنقيحًا خفيفًا:\n- احذف التكرار العارض وكلمات الحشو (مثل: يعني، آآ، إيه) وتعثّر الكلام.\n- أصلح علامات الترقيم وقسّم الكلام إلى فقرات.\n- أبقِ عبارات المتكلم وأسلوبه وأمثلته واستدلاله كما هي، ولا تختصر المعنى.\n- ${KEEP_SACRED}\n\n"""\n{transcript}\n"""`,
	},
	{
		id: 'moeeen-medium',
		task: 'summary',
		prompt: `${RULE_AR}\n\nهذا تفريغ آلي لدرس أو محاضرة. اختصره اختصارًا وسطًا في نحو ثلث طوله، بصيغة markdown:\n- عناوين فرعية (##) لكل موضوع بالترتيب الذي تناوله المتكلم.\n- تحت كل عنوان: المسائل وأقوال العلماء التي ذكرها، وأدلته وتعليلاته باختصار.\n- ${KEEP_SACRED}\n- لا تُضِف معلومة أو حكمًا أو ترجيحًا لم يذكره المتكلم.\n\n"""\n{transcript}\n"""`,
	},
	{
		id: 'moeeen-points',
		task: 'summary',
		prompt: `${RULE_AR}\n\nهذا تفريغ آلي لدرس أو محاضرة. استخرج النقاط الأساسية بصيغة markdown:\n- سطر واحد في أوله يذكر موضوع الدرس.\n- ثم قائمة نقاط مرقّمة بالترتيب الذي وردت به، كل نقطة جملة أو جملتان.\n- اذكر الدليل مختصرًا بجانب النقطة إن ذكره المتكلم.\n- لا تُضِف شيئًا لم يذكره المتكلم.\n\n"""\n{transcript}\n"""`,
	},
	{
		id: 'moeeen-proofread',
		task: 'summary',
		preserveLength: true,
		prompt: `${RULE_AR}\n\nهذا تفريغ آلي لكلام عربي. صحّح أخطاءه فقط:\n- الأخطاء الإملائية (الهمزات، التاء المربوطة والهاء، الألف المقصورة والياء).\n- الكلمات التي أخطأ فيها التفريغ الآلي فسمعها بكلمة قريبة الصوت، إذا كان الصواب واضحًا من السياق.\n- الأخطاء النحوية الظاهرة وعلامات الترقيم.\n- لا تُعِد الصياغة، ولا تحذف، ولا تختصر، ولا تُضِف. أبقِ اللهجة العامية إن وردت.\n- ${KEEP_SACRED} وإن أخطأ التفريغ في لفظ آية مشهورة فصحّحه إلى لفظ المصحف.\n\n"""\n{transcript}\n"""`,
	},
	{
		id: 'moeeen-marks',
		task: 'summary',
		preserveLength: true,
		prompt: `${RULE_AR}\n\nأعِد هذا التفريغ كاملًا بلا حذف ولا اختصار، بصيغة markdown، مع تمييز النصوص الخاصة:\n- الآيات القرآنية: بين القوسين ﴿ ﴾ وبعدها اسم السورة ورقم الآية بين معقوفين، مثل: ﴿الحمد لله رب العالمين﴾ [الفاتحة: 2]. لا تذكر اسم السورة أو الرقم إلا إن كنت متأكدًا منهما.\n- الأحاديث النبوية: بين علامتي التنصيص « » بخط عريض.\n- الأبيات الشعرية والمنظومات: كل بيت في سطر، والشطران بينهما ثلاث نجوم (***)، والأبيات داخل اقتباس (>).\n- المتون المقروءة (كلام المصنّف الذي يقرؤه الشارح): داخل اقتباس (>) يسبقه سطر **المتن:**.\n- ${KEEP_SACRED}\n\n"""\n{transcript}\n"""`,
	},
]

/** Starting points. Picking one fills the prompt; editing the prompt makes it "custom". */
export const presets: Preset[] = [
	...moeeenPresets,
	{
		id: 'summary',
		task: 'summary',
		prompt: `${RULE}\n\nWrite a concise summary of this transcript in {language} using markdown. Include:\n- A short overview paragraph\n- 3-5 key takeaways as bullet points\n- Action items as a checklist if there are any\n\n"""\n{transcript}\n"""`,
	},
	{
		id: 'meeting-notes',
		task: 'summary',
		prompt: `${RULE}\n\nTurn this transcript into structured meeting notes in {language} using markdown. Include:\n- **Topics discussed** as headings\n- Key points under each topic\n- **Decisions** highlighted in bold\n- **Action items** as a checklist at the end\n\n"""\n{transcript}\n"""`,
	},
	{
		id: 'tldr',
		task: 'summary',
		prompt: `${RULE}\n\nWrite a TL;DR of this transcript in {language} using markdown. Start with a one-paragraph overview, then list the 3-5 most important takeaways as bold bullet points.\n\n"""\n{transcript}\n"""`,
	},
	{
		id: 'translate',
		task: 'summary',
		prompt: `${RULE}\n\nTranslate this transcript into {language} (the current app language). Preserve the original structure and formatting. Use markdown headings and paragraphs. Do not wrap the output in fenced code blocks.\n\n"""\n{transcript}\n"""`,
	},
	{
		id: 'article',
		task: 'summary',
		prompt: `${RULE}\n\nRewrite this transcript as a clean, well-structured article in {language}. Use markdown headings and paragraphs.\n\n"""\n{transcript}\n"""`,
	},
	{
		id: 'punctuation',
		task: 'dictation',
		prompt: `${RULE}\n\nThis is dictated speech. Fix punctuation, capitalization and obvious speech-to-text mistakes. Keep every word and the original language; do not add, remove, translate, summarize or rephrase anything. Return the corrected text only.\n\n"""\n{text}\n"""`,
	},
	{
		id: 'formal',
		task: 'dictation',
		prompt: `${RULE}\n\nThis is dictated speech. Rewrite it as polished, formal prose in the same language, keeping the meaning and every fact. Return the text only.\n\n"""\n{text}\n"""`,
	},
	{
		id: 'casual',
		task: 'dictation',
		prompt: `${RULE}\n\nThis is dictated speech. Make it read like a relaxed chat message in the same language, keeping the meaning. Return the text only.\n\n"""\n{text}\n"""`,
	},
]

export function presetPrompt(id: string) {
	return presets.find((preset) => preset.id === id)?.prompt ?? ''
}

/** Whether this prompt is a preset that reworks the whole transcript rather than digesting it. */
export function preservesLength(prompt: string) {
	return presets.some((preset) => preset.preserveLength && preset.prompt === prompt)
}

export const DEFAULT_AI: AiSettings = {
	connection: {
		// معين يعمل بلا إنترنت أولًا: نموذج محلي عبر Ollama.
		platform: 'ollama',
		model: defaultModel('ollama'),
		contextTokens: 65_536,
		claudeApiKey: '',
		ollamaBaseUrl: 'http://localhost:11434',
		openaiBaseUrl: 'https://api.openai.com/v1',
		openaiApiKey: '',
	},
	tasks: {
		summary: { enabled: false, autoOnFinish: false, preset: 'moeeen-medium', prompt: presetPrompt('moeeen-medium') },
		dictation: { enabled: false, preset: 'punctuation', prompt: presetPrompt('punctuation') },
	},
}

/** The default model for a platform, so switching platforms never leaves a Claude model on Ollama. */
export function defaultModel(platform: AiPlatform) {
	return platform === 'ollama' ? 'gemma4:e2b' : platform === 'openai' ? 'gpt-5.6-luna' : 'claude-sonnet-5'
}

/** Old `%s` prompts become `{transcript}` or `{text}`; anything else is left alone. */
export function modernizePrompt(prompt: string, task: 'summary' | 'dictation') {
	return prompt.replace(/%s/g, task === 'summary' ? PLACEHOLDERS.transcript : PLACEHOLDERS.text)
}

/**
 * The single `summarize.llm` object that served both summaries and dictation becomes a
 * connection plus two tasks. Its prompt was written for summaries, so it goes there;
 * dictation gets the punctuation preset, on only if the old switch was on, since that
 * switch used to run the summary prompt over dictated text.
 */
export function migrateLegacy(legacy: LegacyLlmConfig | null | undefined, autoSummarizeOnFinish = false): AiSettings {
	if (!legacy || typeof legacy !== 'object') return DEFAULT_AI
	const platform: AiPlatform = legacy.platform === 'ollama' || legacy.platform === 'openai' ? legacy.platform : 'claude'
	const prompt = legacy.prompt?.trim() ? modernizePrompt(legacy.prompt, 'summary') : presetPrompt('summary')
	const isDefault = presets.some((preset) => preset.task === 'summary' && preset.prompt === prompt)
	return {
		connection: {
			platform,
			model: legacy.model || defaultModel(platform),
			contextTokens: legacy.contextTokens ?? DEFAULT_AI.connection.contextTokens,
			claudeApiKey: legacy.claudeApiKey ?? '',
			ollamaBaseUrl: legacy.ollamaBaseUrl || DEFAULT_AI.connection.ollamaBaseUrl,
			openaiBaseUrl: legacy.openaiBaseUrl || DEFAULT_AI.connection.openaiBaseUrl,
			openaiApiKey: legacy.openaiApiKey ?? '',
		},
		tasks: {
			summary: {
				enabled: Boolean(legacy.enabled),
				autoOnFinish: Boolean(legacy.enabled && autoSummarizeOnFinish),
				preset: isDefault ? 'summary' : 'custom',
				prompt,
			},
			dictation: { ...DEFAULT_AI.tasks.dictation, enabled: Boolean(legacy.enabled) },
		},
	}
}
