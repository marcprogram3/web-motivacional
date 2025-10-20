const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const config = {
    email: process.env.EMAIL,
    pass: process.env.PASS
};

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Pàgina inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// REGISTRE d'usuari
app.post('/register', (req, res) => {
    const { name, email } = req.body;
    let users = [];
    if (!fs.existsSync('users.json')) {
        fs.writeFileSync('users.json', '[]'); // Crea fitxer buit si no existeix
    }
    if (fs.existsSync('users.json')) {
        users = JSON.parse(fs.readFileSync('users.json'));
    }
    if (users.find(u => u.email === email)) {
        return res.send(getErrorPage('Email ja registrat', 'Torna a l\'inici'));
    }
    const isAdmin = email === 'marc.program3@gmail.com';
    users.push({ name, email, isAdmin });
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    showWelcome(res, name, isAdmin);
});

// LOGIN d'usuari
app.post('/login', (req, res) => {
    const { email } = req.body;
    let users = [];
    if (!fs.existsSync('users.json')) {
        fs.writeFileSync('users.json', '[]'); // Crea fitxer buit si no existeix
    }
    if (fs.existsSync('users.json')) {
        users = JSON.parse(fs.readFileSync('users.json'));
    }
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.send(getErrorPage('Usuari no trobat', 'Registra\'t ara'));
    }
    showWelcome(res, user.name, user.isAdmin);
});

// ELIMINAR USUARI
app.post('/delete-user', (req, res) => {
    const { email } = req.body;
    let users = [];
    if (!fs.existsSync('users.json')) {
        fs.writeFileSync('users.json', '[]'); // Crea fitxer buit si no existeix
    }
    if (fs.existsSync('users.json')) {
        users = JSON.parse(fs.readFileSync('users.json'));
    }
    users = users.filter(u => u.email !== email);
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    res.redirect('/admin');
});

