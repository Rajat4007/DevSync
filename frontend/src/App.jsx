import { BrowserRouter as Router,Routes,Route,Navigate } from 'react-router-dom'
import './App.css'

//sarii pages ko import krege
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import KanbanBoard from './pages/KanbanBoard'
import Profile from './pages/Profile'
import Settings from './pages/Setting'
import Landing from './pages/Landing'
import { ProtectedRoute, PublicRoute } from './components/protectedRoute'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Main Home Route - Landing Page */}
          <Route path="/" element={<Landing />} />

          {/*auth routes */}
          <Route path='/login' element={<PublicRoute><Login/></PublicRoute>} />
          <Route path='/Register' element={<PublicRoute><Register/></PublicRoute>} />

          {/*Core routes */}
          <Route path='/dashboard' element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
          <Route path='/project/:projectId' element={<ProtectedRoute><KanbanBoard/></ProtectedRoute>}/>

          {/*Profile routes */}
          <Route path='/profile' element={<ProtectedRoute><Profile/></ProtectedRoute>}/>

          {/*Profile Setting*/}
          <Route path='/settings' element={<ProtectedRoute><Settings/></ProtectedRoute>}/>
          
          {/** agr koi galat url dale toh automatically usko login pr le chalo */}
          <Route path = '*' element = {<Navigate to='/login'/>} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App

