const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY || "AIzaSyDfxPl_aFoeW8IAAO9d8a4Zsw7VMunAlYE" });

router.get("/generate", async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent("Explain how AI works in a few words");
        const response = await result.response;
        const text = response.text();

        res.json({ answer: text });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Failed to generate content" });
    }
});

module.exports = router;
