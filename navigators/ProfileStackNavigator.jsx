import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import ProfileScreen from "../screens/ProfileScreen";
import AboutAppScreen from "../screens/AboutAppScreen";

// Thêm các screen mới (tạo file tương ứng trong /screens nếu chưa có)
import ChangePassWordScreen from "../screens/ChangePasswordScreen";
import SavedDishesScreen from "../screens/SavedDishesScreen";
import HelpSupportScreen from "../screens/HelpSupportScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import NotificationScreen from "../screens/NotificationScreen";

const Stack = createStackNavigator();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Profile Screen */}
      <Stack.Screen name="Profile" component={ProfileScreen} />

      {/* Các màn con của Profile */}
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="SavedDishes" component={SavedDishesScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePassWordScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />


      {/* Màn giới thiệu nhóm Food App */}
      <Stack.Screen name="AboutApp" component={AboutAppScreen} />
    </Stack.Navigator>
  );
}
