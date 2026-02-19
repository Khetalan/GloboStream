import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configurer axios pour inclure le token dans toutes les requêtes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Charger les données utilisateur depuis le backend
      const response = await axios.get('/api/users/me');
      
      // S'assurer que privilegeLevel est bien présent
      const userData = {
        ...response.data.user,
        privilegeLevel: response.data.user.privilegeLevel || 0
      };
      
      setUser(userData);
      console.log('User loaded:', userData); // Debug
      console.log('Privilege level:', userData.privilegeLevel); // Debug
      
    } catch (error) {
      console.error('Error loading user:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // S'assurer que privilegeLevel est présent
      const userWithPrivilege = {
        ...userData,
        privilegeLevel: userData.privilegeLevel || 0
      };
      
      setUser(userWithPrivilege);
      console.log('User logged in:', userWithPrivilege); // Debug
      console.log('Privilege level:', userWithPrivilege.privilegeLevel); // Debug
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur de connexion'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);

      const { token, user: newUser } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(newUser);
      
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de l\'inscription'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({
      ...prev,
      ...updatedData
    }));
  };

  // Fonction pour recharger l'utilisateur (utile après modification en base)
  const refreshUser = async () => {
    await loadUser();
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
