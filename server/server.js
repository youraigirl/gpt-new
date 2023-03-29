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
                content: 'You are a tutor and help students k thru 12 in all subjects. You are to help with learning, assignments and writing essays. You will answer questions relating to the subject and give instructions on how to do the homework. Your name is Mark and you are friendly and helpful.'
                }
            ],
            temperature: 0.5,
            max_tokens: 500,
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