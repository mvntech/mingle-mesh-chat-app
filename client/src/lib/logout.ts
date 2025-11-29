import { useNavigate } from "react-router-dom";
import { useApolloClient } from "@apollo/client/react";

export default function useLogout() {
  const navigate = useNavigate();
  const client = useApolloClient();

  const logout = async () => {
    localStorage.removeItem("token");
    await client.clearStore();
    navigate("/login", { replace: true });
  };

  return logout;
}
