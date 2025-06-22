const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs/promises');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenAI } = require('@google/genai');

const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE',
});

const MODEL_ID = 'gemini-2.5-flash';
const upload = multer({ dest: 'uploads/' });

const PROMPT_TEMPLATE = (content, topic, numberOfQuestions, difficulty) => `
You are a data extractor.

Given the content below contains one or more multiple-choice questions, extract each question into the following JSON format **only**:

[
  {
    "question": "The question text here",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "answer": "a",
    explanation: "The explanation for the answer here"
  }
]

Rules:
- You MUST return only a valid JSON array.
- Each question must include exactly 4 options.
- The answer must be one of "a", "b", "c", or "d".
- DO NOT include markdown, explanations, headers, or any extra text.
- Topic is ${topic}, render ${numberOfQuestions} questions with difficulty ${difficulty}.

If no questions are found, return: []

Content:
${content}
`.trim();

async function generateJsonFromText(content, topic, numberOfQuestions, difficulty) {
    const contents = [{ role: 'user', parts: [{ text: PROMPT_TEMPLATE(content, topic, numberOfQuestions, difficulty) }] }];
    const response = await genAI.models.generateContent({
        model: MODEL_ID,
        contents,
        generationConfig: { responseMimeType: 'text/plain' },
    });

    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const raw = text.trim();

    let parsed = [];
    try {
        let cleanedJson = raw;

        if (cleanedJson.startsWith('```json')) {
            cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedJson.startsWith('```')) {
            cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        cleanedJson = cleanedJson.trim();

        const json = JSON.parse(cleanedJson);
        if (Array.isArray(json)) {
            parsed = json.filter(
                q => q && typeof q.question === 'string' && Array.isArray(q.options) && q.options.length === 4 && typeof q.answer === 'string'
            );
        }
    } catch (e) {
        console.warn('Failed to parse Gemini output as JSON:', e.message);
        console.warn('Raw text:', raw);
    }

    return { parsed, rawText: raw };
}

async function extractTextFromFile(file) {
    const buffer = await fs.readFile(file.path);

    if (file.mimetype === 'application/pdf') {
        const data = await pdfParse(buffer);
        return data.text;
    }

    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    }

    throw new Error('Unsupported file type for text extraction: ' + file.mimetype);
}

async function generateFromImage(buffer, mimeType, topic, numberOfQuestions, difficulty) {
    const base64Data = buffer.toString('base64');

    const contents = [
        {
            role: 'user',
            parts: [
                {
                    text: PROMPT_TEMPLATE('This image contains questions. Please extract them.', topic, numberOfQuestions, difficulty),
                },
                {
                    inlineData: { mimeType, data: base64Data },
                },
            ],
        },
    ];

    const response = await genAI.models.generateContent({
        model: MODEL_ID,
        contents,
        generationConfig: { responseMimeType: 'text/plain' },
    });

    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const raw = text.trim();

    let parsed = [];
    try {
        let cleanedJson = raw;

        if (cleanedJson.startsWith('```json')) {
            cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedJson.startsWith('```')) {
            cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        cleanedJson = cleanedJson.trim();

        const json = JSON.parse(cleanedJson);
        if (Array.isArray(json)) {
            parsed = json.filter(
                q => q && typeof q.question === 'string' && Array.isArray(q.options) && q.options.length === 4 && typeof q.answer === 'string'
            );
        }
    } catch (e) {
        console.warn('⚠️ Failed to parse image output as JSON:', e.message);
        console.warn('Raw text:', raw);
    }

    return { parsed, rawText: raw };
}

router.post('/generate-from-file', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const {
            topic,
            numberOfQuestions,
            difficulty
        } = req.body;
        if (!topic || !numberOfQuestions) {
            return res.status(400).json({ error: 'Topic and number of questions are required' });
        }
        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        const buffer = await fs.readFile(file.path);
        let result;

        if (file.mimetype.startsWith('image/')) {
            result = await generateFromImage(buffer, file.mimetype, topic, numberOfQuestions, difficulty);
        } else if (
            file.mimetype === 'application/pdf'
        ) {
            const extractedText = await extractTextFromFile(file);
            result = await generateJsonFromText(extractedText, topic, numberOfQuestions, difficulty);
        } else {
            return res.status(415).json({ error: 'Unsupported file type: ' + file.mimetype });
        }

        res.json({ answer: result });
    } catch (err) {
        console.error('File processing error:', err);

        if (err.message.includes('RESOURCE_EXHAUSTED')) {
            return res.status(429).json({
                error: 'Quota exceeded for Gemini API. Please try again later or upgrade your plan.',
            });
        }

        res.status(500).json({ error: 'Failed to process file with Gemini' });
    } finally {
        if (req.file) await fs.unlink(req.file.path);
    }
});

module.exports = router;