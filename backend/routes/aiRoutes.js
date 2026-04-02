const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const axios = require("axios");

router.post("/generate", authenticate, async (req, res) => {
  
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ response: "❌ Prompt is required" });
    }

    console.log("📤 Sending to Mistral AI:", prompt);

    const aiResponse = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model: "mistral-small-latest", // ✅ Use latest model
        messages: [
          {
            role: "system",
            content: `You are a quiz question generator. Generate MCQ questions in this EXACT format:

**Question 1:** [Question text here]
A) [Option 1]
B) [Option 2]
C) [Option 3]
D) [Option 4]
**Correct Answer:** A

Generate 3-5 questions based on the user's request. Be clear and educational.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 30000 // ✅ Add timeout
      }
    );

    const content = aiResponse.data.choices[0].message.content;
    
    console.log("✅ AI Response received");

    res.json({ response: content });

  } catch (error) {
    console.error("❌ AI ERROR:", error.response?.data || error.message);
    
    // ✅ Better error handling
    if (error.response?.status === 401) {
      return res.status(500).json({ response: "❌ Invalid API key. Check your .env file" });
    }
    if (error.code === 'ECONNABORTED') {
      return res.status(500).json({ response: "❌ Request timeout. Try again." });
    }
    
    res.status(500).json({ 
      response: `❌ AI generation failed: ${error.message}` 
    });
  }
});

module.exports = router;