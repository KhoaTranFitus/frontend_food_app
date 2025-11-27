// navigators/FavoriteStackNavigator.jsx

import React from "react";
import { createStackNavigator, TransitionPresets } from "@react-navigation/stack";
import FavoriteScreen from "../screens/FavoriteScreen";
import FoodDetailScreen from "../screens/FoodDetailScreen";
import RestaurantDetailScreen from "../screens/RestaurantDetailScreen";

const Stack = createStackNavigator();

export default function FavoriteStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        // Áp dụng hiệu ứng chuyển trang mượt mà giống HomeStack
        ...TransitionPresets.SlideFromRightIOS,
        gestureEnabled: true,
        gestureDirection: "horizontal",
        presentation: "card",
      }}
    >
      {/* Màn hình chính của Stack này */}
      <Stack.Screen name="FavoriteMain" component={FavoriteScreen} />
      
      {/* Các màn hình chi tiết cần thiết để giữ người dùng ở lại Tab này */}
      <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
    </Stack.Navigator>
  );
}