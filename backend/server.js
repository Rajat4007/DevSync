const express = require('express');
const cors = require('cors');
const http = require('http');
const {Server} = require('socket.io');
require('dotenv').config({ path: __dirname + '/.env' });


const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes'); 
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

//Express app ko HTTP ke andr wrap krdiye
const server = http.createServer(app); 

//socket.io server initialize kiya aur CORS allow kiya
const io = new Server(server,{
    cors:{
        origin:"*",
        methods : ["GET","POST","PUT"]
    }
});

// Database se connect karein
connectDB();

// ye middleware add kiye taki  Ab kisi bhi controller mein req.io use kar sake
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://dev-sync-zeta.vercel.app'],
  credentials: true
}));
app.use(express.json());

//  API Routes Mount Karein
app.use('/api/auth', authRoutes); //Ab saare auth routes /api/auth se shuru honge
app.use('/api/projects',projectRoutes);
app.use('/api/tasks',taskRoutes);
app.use('/api/notifications', notificationRoutes)

// Simple Test Route
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok',
        message: 'DevSync API is running',
        version: '1.0.0'
    });
});

// 🔌 3. SOCKET.IO CONNECTION LOGIC (Radio Station)
io.on('connection', (socket) => {
    

    //  User ko uske khud ke personal room mein daalna
    socket.on('join-user', (userId) => {
        socket.join(userId);
    });

    // User jab kisi project page par aayega, toh wo us project ke "Room" mein join ho jayega
    socket.on('join-project', (projectId) => {
        socket.join(projectId);
    });

    // Jab koi task move hoga, frontend is event ko fire karega
    socket.on('task-moved', (data) => {
        // data mein hoga: { projectId, taskId, newStatus }
        // Yeh line us project room mein baithe baaki sabhi users ko notification bhej degi
        socket.to(data.projectId).emit('task-updated', data);
    });


    // jab koi task create hoga tb ye chalega
    socket.on('task-created',(data)=>{
        // data mein hoga: { projectId, task }
        // Yeh us project room ke baaki sabhi users ko naya task bhej dega
        socket.to(data.projectId).emit('task-added',data);
    });
    
    // jab koi task update hoga toh ye chalega
    socket.on('task-edited' , (data)=>{
        socket.to(data.projectId).emit('task-edited' , data);
    });
    
    //jab koi task delete hoga tb ye run krga
    socket.on('task-deleted', (data) => { 
        socket.to(data.projectId).emit('task-deleted',data);
    });

    // Jab user browser band karega
    socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is blasting off on port ${PORT}`);
});