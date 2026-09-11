const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');
const pino = require('pino');

const app = express();
app.get('/', (req, res) => res.json({ status: 'ok' }));
app.listen(process.env.PORT || 3000);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const ai = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const ultimasMensagens = {};
const PHONE_NUMBER = "5571991698042"; 

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(PHONE_NUMBER);
                console.log(`\n========================================`);
                console.log(`SEU CÓDIGO DE PAREAMENTO DO WHATSAPP É: ${code}`);
                console.log(`========================================\n`);
            } catch (err) {
                console.error('Erro ao gerar código de pareamento:', err);
            }
        }, 4000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log('✅ WhatsApp conectado com sucesso!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message) return;

        const remoteJid = msg.key.remoteJid;
        const fromMe = msg.key.fromMe;
        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        if (!fromMe && texto) {
            ultimasMensagens[remoteJid] = texto;
        }

        if (fromMe && (texto.startsWith('/k') || texto.startsWith('/s'))) {
            const ultimaMsg = ultimasMensagens[remoteJid];
            if (!ultimaMsg) return;

            try {
                const result = await ai.generateContent(
                    "Você é um assistente engraçado, sarcástico e debocheado. Responda à seguinte mensagem do WhatsApp: " + ultimaMsg
                );
                const responseText = result.response.text();

                if (responseText) {
                    await sock.sendMessage(remoteJid, { text: responseText.trim() });
                }
            } catch (error) {
                console.error('Erro na API de Gemini:', error);
            }
        }
    });
}

connectToWhatsApp();
