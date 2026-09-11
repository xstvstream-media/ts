const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { GoogleGenAI } = require('@google/genai');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.json({ status: 'ok' }));
app.listen(process.env.PORT || 3000);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const ultimasMensagens = {};

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({ auth: state, printQRInTerminal: true });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message) return;

        const remoteJid = msg.key.remoteJid;
        const fromMe = msg.key.fromMe;
        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        // Salva a última mensagem da outra pessoa
        if (!fromMe && texto) {
            ultimasMensagens[remoteJid] = texto;
        }

        // Quando você envia "kkk"
        if (fromMe && /^k{3,}$/i.test(texto.trim())) {
            const ultimaMsg = ultimasMensagens[remoteJid];
            if (!ultimaMsg) return;

            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `Você é um assistente engraçado, sarcástico e debochado. Responda à seguinte mensagem do WhatsApp em tom de zoeira, usando no máximo 1 frase bem curta: "${ultimaMsg}"`,
                });

                if (response.text) {
                    await sock.sendMessage(remoteJid, { text: response.text.trim() });
                }
            } catch (error) {
                console.error('Erro na API do Gemini:', error);
            }
        }
    });
}

connectToWhatsApp();
