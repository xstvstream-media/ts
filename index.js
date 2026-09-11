const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');
const qrcode = require('qrcode');
const pino = require('pino');

const app = express();
const PORT = process.env.PORT || 3000;

let qrCodeAtual = '';
let statusConexao = 'Desconectado ❌';

// Página web simples para mostrar o QR code bonitão no navegador
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>WhatsApp Bot - Conexão</title>
                <meta http-equiv="refresh" content="5">
                <style>
                    body { font-family: Arial; text-align: center; background: #121212; color: #fff; margin-top: 50px; }
                    h1 { color: #25D366; }
                    .box { background: #222; padding: 20px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
                </style>
            </head>
            <body>
                <div class="box">
                    <h1>Status: ${statusConexao}</h1>
                    ${qrCodeAtual ? `<h3>Escaneie o QR Code abaixo com o WhatsApp:</h3><br><img src="${qrCodeAtual}" width="300"/>` : `<h3>${statusConexao.includes('Conectado') ? 'Seu bot está pronto e online!' : 'Gerando QR Code, aguarde e atualize a página...'}</h3>`}
                </div>
            </body>
        </html>
    `);
});

app.listen(PORT, () => console.log(`Servidor web rodando na porta ${PORT}`));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const ai = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const ultimasMensagens = {};

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            // Transforma o QR code em imagem para aparecer na página web
            qrCodeAtual = await qrcode.toDataURL(qr);
            statusConexao = 'Aguardando Leitura do QR Code ⏳';
            console.log('Novo QR Code gerado com sucesso!');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
            statusConexao = 'Desconectado (Reconectando...) 🔄';
            qrCodeAtual = '';
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            statusConexao = 'Conectado com Sucesso! ✅';
            qrCodeAtual = '';
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
