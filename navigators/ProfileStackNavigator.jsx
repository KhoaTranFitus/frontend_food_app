import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import ProfileScreen from "../screens/ProfileScreen";
import AboutAppScreen from "../screens/AboutAppScreen";   

const Stack = createStackNavigator();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      {/* Profile Screen */}
      <Stack.Screen name="Profile" component={ProfileScreen} />

      {/* Màn giới thiệu nhóm Food App */}
      <Stack.Screen name="AboutApp" component={AboutAppScreen} />

    </Stack.Navigator>
  );
}