// PANELL ADMIN COMPLET
app.get('/admin', (req, res) => {
    let users = [];
    if (!fs.existsSync('users.json')) {
        fs.writeFileSync('users.json', '[]'); // Crea fitxer buit si no existeix
    }
    if (fs.existsSync('users.json')) {
        users = JSON.parse(fs.readFileSync('users.json'));
    }
    const totalUsers = users.length;
    const normalUsers = users.filter(u => !u.isAdmin).length;
    
    let usersList = '';
    users.forEach(user => {
        const icon = user.isAdmin ? '👑' : '👤';
        const deleteBtn = user.isAdmin ? '' : `
            <button onclick="confirmDelete('${user.email}')" class="delete-btn">
                <i class="fas fa-trash"></i> Eliminar
            </button>
        `;
        usersList += `
            <div class="user-card">
                <div class="user-info">
                    <span class="user-icon">${icon}</span>
                    <div>
                        <strong>${user.name}</strong><br>
                        <small>${user.email}</small>
                    </div>
                </div>
                <div class="user-actions">
                    <button onclick="openPersonalModal('${user.name}', '${user.email}')" 
                            class="personal-btn">
                        <i class="fas fa-envelope"></i> Personal
                    </button>
                    ${deleteBtn}
                </div>
            </div>
        `;
    });

    res.send(`
        <html><head>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
            <style>
                *{margin:0;padding:0;box-sizing:border-box;}
                body{font-family:'Poppins',sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;padding:20px;}
                .admin-panel{max-width:900px;margin:0 auto;background:rgba(255,255,255,0.95);border-radius:20px;padding:30px;box-shadow:0 20px 40px rgba(0,0,0,0.1);}
                h1{color:#333;text-align:center;margin-bottom:20px;font-size:2.5em;}
                .stats{display:flex;gap:20px;justify-content:center;margin-bottom:30px;flex-wrap:wrap;}
                .stat-card{background:linear-gradient(135deg,#ff6b6b,#ee5a52);color:white;padding:20px;border-radius:15px;text-align:center;flex:1;min-width:150px;}
                .stat-number{font-size:2em;font-weight:700;}
                .user-list{margin-top:30px;}
                .user-card{display:flex;justify-content:space-between;align-items:center;padding:20px;background:#f8f9fa;border-radius:15px;margin-bottom:15px;transition:all 0.3s;}
                .user-card:hover{transform:translateX(5px);box-shadow:0 5px 15px rgba(0,0,0,0.1);}
                .user-icon{font-size:2em;margin-right:15px;}
                .user-info{flex:1;display:flex;align-items:center;}
                .user-actions{display:flex;gap:10px;}
                .personal-btn{padding:10px 15px;background:linear-gradient(135deg,#28a745,#20c997);color:white;border:none;border-radius:8px;cursor:pointer;transition:all 0.3s;font-size:14px;}
                .personal-btn:hover{transform:translateY(-2px);box-shadow:0 5px 15px rgba(40,167,69,0.3);}
                .delete-btn{padding:10px 15px;background:linear-gradient(135deg,#dc3545,#c82333);color:white;border:none;border-radius:8px;cursor:pointer;transition:all 0.3s;font-size:14px;}
                .delete-btn:hover{transform:translateY(-2px);box-shadow:0 5px 15px rgba(220,53,69,0.3);}
                .mass-btn{width:100%;padding:20px;background:linear-gradient(135deg,#ff6b6b,#ee5a52);color:white;border:none;border-radius:15px;font-size:18px;font-weight:600;cursor:pointer;transition:all 0.3s;margin:20px 0;}
                .mass-btn:hover{transform:translateY(-3px);box-shadow:0 15px 30px rgba(255,107,107,0.4);}
                .back-btn{display:inline-block;padding:12px 25px;background:rgba(255,255,255,0.2);color:#333;border-radius:50px;text-decoration:none;margin:20px;transition:all 0.3s;}
                .back-btn:hover{background:white;transform:translateY(-2px);}
                .modal{display:none;position:fixed;z-index:1000;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,0.5);}
                .modal-content{background:white;margin:10% auto;padding:30px;border-radius:15px;width:90%;max-width:500px;text-align:center;}
                .close{position:absolute;right:20px;top:15px;font-size:28px;cursor:pointer;}
                textarea.modal-text{width:100%;height:120px;padding:15px;border:2px solid #e1e5e9;border-radius:10px;font-family:'Poppins';margin:15px 0;}
                .modal-btn{padding:12px 25px;background:linear-gradient(135deg,#007bff,#0056b3);color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600;margin:5px;}
                .confirm-modal .modal-content{background:linear-gradient(135deg,#dc3545,#c82333);color:white;}
                .confirm-btn{background:#28a745 !important;}
            </style>
        </head><body>
            <div class="admin-panel">
                <h1><i class="fas fa-crown"></i> Panell d'Admin</h1>
                
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-number">${totalUsers}</div>
                        <div>Total Usuaris</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${normalUsers}</div>
                        <div>Per Motivar</div>
                    </div>
                </div>

                <form action="/send" method="post">
                    <textarea name="message" placeholder="✍️ Missatge per TOTS els usuaris..." style="width:100%;height:120px;padding:20px;border:2px solid #e1e5e9;border-radius:15px;font-family:'Poppins';font-size:16px;resize:vertical;margin-bottom:15px;" required></textarea>
                    <button type="submit" class="mass-btn"><i class="fas fa-broadcast-tower"></i> Enviar a TOTS</button>
                </form>

                <div class="user-list">
                    <h2 style="color:#333;margin:30px 0 15px 0;"><i class="fas fa-users"></i> Usuaris Registrats</h2>
                    ${usersList}
                </div>

                <a href="/" class="back-btn"><i class="fas fa-home"></i> Inici</a>
            </div>

            <!-- MODAL PERSONAL -->
            <div id="personalModal" class="modal">
                <div class="modal-content">
                    <span class="close" onclick="closePersonalModal()">&times;</span>
                    <h2 id="modalTitle"><i class="fas fa-envelope"></i> Missatge Personal</h2>
                    <form action="/send-personal" method="post">
                        <input type="hidden" name="email" id="modalEmail">
                        <textarea name="message" class="modal-text" placeholder="Escriu el missatge personalitzat..." required></textarea>
                        <button type="submit" class="modal-btn"><i class="fas fa-paper-plane"></i> Enviar</button>
                        <button type="button" class="modal-btn" onclick="closePersonalModal()" style="background:#6c757d;">Cancel·lar</button>
                    </form>
                </div>
            </div>

            <!-- MODAL CONFIRMACIÓ ELIMINAR -->
            <div id="deleteModal" class="modal confirm-modal">
                <div class="modal-content">
                    <span class="close" onclick="closeDeleteModal()" style="color:white;">&times;</span>
                    <h2><i class="fas fa-exclamation-triangle"></i> Eliminar Usuari?</h2>
                    <p id="deleteMessage" style="margin:20px 0;"></p>
                    <form action="/delete-user" method="post" style="display:inline;">
                        <input type="hidden" name="email" id="deleteEmail">
                        <button type="submit" class="modal-btn confirm-btn">Sí, Eliminar</button>
                    </form>
                    <button type="button" class="modal-btn" onclick="closeDeleteModal()" style="background:#6c757d;">Cancel·lar</button>
                </div>
            </div>

            <script>
                function openPersonalModal(name, email) {
                    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-envelope"></i> Missatge per ' + name;
                    document.getElementById('modalEmail').value = email;
                    document.getElementById('personalModal').style.display = 'block';
                }
                function closePersonalModal() {
                    document.getElementById('personalModal').style.display = 'none';
                }
                function confirmDelete(email) {
                    document.getElementById('deleteEmail').value = email;
                    const user = email.split('@')[0];
                    document.getElementById('deleteMessage').innerText = 'Segur que vols eliminar a ' + user + '? Ja no rebrà missatges.';
                    document.getElementById('deleteModal').style.display = 'block';
                }
                function closeDeleteModal() {
                    document.getElementById('deleteModal').style.display = 'none';
                }
            </script>
        </body></html>
    `);
});

