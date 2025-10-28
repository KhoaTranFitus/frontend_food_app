import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from "./AuthNavigator";
import MainTabs from "./MainTabs";
import { AuthContext } from "../context/AuthContext";

export default function AppNavigator() {
  const { isLoggedIn } = useContext(AuthContext);

  return (
    <NavigationContainer>
      {isLoggedIn ? <MainTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
