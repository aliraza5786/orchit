// Simulated auth store
export const isAuthenticated = () => {
  return !!localStorage.getItem("token"); // or use Pinia later
};