// ENVIAMENT MASSIU
app.post('/send', async (req, res) => {
    const { message } = req.body;
    let users = [];
    if (!fs.existsSync('users.json')) {
        fs.writeFileSync('users.json', '[]'); // Crea fitxer buit si no existeix
    }
    if (fs.existsSync('users.json')) {
        users = JSON.parse(fs.readFileSync('users.json'));
    }
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: config.email, pass: config.pass },
        connectionTimeout: 60000, // 60 segons de timeout
        pool: true, // Usa pool per millorar rendiment
        rateLimit: 1 // Límits més flexibles
    });
    for (let user of users) {
        try {
            await transporter.sendMail({
                from: config.email,
                to: user.email,
                subject: '✨ Missatge Motivacional',
                text: message
            });
            console.log(`Enviat a ${user.email}`);
        } catch (error) {
            console.log(`Error enviant a ${user.email}: ${error}`);
        }
    }
    res.redirect('/admin');
});

// ENVIAMENT PERSONALITZAT
app.post('/send-personal', async (req, res) => {
    const { message, email } = req.body;
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: config.email, pass: config.pass },
        connectionTimeout: 60000, // 60 segons de timeout
        pool: true, // Usa pool per millorar rendiment
        rateLimit: 1 // Límits més flexibles
    });
    try {
        await transporter.sendMail({
            from: config.email,
            to: email,
            subject: '💌 Missatge Personal Motivacional',
            text: message
        });
        res.send(`
            <html><body style="text-align:center;padding:50px;">
                <h1 style="color:#28a745;">✅ Missatge PERSONAL enviat!</h1>
                <p><strong>${message.substring(0,50)}...</strong></p>
                <a href="/admin" style="padding:15px 30px;background:#007bff;color:white;text-decoration:none;border-radius:10px;">← Tornar Admin</a>
            </body></html>
        `);
    } catch (error) {
        res.send(`
            <html><body style="text-align:center;padding:50px;color:#dc3545;">
                <h1>❌ Error enviant</h1>
                <p>${error.message}</p>
                <a href="/admin" style="padding:15px 30px;background:#007bff;color:white;text-decoration:none;border-radius:10px;">← Tornar Admin</a>
            </body></html>
        `);
    }
});

// FUNCIÓ BENVINGUT VISUAL
function showWelcome(res, name, isAdmin) {
    let adminLink = isAdmin ? `<a href="/admin" class="admin-btn"><i class="fas fa-crown"></i> Panell Admin</a>` : '';
    res.send(`
        <html><head>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
            <style>
                *{margin:0;padding:0;box-sizing:border-box;}
                body{font-family:'Poppins',sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
                .welcome{max-width:500px;width:100%;text-align:center;color:white;}
                h1{font-size:3em;margin-bottom:20px;text-shadow:2px 2px 4px rgba(0,0,0,0.3);}
                p{font-size:1.2em;margin:15px 0;font-weight:300;}
                .back-btn, .admin-btn{padding:15px 30px;background:rgba(255,255,255,0.2);color:white;border:none;border-radius:50px;cursor:pointer;font-weight:600;transition:all 0.3s;margin:10px;font-size:16px;text-decoration:none;display:inline-block;}
                .back-btn:hover, .admin-btn:hover{background:white;color:#667eea;transform:translateY(-2px);box-shadow:0 10px 25px rgba(0,0,0,0.2);}
                .admin-btn{background:linear-gradient(135deg,#ffd700,#ffed4e);color:#333;}
            </style>
        </head><body>
            <div class="welcome">
                <h1><i class="fas fa-heart"></i></h1>
                <h1>Benvingut, ${name}!</h1>
                <p>🚀 La teva motivació diària comença aquí</p>
                <p>📧 Reprem missatges inspiradors al teu email</p>
                <p>✨ Objectiu: Fer del teu dia una victòria</p>
                <br>
                ${adminLink}
                <a href="/" class="back-btn"><i class="fas fa-home"></i> Inici</a>
            </div>
        </body></html>
    `);
}

// ERROR VISUAL
function getErrorPage(title, message) {
    return `
        <html><head>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                body{font-family:'Poppins',sans-serif;background:linear-gradient(135deg,#ff6b6b,#ee5a52);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
                .error{max-width:400px;width:100%;text-align:center;color:white;}
                h1{font-size:2.5em;margin-bottom:20px;}
                p{font-size:1.2em;margin:20px 0;}
                a{padding:12px 25px;background:rgba(255,255,255,0.2);color:white;border-radius:50px;text-decoration:none;display:inline-block;transition:all 0.3s;}
                a:hover{background:white;color:#ff6b6b;transform:translateY(-2px);}
            </style>
        </head><body>
            <div class="error">
                <h1><i class="fas fa-exclamation-triangle"></i></h1>
                <h1>${title}</h1>
                <p>${message}</p>
                <a href="/">← Tornar a l\'inici</a>
            </div>
        </body></html>
    `;
}

app.listen(3000, () => {
    console.log('🚀 Servidor corrent a http://localhost:3000');
});