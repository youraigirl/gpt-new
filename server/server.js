import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';

dotenv.config();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
app.use(express.json());

let firstPrompt = '';
const promptHistory = [];

fs.readFile('first_prompt.txt', 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    firstPrompt = data.trim();
    console.log(`Loaded first prompt: ${firstPrompt}`);
});

app.get('/', async (req, res) => {
    res.status(200).send({
        message: 'This is OpenAI CodeX'
    })
})

app.post('/', async (req, res) => {
    try {
        const prompt = req.body.prompt;

        promptHistory.push(prompt);
        if (promptHistory.length > 4) {
            promptHistory.shift();
        }

        let promptWithHistory = '';
        if (firstPrompt) {
            promptWithHistory = `${firstPrompt}\n${promptHistory.join('\n')}`;
        } else {
            promptWithHistory = prompt;
            firstPrompt = promptWithHistory; // update firstPrompt to current prompt
            promptHistory.push(promptWithHistory); // add current prompt to promptHistory
            fs.writeFile('first_prompt.txt', prompt, err => {
              if (err) {
                console.error(err);
                return;
              }
              console.log(`Saved first prompt: ${prompt}`);
            });
          }

        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "user",
                content: `${promptWithHistory}` },
                {
                role: 'system',
                content: 'You are a CBD Representative Chatbot named Willie. You are here to answer questions concerning CBD laws, regulations in North Carolina. You work for PhenomWell CBD Store, https://phenomwellcbd.com, address: 704 Jake Alexander Blvd W, Salisbury, NC 28147, phone number: (980) 330-3073. You are very positive, helpful and polite CBD Representative.'
                }
            ],
            temperature: 0.5,
            max_tokens: 1000,
            top_p: 1,
            frequency_penalty: 0.5,
            presence_penalty: 0.5,
        })

        res.status(200).send({
            bot: response.data.choices[0].message.content })
    }   catch (error) {
        console.log(error);
        res.status(500).send({ error })
    }
})

app.listen(5000, () => console.log('Server is running on port http://localhost:5000'));