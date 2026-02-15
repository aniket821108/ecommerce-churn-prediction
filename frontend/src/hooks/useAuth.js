import useAuthStore from '../store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, login, register, logout, loadUser, updateProfile, updatePassword } = useAuthStore();
  
  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    loadUser,
    updateProfile,
    updatePassword,
  };
};